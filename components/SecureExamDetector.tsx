'use client';

import { useEffect, useState } from 'react';
import AdminExitDialog from './AdminExitDialog';

interface SecureExamDetectorProps {
  assessmentType?: 'quiz' | 'exam' | 'assignment' | 'exercise' | 'assessment';
  assessmentTitle?: string;
  studentId?: string;
  studentName?: string;
  nodeId?: string;
  trackId?: string;
  autoActivate?: boolean;
}

// Type for Electron API is defined in types/electron.d.ts

export default function SecureExamDetector({
  assessmentType = 'quiz',
  assessmentTitle = 'Assessment',
  studentId,
  studentName,
  nodeId,
  trackId,
  autoActivate = true,
}: SecureExamDetectorProps) {
  const [isSecureMode, setIsSecureMode] = useState(false);
  const [isElectron, setIsElectron] = useState(false);

  useEffect(() => {
    // Check if we're in Electron
    const checkElectron = async () => {
      console.log('🔍 Checking if running in Electron...');

      if (window.isElectron && window.electronAPI) {
        console.log('✅ ELECTRON DETECTED!');
        setIsElectron(true);

        // Check if exam is already active
        try {
          const { active } = await window.electronAPI.examModeStatus();
          setIsSecureMode(active);
        } catch (e) {
          console.error('Error checking exam status:', e);
        }
      } else {
        console.log('❌ Not in Electron - running in browser');
        setIsElectron(false);
      }
    };

    checkElectron();
  }, []);

  useEffect(() => {
    if (!isElectron || !autoActivate || !window.electronAPI) return;

    const activateSecureMode = async () => {
      try {
        console.log('🔒 Activating Secure Exam Mode via Electron');

        const examData = {
          assessmentType,
          assessmentTitle,
          studentId,
          studentName,
          nodeId,
          trackId,
          timestamp: new Date().toISOString(),
        };

        const result = await window.electronAPI!.examModeEnter(examData);

        if (result.success) {
          console.log('✅ Secure Mode activated');
          setIsSecureMode(true);

          window.dispatchEvent(new CustomEvent('secure-exam-mode-activated', {
            detail: examData,
          }));
        }
      } catch (error) {
        console.error('❌ Failed to activate secure mode:', error);
      }
    };

    const timer = setTimeout(activateSecureMode, 500);
    return () => clearTimeout(timer);
  }, [isElectron, autoActivate, assessmentType, assessmentTitle, studentId, studentName, nodeId, trackId]);

  // Listen for auto-submit events
  useEffect(() => {
    if (!isElectron || !window.electronAPI) return;

    const handleAutoSubmit = (data: any) => {
      console.log('📤 Auto-submit triggered by Electron:', data);

      // Trigger auto-submit in your app
      window.dispatchEvent(new CustomEvent('force-auto-submit', {
        detail: data,
      }));
    };

    window.electronAPI.onAutoSubmit(handleAutoSubmit);
  }, [isElectron]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (!isElectron || !isSecureMode || !window.electronAPI) return;

      const deactivate = async () => {
        try {
          console.log('🔓 Returning to Normal Mode');
          await window.electronAPI!.examModeExit();
          console.log('✅ Normal Mode restored');
          setIsSecureMode(false);
          window.dispatchEvent(new CustomEvent('secure-exam-mode-deactivated'));
        } catch (error) {
          console.error('❌ Failed to deactivate:', error);
        }
      };

      deactivate();
    };
  }, [isElectron, isSecureMode]);

  return (
    <>
      {/* Admin Exit Dialog */}
      <AdminExitDialog />

      {/* Status Banner */}
      <div className="fixed top-0 left-0 right-0 z-50 pointer-events-none">
        {!isElectron && (
          <div className="bg-yellow-600 text-white text-xs px-4 py-2 text-center font-semibold shadow-lg">
            ⚠️ NOT IN ELECTRON - Open in Electron app for secure mode
          </div>
        )}
        {isElectron && !isSecureMode && (
          <div className="bg-blue-600 text-white text-xs px-4 py-2 text-center font-semibold shadow-lg">
            🔄 ELECTRON DETECTED - Activating secure mode...
          </div>
        )}
        {isElectron && isSecureMode && (
          <div className="bg-red-600 text-white text-xs px-4 py-2 text-center font-semibold shadow-lg">
            🔒 SECURE EXAM MODE ACTIVE - Press Ctrl+Shift+E to exit
          </div>
        )}
      </div>
    </>
  );
}
