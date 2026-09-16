'use client';

import { useEffect, useState } from 'react';

// Re-uses the global Window declaration from SecureExamDetector.tsx
// No need to redeclare — TypeScript merges them automatically

export default function AdminExitDialog() {
  const [isVisible, setIsVisible] = useState(false);
  const [password, setPassword] = useState('');
  const [violations, setViolations] = useState(0);
  const [duration, setDuration] = useState(0);
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    // Listen for admin exit dialog request
    if (window.electronAPI?.onShowAdminExitDialog) {
      window.electronAPI.onShowAdminExitDialog((data) => {
        console.log('🔓 Admin exit dialog requested:', data);
        setIsVisible(true);
        setViolations(data.violations || 0);
        setDuration(data.duration || 0);
        setPassword('');
        setError('');
      });
    }
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!password.trim()) {
      setError('Please enter the exit password');
      return;
    }

    setIsSubmitting(true);
    setError('');

    try {
      const isValid = await window.electronAPI!.verifyAdminPassword(password);

      if (isValid) {
        console.log('✅ Password accepted - exiting secure mode');
        setIsVisible(false);
        // Electron will auto-submit and exit
      } else {
        console.warn('❌ Invalid password');
        setError('❌ Incorrect password. Try again.');
        setPassword('');
        setViolations(prev => prev + 1); // Increment violations locally
      }
    } catch (error) {
      console.error('Error verifying password:', error);
      setError('Error verifying password. Try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCancel = () => {
    setIsVisible(false);
    setPassword('');
    setError('');
  };

  if (!isVisible) return null;

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/90 backdrop-blur-sm">
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-2xl p-8 max-w-md w-full mx-4 border-4 border-red-500">
        {/* Header */}
        <div className="flex items-center gap-3 mb-6">
          <div className="w-12 h-12 bg-red-100 dark:bg-red-900/30 rounded-full flex items-center justify-center">
            <span className="text-2xl">⚠️</span>
          </div>
          <div>
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
              Exit Secure Exam Mode
            </h2>
          </div>
        </div>

        {/* Warning Message */}
        <div className="bg-red-50 dark:bg-red-900/20 border-2 border-red-300 dark:border-red-700 rounded-lg p-4 mb-6">
          <p className="text-red-800 dark:text-red-200 font-semibold text-center mb-2">
            ⚠️ WARNING: EXITING WILL AUTO-SUBMIT YOUR EXAM
          </p>
          <p className="text-red-700 dark:text-red-300 text-sm text-center">
            Your current answers will be submitted.
          </p>
          <p className="text-red-900 dark:text-red-100 text-sm text-center font-bold mt-2">
            ❌ THERE IS NO UNDO!
          </p>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 gap-4 mb-6">
          <div className="bg-gray-100 dark:bg-gray-700 rounded-lg p-3 text-center">
            <div className="text-sm text-gray-600 dark:text-gray-400">Violations</div>
            <div className="text-2xl font-bold text-red-600 dark:text-red-400">{violations}</div>
          </div>
          <div className="bg-gray-100 dark:bg-gray-700 rounded-lg p-3 text-center">
            <div className="text-sm text-gray-600 dark:text-gray-400">Duration</div>
            <div className="text-2xl font-bold text-blue-600 dark:text-blue-400">{duration}m</div>
          </div>
        </div>

        {/* Password Input Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label htmlFor="exit-password" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Enter Exit Password:
            </label>
            <input
              id="exit-password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full px-4 py-3 border-2 border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white text-lg"
              placeholder="Enter password..."
              autoFocus
              disabled={isSubmitting}
            />
            {error && (
              <p className="mt-2 text-sm text-red-600 dark:text-red-400 font-semibold">
                {error}
              </p>
            )}
          </div>

          {/* Hint */}
          <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-300 dark:border-blue-700 rounded-lg p-3">
            <p className="text-xs text-blue-800 dark:text-blue-200">
              💡 Your teacher provided this password before the exam started.
            </p>
          </div>

          {/* Buttons */}
          <div className="flex gap-3 pt-2">
            <button
              type="button"
              onClick={handleCancel}
              className="flex-1 px-4 py-3 bg-gray-200 dark:bg-gray-700 text-gray-800 dark:text-gray-200 rounded-lg hover:bg-gray-300 dark:hover:bg-gray-600 font-semibold transition-colors"
              disabled={isSubmitting}
            >
              Cancel
            </button>
            <button
              type="submit"
              className="flex-1 px-4 py-3 bg-red-600 text-white rounded-lg hover:bg-red-700 font-semibold transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              disabled={isSubmitting || !password.trim()}
            >
              {isSubmitting ? 'Submitting...' : 'Submit & Exit'}
            </button>
          </div>
        </form>

        {/* Keyboard Shortcut Hint */}
        <div className="mt-4 text-center">
          <p className="text-xs text-gray-500 dark:text-gray-400">
            Shortcut: <kbd className="px-2 py-1 bg-gray-200 dark:bg-gray-700 rounded text-xs font-mono">Ctrl+Shift+E</kbd>
          </p>
        </div>
      </div>
    </div>
  );
}
