'use client';

import { useState, useCallback } from 'react';
import { submitQuizWithOfflineSupport } from '@/src/lib/offlineStorage';

interface UseOfflineQuizProps {
  userId: string;
  nodeId: string;
  blockId: string;
  quizId: string;
}

export function useOfflineQuiz({ userId, nodeId, blockId, quizId }: UseOfflineQuizProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [offlineMode, setOfflineMode] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const submitQuiz = useCallback(
    async (answers: Record<string, any>) => {
      setIsSubmitting(true);
      setError(null);

      try {
        // Online submission function
        const onlineSubmit = async () => {
          const response = await fetch('/api/quiz/submit', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              userId,
              nodeId,
              blockId,
              quizId,
              answers,
              submittedAt: new Date().toISOString(),
            }),
          });

          if (!response.ok) {
            throw new Error(`HTTP ${response.status}: ${response.statusText}`);
          }

          return await response.json();
        };

        // Submit with offline fallback
        const result = await submitQuizWithOfflineSupport(
          userId,
          nodeId,
          blockId,
          quizId,
          answers,
          onlineSubmit
        );

        setOfflineMode(result.offlineMode);

        if (result.success) {
          return {
            success: true,
            submissionId: result.submissionId,
            message: result.offlineMode
              ? '✅ Quiz saved offline. Will sync when online.'
              : '✅ Quiz submitted successfully!',
          };
        } else {
          throw new Error('Failed to submit quiz online and offline');
        }
      } catch (err: any) {
        const errorMessage = err.message || 'Unknown error occurred';
        setError(errorMessage);
        return {
          success: false,
          message: `❌ Failed to submit: ${errorMessage}`,
        };
      } finally {
        setIsSubmitting(false);
      }
    },
    [userId, nodeId, blockId, quizId]
  );

  return {
    submitQuiz,
    isSubmitting,
    offlineMode,
    error,
  };
}
