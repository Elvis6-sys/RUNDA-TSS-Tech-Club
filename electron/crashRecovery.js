/**
 * Crash Recovery Module
 * 
 * Provides automatic crash recovery for exam sessions by persisting:
 * - Session state (nodeId, blockId, userId, startTime)
 * - All student answers (per question)
 * - Timer elapsed time
 * - Interrupted session detection
 * 
 * Uses electron-store for encrypted local persistence.
 */

const Store = require('electron-store');
const { v4: uuidv4 } = require('uuid');

// Initialize encrypted store for crash recovery
// electron-store uses default export
const recoveryStore = new Store.default({
  name: 'exam-recovery',
  encryptionKey: 'runda-tss-exam-recovery-2026', // TODO: Generate per-installation key
  defaults: {
    activeSessions: {},
    completedSessions: []
  }
});

class CrashRecovery {
  constructor() {
    this.currentSessionId = null;
  }

  /**
   * Start a new exam session and mark it as active (not ended)
   * @param {Object} sessionData - { userId, nodeId, blockId, trackId, questions }
   * @returns {string} sessionId
   */
  startSession(sessionData) {
    const sessionId = uuidv4();
    const now = Date.now();

    const session = {
      sessionId,
      userId: sessionData.userId,
      nodeId: sessionData.nodeId,
      blockId: sessionData.blockId,
      trackId: sessionData.trackId,
      totalQuestions: sessionData.questions?.length || 0,
      startTime: now,
      lastUpdateTime: now,
      elapsedMs: 0,
      currentQuestionIdx: 0,
      answers: {}, // { questionIdx: { answerChoice, answerText, fileUrl, timestamp } }
      ended: false,
      interrupted: false
    };

    // Store in active sessions
    const activeSessions = recoveryStore.get('activeSessions', {});
    activeSessions[sessionId] = session;
    recoveryStore.set('activeSessions', activeSessions);

    this.currentSessionId = sessionId;

    console.log(`✅ [CRASH RECOVERY] Session started: ${sessionId}`);
    return sessionId;
  }

  /**
   * Save an answer immediately (called on every answer change)
   * @param {string} sessionId
   * @param {number} questionIdx
   * @param {Object} answer - { answerChoice, answerText, fileUrl }
   */
  saveAnswer(sessionId, questionIdx, answer) {
    if (!sessionId) {
      console.warn('⚠️ [CRASH RECOVERY] No sessionId provided to saveAnswer');
      return;
    }

    const activeSessions = recoveryStore.get('activeSessions', {});
    const session = activeSessions[sessionId];

    if (!session) {
      console.warn(`⚠️ [CRASH RECOVERY] Session ${sessionId} not found`);
      return;
    }

    // Update answer
    session.answers[questionIdx] = {
      ...answer,
      timestamp: Date.now()
    };

    session.lastUpdateTime = Date.now();
    activeSessions[sessionId] = session;
    recoveryStore.set('activeSessions', activeSessions);

    console.log(`💾 [CRASH RECOVERY] Answer saved: Q${questionIdx} in session ${sessionId}`);
  }

  /**
   * Update timer elapsed time (called periodically)
   * @param {string} sessionId
   * @param {number} elapsedMs
   */
  updateTimer(sessionId, elapsedMs) {
    if (!sessionId) return;

    const activeSessions = recoveryStore.get('activeSessions', {});
    const session = activeSessions[sessionId];

    if (!session) return;

    session.elapsedMs = elapsedMs;
    session.lastUpdateTime = Date.now();
    activeSessions[sessionId] = session;
    recoveryStore.set('activeSessions', activeSessions);
  }

  /**
   * Update current question index (for resume positioning)
   * @param {string} sessionId
   * @param {number} questionIdx
   */
  updateCurrentQuestion(sessionId, questionIdx) {
    if (!sessionId) return;

    const activeSessions = recoveryStore.get('activeSessions', {});
    const session = activeSessions[sessionId];

    if (!session) return;

    session.currentQuestionIdx = questionIdx;
    session.lastUpdateTime = Date.now();
    activeSessions[sessionId] = session;
    recoveryStore.set('activeSessions', activeSessions);
  }

