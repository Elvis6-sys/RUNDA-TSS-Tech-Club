"use client";

import { useState, useEffect, useRef } from 'react';
import { Maximize2, Minimize2, AlertCircle, PlayCircle, Eye } from 'lucide-react';
// import { trackActivity } from '@/lib/xapi-service';

// Stub for offline mode
const trackActivity = (params?: any) => { };

/**
 * VRViewer - WebXR VR content viewer with xAPI tracking
 * Supports VR headsets and desktop fallback
 */

type VRViewerProps = {
  src: string;
  title: string;
  moduleCode: string;
  activityId: string;
  onComplete?: () => void;
  requiresVR?: boolean;
};

export default function VRViewer({
  src,
  title,
  moduleCode,
  activityId,
  onComplete,
  requiresVR = false
}: VRViewerProps) {
  const [isLoaded, setIsLoaded] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [duration, setDuration] = useState(0);
  const [hasVRSupport, setHasVRSupport] = useState(false);
  const [isVRActive, setIsVRActive] = useState(false);

  const iframeRef = useRef<HTMLIFrameElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const startTimeRef = useRef(Date.now());
  const durationIntervalRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    // Check WebXR support
    if ('xr' in navigator) {
      (navigator as any).xr.isSessionSupported('immersive-vr')
        .then((supported: boolean) => {
          setHasVRSupport(supported);
        })
        .catch(() => {
          setHasVRSupport(false);
        });
    }

    // Start duration tracking
    startTimeRef.current = Date.now();
    durationIntervalRef.current = setInterval(() => {
      setDuration(Math.floor((Date.now() - startTimeRef.current) / 1000));
    }, 1000);

    // Track start
    trackActivity({
      verb: 'LAUNCHED',
      activityType: 'VR_EXPERIENCE',
      activityId,
      activityName: title,
      moduleCode,
      result: {
        duration: 0,
        completion: false
      }
    });

    return () => {
      if (durationIntervalRef.current) {
        clearInterval(durationIntervalRef.current);
      }

      // Track completion on unmount
      const finalDuration = Math.floor((Date.now() - startTimeRef.current) / 1000);
      trackActivity({
        verb: 'EXPERIENCED',
        activityType: 'VR_EXPERIENCE',
        activityId,
        activityName: title,
        moduleCode,
        result: {
          duration: finalDuration,
          completion: finalDuration > 60 // Consider complete if used for 1+ minute
        }
      });
    };
  }, []);

  const handleLoad = () => {
    setIsLoaded(true);
    setError(null);
  };

  const handleError = () => {
    setError('Failed to load VR content');
    setIsLoaded(false);
  };

  const toggleFullscreen = async () => {
    if (!containerRef.current) return;

    try {
      if (!document.fullscreenElement) {
        await containerRef.current.requestFullscreen();
        setIsFullscreen(true);
      } else {
        await document.exitFullscreen();
        setIsFullscreen(false);
      }
    } catch (err) {
      console.error('Fullscreen error:', err);
    }
  };

  const enterVR = () => {
    // Send message to iframe to trigger VR mode
    if (iframeRef.current?.contentWindow) {
      iframeRef.current.contentWindow.postMessage({ action: 'enterVR' }, '*');
      setIsVRActive(true);
    }
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold text-white">{title}</h3>
          <p className="text-sm text-slate-400">
            {requiresVR && !hasVRSupport && (
              <span className="text-yellow-400">⚠ VR headset recommended</span>
            )}
            {hasVRSupport && (
              <span className="text-green-400">✓ VR ready</span>
            )}
          </p>
        </div>
        <div className="text-sm text-slate-400">
          Duration: {formatTime(duration)}
        </div>
      </div>

      {/* VR Content Container */}
      <div
        ref={containerRef}
        className="relative bg-slate-900 rounded-xl overflow-hidden border-2 border-slate-700"
        style={{ aspectRatio: '16/9' }}
      >
        {/* Loading State */}
        {!isLoaded && !error && (
          <div className="absolute inset-0 flex items-center justify-center bg-slate-900">
            <div className="text-center space-y-4">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto"></div>
              <p className="text-slate-400">Loading VR experience...</p>
            </div>
          </div>
        )}

        {/* Error State */}
        {error && (
          <div className="absolute inset-0 flex items-center justify-center bg-slate-900">
            <div className="text-center space-y-4 px-6">
              <AlertCircle className="w-16 h-16 text-red-400 mx-auto" />
              <p className="text-red-400 font-semibold">{error}</p>
              <button
                onClick={() => {
                  setError(null);
                  setIsLoaded(false);
                }}
                className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition"
              >
                Retry
              </button>
            </div>
          </div>
        )}

        {/* VR Iframe */}
        <iframe
          ref={iframeRef}
          src={src}
          className="w-full h-full border-0"
          allow="xr-spatial-tracking; accelerometer; gyroscope; vr; fullscreen"
          onLoad={handleLoad}
          onError={handleError}
        />

        {/* Controls Overlay */}
        {isLoaded && (
          <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 to-transparent p-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                {hasVRSupport && !isVRActive && (
                  <button
                    onClick={enterVR}
                    className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium transition"
                  >
                    <Eye className="w-4 h-4" />
                    Enter VR Mode
                  </button>
                )}
                {isVRActive && (
                  <span className="flex items-center gap-2 px-4 py-2 bg-green-600/20 text-green-400 rounded-lg font-medium">
                    <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
                    VR Active
                  </span>
                )}
              </div>

              <button
                onClick={toggleFullscreen}
                className="p-2 bg-slate-800/50 hover:bg-slate-700 rounded-lg transition"
                title={isFullscreen ? 'Exit fullscreen' : 'Fullscreen'}
              >
                {isFullscreen ? (
                  <Minimize2 className="w-5 h-5 text-white" />
                ) : (
                  <Maximize2 className="w-5 h-5 text-white" />
                )}
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Info Panel */}
      <div className="bg-slate-800 border border-slate-700 rounded-lg p-4">
        <div className="flex items-start gap-3">
          <AlertCircle className="w-5 h-5 text-blue-400 flex-shrink-0 mt-0.5" />
          <div className="flex-1 text-sm text-slate-300 space-y-2">
            <p><strong className="text-white">Navigation:</strong> Use mouse/keyboard controls or VR controllers</p>
            <p><strong className="text-white">Desktop Mode:</strong> Click and drag to look around, WASD to move</p>
            {hasVRSupport && (
              <p><strong className="text-white">VR Mode:</strong> Put on your headset and click "Enter VR Mode"</p>
            )}
            {!hasVRSupport && requiresVR && (
              <p className="text-yellow-400">
                <strong>Note:</strong> This experience is designed for VR but can be viewed in desktop mode
              </p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
