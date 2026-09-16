/**
 * Type definitions for Electron IPC API exposed via preload script
 */

export interface ElectronAPI {
  // Exam mode controls
  examModeEnter: (data: {
    quizId?: string;
    title?: string;
    submissionId?: string;
    startTime?: number;
    assessmentType?: string;
    assessmentTitle?: string;
    nodeId?: string;
    trackId?: string;
    blockId?: string;
    [key: string]: any; // Allow additional properties
  }) => Promise<{ success: boolean }>;

  examModeExit: () => Promise<{ success: boolean }>;

  // Emergency force-exit (fallback if examModeExit fails)
  forceExitExam: () => Promise<{ success: boolean }>;

  examModeStatus: () => Promise<{
    active: boolean;
    blurCount: number;
    lastBlur: number;
  }>;

  // Admin exit with password
  verifyAdminPassword: (password: string) => Promise<{ valid: boolean }>;

  // Auth
  signout: () => Promise<{ success: boolean }>;

  // NEW: Integrity monitoring
  markQuestionStart: (questionIdx: number) => Promise<void>;
  auditEvent: (type: string, detail?: Record<string, any>) => Promise<void>;
  setSubmissionId: (submissionId: string) => Promise<void>;

  // NEW: Crash Recovery
  recoveryStartSession: (sessionData: {
    userId: string;
    nodeId: string;
    blockId: string;
    trackId: string;
    questions?: any[];
  }) => Promise<{ sessionId: string }>;
  recoverySaveAnswer: (questionIdx: number, answer: {
    answerChoice?: number;
    answerText?: string;
    fileUrl?: string;
  }) => Promise<void>;
  recoveryUpdateTimer: (elapsedMs: number) => Promise<void>;
  recoveryUpdateQuestion: (questionIdx: number) => Promise<void>;
  recoveryEndSession: (sessionId?: string) => Promise<void>;
  recoveryCheckInterrupted: (userId: string) => Promise<{
    sessionId: string;
    userId: string;
    nodeId: string;
    blockId: string;
    trackId: string;
    totalQuestions: number;
    startTime: number;
    lastUpdateTime: number;
    elapsedMs: number;
    currentQuestionIdx: number;
    answers: Record<number, {
      answerChoice?: number;
      answerText?: string;
      fileUrl?: string;
      timestamp: number;
    }>;
    interrupted: boolean;
  } | null>;
  recoveryResumeSession: (sessionId: string) => Promise<any>;
  recoveryDiscardSession: (sessionId: string) => Promise<void>;
  recoveryGetStats: () => Promise<{
    activeSessionCount: number;
    completedSessionCount: number;
    storePath: string;
  }>;

  // NEW: Sync Queue (Offline-first submission)
  syncEnqueue: (
    type: 'quiz_submission' | 'integrity_report' | 'assignment_submission',
    payload: any,
    metadata?: {
      userId?: string;
      nodeId?: string;
      blockId?: string;
      submissionId?: string;
    }
  ) => Promise<{ queueId: string }>;
  syncGetStatus: () => Promise<{
    isOnline: boolean;
    isSyncing: boolean;
    pendingCount: number;
    completedCount: number;
    failedCount: number;
    pendingItems: Array<{
      queueId: string;
      type: string;
      metadata: any;
      retryCount: number;
      nextRetryAt: number;
      createdAt: number;
    }>;
    storePath: string;
  }>;
  syncForceNow: () => Promise<{ success: boolean }>;
  syncClearCompleted: () => Promise<{ success: boolean }>;

  // WEEK 2: Dynamic Admin PIN Management
  setAdminPin: (pin: string, expiresInMs?: number | null) => Promise<{
    success: boolean;
    error?: string;
  }>;
  clearAdminPin: () => Promise<{ success: boolean }>;
  getAdminPinStatus: () => Promise<{
    hasPin: boolean;
    isExpired: boolean;
    expiresAt: number | null;
    failedAttempts: number;
  }>;

  // WEEK 2: Session Lifecycle & Ungraceful Termination Detection
  lifecycleGetAbandonedSessions: () => Promise<{
    success: boolean;
    sessions: Array<{
      sessionId: string;
      nodeId: string | null;
      blockId: string | null;
      userId: string | null;
      assessmentType: string;
      assessmentTitle: string;
      startedAt: number;
      detectedAt: number;
      timeSinceStart: number;
    }>;
  }>;
  lifecycleGetStats: () => Promise<{
    success: boolean;
    stats: {
      activeCount: number;
      abandonedCount: number;
      completedCount: number;
      currentSessionId: string | null;
      storePath: string;
    };
  }>;
  lifecycleClearOldSessions: (daysOld?: number) => Promise<{ success: boolean }>;

  // WEEK 2: VM Detection
  vmDetect: () => Promise<{
    success: boolean;
    isVM: boolean;
    confidence: number;
    signals: string[];
    methods: string[];
    platform: string;
  }>;
  vmGetStatus: () => Promise<{
    success: boolean;
    isVM: boolean;
    confidence: number;
    vmType: string;
    signals: string[];
    methods: string[];
  }>;

  // WEEK 3: Self-Integrity Check
  integrityGetStatus: () => Promise<{
    success: boolean;
    tampered: boolean;
    tamperedFiles: Array<{
      file: string;
      expected: string;
      actual: string;
    }>;
    manifestExists: boolean;
    lastCheck: {
      ok: boolean;
      phase: string;
      reason: string | null;
    } | null;
    watchedFiles: string[];
  }>;
  integrityRebuildManifest: () => Promise<{
    success: boolean;
    error?: string;
    manifestPath?: string;
  }>;

  // Event listeners
  onAutoSubmit: (callback: (data: any) => void) => void;
  onShowAdminExitDialog: (callback: (data: any) => void) => void;
  onExamFocusLost: (callback: (data: { count: number; timestamp: number }) => void) => void;
  onSuspiciousActivity: (callback: (data: any) => void) => void;
  onSyncStatusChanged: (callback: (status: {
    isOnline: boolean;
    isSyncing: boolean;
    pendingCount: number;
    completedCount: number;
    failedCount: number;
  }) => void) => void;
}

declare global {
  interface Window {
    electronAPI?: ElectronAPI;
    isElectron?: boolean;
  }
}

export { };
