const { contextBridge, ipcRenderer } = require('electron');

// Expose protected methods that allow the renderer process to use
// ipcRenderer without exposing the entire object
contextBridge.exposeInMainWorld('electronAPI', {
  // Exam mode controls (NEW: OS-level lockdown)
  examModeEnter: (assessmentData) => ipcRenderer.invoke('exam-mode-enter', assessmentData),
  examModeExit: () => ipcRenderer.invoke('exam-mode-exit'),
  examModeStatus: () => ipcRenderer.invoke('exam-mode-status'),

  // Auth — signout clears cookies + navigates to login
  signout: () => ipcRenderer.invoke('signout'),

  // NEW: Integrity monitoring
  markQuestionStart: (questionIdx) => ipcRenderer.invoke('mark-question-start', questionIdx),
  auditEvent: (type, detail) => ipcRenderer.invoke('audit-event', type, detail),
  setSubmissionId: (submissionId) => ipcRenderer.invoke('set-submission-id', submissionId),

  // NEW: Crash Recovery
  recoveryStartSession: (sessionData) => ipcRenderer.invoke('recovery-start-session', sessionData),
  recoverySaveAnswer: (questionIdx, answer) => ipcRenderer.invoke('recovery-save-answer', questionIdx, answer),
  recoveryUpdateTimer: (elapsedMs) => ipcRenderer.invoke('recovery-update-timer', elapsedMs),
  recoveryUpdateQuestion: (questionIdx) => ipcRenderer.invoke('recovery-update-question', questionIdx),
  recoveryEndSession: (sessionId) => ipcRenderer.invoke('recovery-end-session', sessionId),
  recoveryCheckInterrupted: (userId) => ipcRenderer.invoke('recovery-check-interrupted', userId),
  recoveryResumeSession: (sessionId) => ipcRenderer.invoke('recovery-resume-session', sessionId),
  recoveryDiscardSession: (sessionId) => ipcRenderer.invoke('recovery-discard-session', sessionId),
  recoveryGetStats: () => ipcRenderer.invoke('recovery-get-stats'),

  // NEW: Sync Queue (Offline-first submission)
  syncEnqueue: (type, payload, metadata) => ipcRenderer.invoke('sync-enqueue', type, payload, metadata),
  syncGetStatus: () => ipcRenderer.invoke('sync-get-status'),
  syncForceNow: () => ipcRenderer.invoke('sync-force-now'),
  syncClearCompleted: () => ipcRenderer.invoke('sync-clear-completed'),

  // WEEK 2: Dynamic Admin PIN
  setAdminPin: (pin, expiresInMs) => ipcRenderer.invoke('set-admin-pin', pin, expiresInMs),
  clearAdminPin: () => ipcRenderer.invoke('clear-admin-pin'),
  getAdminPinStatus: () => ipcRenderer.invoke('get-admin-pin-status'),

  // WEEK 2: Session Lifecycle & Ungraceful Termination Detection
  lifecycleGetAbandonedSessions: () => ipcRenderer.invoke('lifecycle-get-abandoned-sessions'),
  lifecycleGetStats: () => ipcRenderer.invoke('lifecycle-get-stats'),
  lifecycleClearOldSessions: (daysOld) => ipcRenderer.invoke('lifecycle-clear-old-sessions', daysOld),

  // WEEK 2: VM Detection
  vmDetect: () => ipcRenderer.invoke('vm-detect'),
  vmGetStatus: () => ipcRenderer.invoke('vm-get-status'),

  // WEEK 3: Self-Integrity Check
  integrityGetStatus: () => ipcRenderer.invoke('integrity-get-status'),
  integrityRebuildManifest: () => ipcRenderer.invoke('integrity-rebuild-manifest'),

  // Open file/URL externally (system PDF viewer, browser, etc.)
  openExternal: (path) => ipcRenderer.invoke('open-external', path),

  // Listen for events
  onAutoSubmit: (callback) => {
    ipcRenderer.on('auto-submit-exam', (event, data) => callback(data));
  },
  onShowAdminExitDialog: (callback) => {
    ipcRenderer.on('show-admin-exit-dialog', (event, data) => callback(data));
  },
  onExamFocusLost: (callback) => {
    ipcRenderer.on('exam-focus-lost', (event, data) => callback(data));
  },
  onSuspiciousActivity: (callback) => {
    ipcRenderer.on('suspicious-activity', (event, data) => callback(data));
  },
  onSyncStatusChanged: (callback) => {
    ipcRenderer.on('sync-status-changed', (event, data) => callback(data));
  },
});

// Mark that we're in Electron
contextBridge.exposeInMainWorld('isElectron', true);

console.log('✅ Electron preload script loaded');
