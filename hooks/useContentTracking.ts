/**
 * Hook: useContentTracking
 * Disabled for offline mode
 */

import { useRef, useCallback } from 'react';

export function useContentTracking() {
  const startTimeRef = useRef(Date.now());

  const trackVideo = useCallback(async (params: {
    videoId: string;
    videoTitle: string;
    moduleCode?: string;
    progress: number;
    completed: boolean;
  }) => {
    // Disabled for offline mode
    return;
  }, []);

  const trackSim = useCallback(async (params: {
    simulationId: string;
    simulationTitle: string;
    simulationType: 'circuit' | 'code' | 'vr' | 'blockchain' | 'other';
    moduleCode?: string;
    completed: boolean;
    score?: number;
  }) => {
    // Disabled for offline mode
    return;
  }, []);

  const trackQuiz = useCallback(async (params: {
    assessmentId: string;
    assessmentTitle: string;
    moduleCode?: string;
    score: number;
    maxScore: number;
    passed: boolean;
    completed: boolean;
  }) => {
    // Disabled for offline mode
    return;
  }, []);

  const trackDoc = useCallback(async (params: {
    documentId: string;
    documentTitle: string;
    moduleCode?: string;
    progress: number;
    completed: boolean;
  }) => {
    // Disabled for offline mode
    return;
  }, []);

  const resetTimer = useCallback(() => {
    startTimeRef.current = Date.now();
  }, []);

  return {
    trackVideo,
    trackSimulation: trackSim,
    trackQuiz,
    trackDocument: trackDoc,
    resetTimer
  };
}
