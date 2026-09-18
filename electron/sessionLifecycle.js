/**
 * Session Lifecycle Tracking
 * 
 * Detects ungraceful terminations (force-kill, crash, power loss) by:
 * - Writing session start marker before exam begins
 * - Writing session end marker on proper submission
 * - Checking for abandoned sessions on relaunch
 * 
 * This helps detect if student force-quit the app during exam.
 */

const Store = require('electron-store');
const { v4: uuidv4 } = require('uuid');

// Session lifecycle store
const lifecycleStore = new Store.default({
  name: 'session-lifecycle',
  encryptionKey: 'runda-tss-lifecycle-2026',
  defaults: {
    activeSessions: {},
    abandonedSessions: []
  }
});

class SessionLifecycle {
  constructor() {
    this.currentSessionId = null;
  }

  /**
   * Start tracking a new exam session
   * Call this when exam mode is entered
   */
  startSession(examData) {
    const sessionId = uuidv4();
    this.currentSessionId = sessionId;

    const session = {
      sessionId,
      nodeId: examData.nodeId || null,
      blockId: examData.blockId || null,
      userId: examData.userId || null,
      assessmentType: examData.assessmentType || 'exam',
      assessmentTitle: examData.assessmentTitle || 'Assessment',
      startedAt: Date.now(),
      endedAt: null,
      endType: null, // 'normal', 'forced', 'ungraceful'
      gracefulExit: false
    };

    // Store active session
    const activeSessions = lifecycleStore.get('activeSessions', {});
    activeSessions[sessionId] = session;
    lifecycleStore.set('activeSessions', activeSessions);

    console.log(`📝 [SESSION LIFECYCLE] Started tracking session: ${sessionId}`);
    return sessionId;
  }

  /**
   * Mark session as ended gracefully (proper submission)
   * Call this when quiz is submitted or exam is properly exited
   */
  endSession(sessionId = null, endType = 'normal') {
    const sid = sessionId || this.currentSessionId;
    if (!sid) {
      console.warn('⚠️ [SESSION LIFECYCLE] No active session to end');
      return;
    }

    const activeSessions = lifecycleStore.get('activeSessions', {});
    const session = activeSessions[sid];

    if (!session) {
      console.warn(`⚠️ [SESSION LIFECYCLE] Session ${sid} not found in active sessions`);
      return;
    }

    // Mark as ended
    session.endedAt = Date.now();
    session.endType = endType;
    session.gracefulExit = true;
    session.durationMs = session.endedAt - session.startedAt;

    // Remove from active sessions
    delete activeSessions[sid];
    lifecycleStore.set('activeSessions', activeSessions);

    // Archive to completed sessions (keep last 50)
    const completed = lifecycleStore.get('completedSessions', []);
    completed.unshift(session);
    if (completed.length > 50) completed.splice(50);
    lifecycleStore.set('completedSessions', completed);

    console.log(`✅ [SESSION LIFECYCLE] Session ended gracefully: ${sid} (type: ${endType})`);
    this.currentSessionId = null;
  }

  /**
   * Check for ungraceful terminations on app launch
   * Returns array of abandoned sessions
   */
  checkForAbandonedSessions() {
    const activeSessions = lifecycleStore.get('activeSessions', {});
    const abandoned = [];

    for (const [sessionId, session] of Object.entries(activeSessions)) {
      // Session was never properly ended
      const timeSinceStart = Date.now() - session.startedAt;
      const isAbandoned = !session.gracefulExit && timeSinceStart > 60000; // 1 minute threshold

      if (isAbandoned) {
        console.warn(`🚨 [SESSION LIFECYCLE] Ungraceful exit detected: ${sessionId}`);
        console.warn(`   Started: ${new Date(session.startedAt).toISOString()}`);
        console.warn(`   Duration: ${Math.round(timeSinceStart / 1000)}s ago`);
        console.warn(`   Assessment: ${session.assessmentTitle || 'Unknown'}`);

        abandoned.push({
          ...session,
          detectedAt: Date.now(),
          timeSinceStart
        });
      }
    }

    // Move abandoned sessions to archive
    if (abandoned.length > 0) {
      const abandonedArchive = lifecycleStore.get('abandonedSessions', []);
      abandonedArchive.unshift(...abandoned);
      if (abandonedArchive.length > 50) abandonedArchive.splice(50);
      lifecycleStore.set('abandonedSessions', abandonedArchive);

      // Clear active sessions (all are now archived)
      lifecycleStore.set('activeSessions', {});
    }

    return abandoned;
  }

  /**
   * Get statistics about session lifecycle
   */
  getStats() {
    const activeSessions = lifecycleStore.get('activeSessions', {});
    const abandonedSessions = lifecycleStore.get('abandonedSessions', []);
    const completedSessions = lifecycleStore.get('completedSessions', []);

    return {
      activeCount: Object.keys(activeSessions).length,
      abandonedCount: abandonedSessions.length,
      completedCount: completedSessions.length,
      currentSessionId: this.currentSessionId,
      storePath: lifecycleStore.path
    };
  }

  /**
   * Get details of abandoned sessions
   */
  getAbandonedSessions() {
    return lifecycleStore.get('abandonedSessions', []);
  }

  /**
   * Clear old session data (cleanup)
   */
  clearOldSessions(daysOld = 30) {
    const cutoff = Date.now() - (daysOld * 24 * 60 * 60 * 1000);

    const completed = lifecycleStore.get('completedSessions', []);
    const filtered = completed.filter(s => s.startedAt > cutoff);
    lifecycleStore.set('completedSessions', filtered);

    const abandoned = lifecycleStore.get('abandonedSessions', []);
    const filteredAbandoned = abandoned.filter(s => s.startedAt > cutoff);
    lifecycleStore.set('abandonedSessions', filteredAbandoned);

    console.log(`🧹 [SESSION LIFECYCLE] Cleaned sessions older than ${daysOld} days`);
  }
}

// Singleton instance
const sessionLifecycle = new SessionLifecycle();

module.exports = sessionLifecycle;
