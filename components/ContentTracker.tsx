"use client";

import { useEffect, useRef } from 'react';
// import { useSession } from 'next-auth/react';
// import { XAPI_VERBS, XAPI_ACTIVITY_TYPES } from '@/lib/xapi-verbs';

/**
 * ContentTracker - Automatic xAPI tracking for content interactions
 * Wraps any content component and tracks user activity
 */

type ContentTrackerProps = {
  contentId: string;
  contentTitle: string;
  contentType: 'video' | 'document' | 'simulation' | 'vr' | 'reading' | 'pdf';
  moduleCode?: string;
  children: React.ReactNode;
  onComplete?: () => void;
};

export default function ContentTracker({
  contentId,
  contentTitle,
  contentType,
  moduleCode,
  children,
  onComplete
}: ContentTrackerProps) {
  // const { data: session } = useSession();
  const startTimeRef = useRef<number>(Date.now());
  const trackedRef = useRef(false);

  useEffect(() => {
    startTimeRef.current = Date.now();

    // Track initialization
    trackActivity('initialized');

    return () => {
      // Track suspension when component unmounts
      if (!trackedRef.current) {
        trackActivity('suspended');
      }
    };
  }, []);

  const trackActivity = async (verb: string) => {
    // Disabled for offline mode
    return;
    /*
    if (!session?.user) return;
    
    const duration = Math.floor((Date.now() - startTimeRef.current) / 1000);
    
    const verbMap: Record<string, any> = {
      initialized: XAPI_VERBS.INITIALIZED,
      suspended: XAPI_VERBS.SUSPENDED,
      completed: XAPI_VERBS.COMPLETED
    };
    
    const activityTypeMap: Record<string, string> = {
      video: XAPI_ACTIVITY_TYPES.VIDEO,
      document: XAPI_ACTIVITY_TYPES.DOCUMENT,
      simulation: XAPI_ACTIVITY_TYPES.SIMULATION,
      vr: XAPI_ACTIVITY_TYPES.VR_EXPERIENCE,
      reading: XAPI_ACTIVITY_TYPES.DOCUMENT,
      pdf: XAPI_ACTIVITY_TYPES.DOCUMENT
    };
    
    try {
      await fetch('/api/xapi/track', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          verb: verbMap[verb],
          activityId: `${contentType}:${contentId}`,
          activityName: contentTitle,
          activityType: activityTypeMap[contentType],
          moduleCode,
          result: verb === 'completed' ? {
            completion: true,
            duration: `PT${duration}S`
          } : undefined
        })
      });
    } catch (error) {
      console.error('[ContentTracker] Failed to track:', error);
    }
    */
  };

  const handleComplete = () => {
    if (!trackedRef.current) {
      trackedRef.current = true;
      trackActivity('completed');
      onComplete?.();
    }
  };

  return (
    <div data-content-tracker={contentId}>
      {typeof children === 'function'
        ? (children as any)({ onComplete: handleComplete })
        : children
      }
    </div>
  );
}
