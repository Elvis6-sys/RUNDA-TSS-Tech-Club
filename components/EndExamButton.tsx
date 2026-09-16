'use client';

import { useState } from 'react';

interface EndExamButtonProps {
  onExamEnded?: () => void;
  className?: string;
}

export default function EndExamButton({ onExamEnded, className }: EndExamButtonProps) {
  const [showConfirmation, setShowConfirmation] = useState(false);
  const [isEnding, setIsEnding] = useState(false);

  const handleEndExamClick = () => {
    setShowConfirmation(true);
  };

  const handleConfirmEnd = async () => {
    // Only available in desktop app with Tauri
    alert('This feature is only available in the desktop app');
    setShowConfirmation(false);
  };

  const handleCancel = () => {
    setShowConfirmation(false);
  };

  return (
    <>
      {/* End Exam Button - Always visible during exam */}
      <button
        onClick={handleEndExamClick}
        disabled={isEnding}
        className={`
          px-6 py-3 rounded-lg font-semibold text-white
          bg-red-600 hover:bg-red-700 active:bg-red-800
          disabled:opacity-50 disabled:cursor-not-allowed
          transition-colors duration-200
          shadow-lg hover:shadow-xl
          flex items-center gap-2
          ${className || ''}
        `}
      >
        <svg
          className="w-5 h-5"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M6 18L18 6M6 6l12 12"
          />
        </svg>
        {isEnding ? 'Ending Exam...' : 'End Exam & Submit'}
      </button>

      {/* Confirmation Modal */}
      {showConfirmation && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
          <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-2xl max-w-md w-full mx-4 p-6 border border-slate-200 dark:border-slate-700">
            {/* Warning Icon */}
            <div className="flex justify-center mb-4">
              <div className="w-16 h-16 rounded-full bg-red-100 dark:bg-red-900/30 flex items-center justify-center">
                <svg
                  className="w-8 h-8 text-red-600 dark:text-red-400"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
                  />
                </svg>
              </div>
            </div>

            {/* Title */}
            <h2 className="text-2xl font-bold text-center mb-3 text-slate-900 dark:text-white">
              End Exam Now?
            </h2>

            {/* Message */}
            <p className="text-center text-slate-600 dark:text-slate-300 mb-6">
              Are you sure you want to end this exam? Your answers will be automatically submitted and you{' '}
              <strong className="text-red-600 dark:text-red-400">cannot return</strong> to this exam.
            </p>

            {/* Warning Box */}
            <div className="bg-red-50 dark:bg-red-900/20 border-2 border-red-300 dark:border-red-700 rounded-lg p-4 mb-6">
              <div className="flex gap-3">
                <svg
                  className="w-6 h-6 text-red-600 dark:text-red-400 flex-shrink-0 mt-0.5"
                  fill="currentColor"
                  viewBox="0 0 20 20"
                >
                  <path
                    fillRule="evenodd"
                    d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z"
                    clipRule="evenodd"
                  />
                </svg>
                <div className="text-sm text-red-900 dark:text-red-200">
                  <p className="font-bold mb-2 text-base">🚨 AUTO-SUBMIT WARNING:</p>
                  <ul className="list-disc list-inside space-y-1">
                    <li><strong>Your exam will be AUTOMATICALLY SUBMITTED</strong></li>
                    <li>You CANNOT return after exiting</li>
                    <li>Unanswered questions will be marked incomplete</li>
                    <li>This action CANNOT be undone</li>
                  </ul>
                </div>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex gap-3">
              <button
                onClick={handleCancel}
                disabled={isEnding}
                className="flex-1 px-4 py-3 rounded-lg font-semibold
                  bg-slate-200 hover:bg-slate-300 dark:bg-slate-700 dark:hover:bg-slate-600
                  text-slate-900 dark:text-white
                  disabled:opacity-50 disabled:cursor-not-allowed
                  transition-colors duration-200"
              >
                Cancel
              </button>
              <button
                onClick={handleConfirmEnd}
                disabled={isEnding}
                className="flex-1 px-4 py-3 rounded-lg font-semibold
                  bg-red-600 hover:bg-red-700 active:bg-red-800
                  text-white
                  disabled:opacity-50 disabled:cursor-not-allowed
                  transition-colors duration-200
                  flex items-center justify-center gap-2"
              >
                {isEnding ? (
                  <>
                    <svg
                      className="animate-spin h-5 w-5"
                      fill="none"
                      viewBox="0 0 24 24"
                    >
                      <circle
                        className="opacity-25"
                        cx="12"
                        cy="12"
                        r="10"
                        stroke="currentColor"
                        strokeWidth="4"
                      />
                      <path
                        className="opacity-75"
                        fill="currentColor"
                        d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                      />
                    </svg>
                    Submitting...
                  </>
                ) : (
                  'Yes, End Exam'
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
