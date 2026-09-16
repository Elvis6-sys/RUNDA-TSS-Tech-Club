'use client';

import { useEffect, useState } from 'react';

// Tauri is only available in desktop app
const getTauriInvoke = () => {
  try {
    if (typeof window !== 'undefined') {
      // @ts-ignore
      return require('@tauri-apps/api/core').invoke;
    }
  } catch (e) {
    // Not available
  }
  return null;
};

type WindowMode = 'Normal' | 'SoftLock' | 'SecureLock';

export default function SecureModeIndicator() {
  const [mode, setMode] = useState<WindowMode>('Normal');
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const invoke = getTauriInvoke();
    if (!invoke) {
      // Not in Tauri app, don't show indicator
      return;
    }

    // Check current window mode
    const checkMode = async () => {
      try {
        const currentMode = await invoke('get_current_window_mode') as WindowMode;
        setMode(currentMode);
        setIsVisible(currentMode !== 'Normal');
      } catch (error) {
        console.error('Failed to get window mode:', error);
      }
    };

    checkMode();

    // Poll every 5 seconds to detect mode changes
    const interval = setInterval(checkMode, 5000);

    // Listen for mode changes from Tauri
    if (typeof window !== 'undefined' && (window as any).onSecureModeActivated) {
      (window as any).onSecureModeActivated = () => {
        setMode('SecureLock');
        setIsVisible(true);
      };
    }

    if (typeof window !== 'undefined' && (window as any).showSoftLockWarning) {
      (window as any).showSoftLockWarning = () => {
        setMode('SoftLock');
        setIsVisible(true);
      };
    }

    return () => {
      clearInterval(interval);
    };
  }, []);

  if (!isVisible) return null;

  return (
    <div
      className={`fixed top-0 left-0 right-0 z-40 pointer-events-none ${mode === 'SecureLock'
        ? 'border-4 border-red-600'
        : 'border-4 border-yellow-500'
        }`}
      style={{
        height: '100vh',
        boxSizing: 'border-box',
      }}
    >
      {/* Status Bar */}
      <div
        className={`absolute top-0 left-0 right-0 pointer-events-auto ${mode === 'SecureLock'
          ? 'bg-red-600'
          : 'bg-yellow-500'
          } text-white px-4 py-2 flex items-center justify-between shadow-lg`}
      >
        <div className="flex items-center gap-3">
          {/* Lock Icon */}
          <svg
            className="w-5 h-5"
            fill="currentColor"
            viewBox="0 0 20 20"
          >
            <path
              fillRule="evenodd"
              d="M5 9V7a5 5 0 0110 0v2a2 2 0 012 2v5a2 2 0 01-2 2H5a2 2 0 01-2-2v-5a2 2 0 012-2zm8-2v2H7V7a3 3 0 016 0z"
              clipRule="evenodd"
            />
          </svg>

          {/* Mode Text */}
          <span className="font-bold text-sm">
            {mode === 'SecureLock' ? '🔒 EXAM MODE ACTIVE' : '⚠️ PRACTICE MODE'}
          </span>
        </div>

        {/* Instructions */}
        <span className="text-xs opacity-90">
          {mode === 'SecureLock'
            ? 'Locked Mode • Use "End Exam" button to exit'
            : 'Stay in this window for best practice'}
        </span>
      </div>

      {/* Bottom Help Text (SecureLock only) */}
      {mode === 'SecureLock' && (
        <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 pointer-events-auto">
          <div className="bg-slate-900/90 backdrop-blur-sm text-white px-6 py-3 rounded-full shadow-xl border border-slate-700">
            <p className="text-sm flex items-center gap-2">
              <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                <path
                  fillRule="evenodd"
                  d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z"
                  clipRule="evenodd"
                />
              </svg>
              <span>
                Need help? Click <strong>"End Exam & Submit"</strong> button or press{' '}
                <kbd className="px-2 py-1 bg-slate-800 rounded border border-slate-600 text-xs">
                  Ctrl+Shift+Esc+Q
                </kbd>{' '}
                for 3 seconds
              </span>
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