  /**
   * Mark session as successfully ended (clean exit)
   * @param {string} sessionId
   */
  endSession(sessionId) {
    if (!sessionId) return;

    const activeSessions = recoveryStore.get('activeSessions', {});
    const session = activeSessions[sessionId];

    if (!session) return;

    session.ended = true;
    session.endTime = Date.now();

    // Move to completed sessions
    const completedSessions = recoveryStore.get('completedSessions', []);
    completedSessions.push(session);
    recoveryStore.set('completedSessions', completedSessions);

    // Remove from active sessions
    delete activeSessions[sessionId];
    recoveryStore.set('activeSessions', activeSessions);

    this.currentSessionId = null;

    console.log(`✅ [CRASH RECOVERY] Session ended cleanly: ${sessionId}`);
  }

  /**
   * Check for interrupted sessions (not ended cleanly)
   * Called on app launch before any new exam starts
   * @param {string} userId - Current logged-in user
   * @returns {Object|null} - Interrupted session or null
   */
  checkForInterruptedSession(userId) {
    const activeSessions = recoveryStore.get('activeSessions', {});

    // Find any active session for this user
    const userSessions = Object.values(activeSessions).filter(s =>
      s.userId === userId && !s.ended
    );

    if (userSessions.length === 0) {
      console.log(`✅ [CRASH RECOVERY] No interrupted sessions for user ${userId}`);
      return null;
    }

    // Return most recent interrupted session
    const interruptedSession = userSessions.sort((a, b) =>
      b.lastUpdateTime - a.lastUpdateTime
    )[0];

    // Mark as interrupted
    interruptedSession.interrupted = true;
    activeSessions[interruptedSession.sessionId] = interruptedSession;
    recoveryStore.set('activeSessions', activeSessions);

    console.log(`🚨 [CRASH RECOVERY] Interrupted session detected: ${interruptedSession.sessionId}`);
    console.log(`   - Node: ${interruptedSession.nodeId}`);
    console.log(`   - Started: ${new Date(interruptedSession.startTime).toLocaleString()}`);
    console.log(`   - Elapsed: ${Math.round(interruptedSession.elapsedMs / 1000)}s`);
    console.log(`   - Answers saved: ${Object.keys(interruptedSession.answers).length}`);

    return interruptedSession;
  }

  /**
   * Get a specific session by ID
   * @param {string} sessionId
   * @returns {Object|null}
   */
  getSession(sessionId) {
    const activeSessions = recoveryStore.get('activeSessions', {});
    return activeSessions[sessionId] || null;
  }

  /**
   * Resume an interrupted session (sets it as current)
   * @param {string} sessionId
   * @returns {Object|null}
   */
  resumeSession(sessionId) {
    const session = this.getSession(sessionId);
    if (!session) {
      console.warn(`⚠️ [CRASH RECOVERY] Cannot resume: session ${sessionId} not found`);
      return null;
    }

    this.currentSessionId = sessionId;

    // Reset interrupted flag
    const activeSessions = recoveryStore.get('activeSessions', {});
    session.interrupted = false;
    session.resumedAt = Date.now();
    activeSessions[sessionId] = session;
    recoveryStore.set('activeSessions', activeSessions);

    console.log(`🔄 [CRASH RECOVERY] Session resumed: ${sessionId}`);
    return session;
  }

  /**
   * Discard an interrupted session (student chooses to start fresh)
   * @param {string} sessionId
   */
  discardSession(sessionId) {
    const activeSessions = recoveryStore.get('activeSessions', {});
    const session = activeSessions[sessionId];

    if (!session) return;

    // Mark as discarded and move to completed
    session.ended = true;
    session.discarded = true;
    session.discardedAt = Date.now();

    const completedSessions = recoveryStore.get('completedSessions', []);
    completedSessions.push(session);
    recoveryStore.set('completedSessions', completedSessions);

    // Remove from active sessions
    delete activeSessions[sessionId];
    recoveryStore.set('activeSessions', activeSessions);

    console.log(`🗑️ [CRASH RECOVERY] Session discarded: ${sessionId}`);
  }

  /**
   * Clear all recovery data (for testing/debugging)
   */
  clearAll() {
    recoveryStore.clear();
    this.currentSessionId = null;
    console.log(`🧹 [CRASH RECOVERY] All recovery data cleared`);
  }

  /**
   * Get statistics about recovery store
   * @returns {Object}
   */
  getStats() {
    const activeSessions = recoveryStore.get('activeSessions', {});
    const completedSessions = recoveryStore.get('completedSessions', []);

    return {
      activeSessionCount: Object.keys(activeSessions).length,
      completedSessionCount: completedSessions.length,
      storePath: recoveryStore.path
    };
  }
}

// Export singleton instance
module.exports = new CrashRecovery();
