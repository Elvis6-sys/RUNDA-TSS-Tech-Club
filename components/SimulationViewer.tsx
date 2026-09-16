"use client";

import { useState, useEffect, useRef } from 'react';
import { Maximize2, Minimize2, RotateCcw, AlertCircle, Save, Play } from 'lucide-react';
// import { trackActivity } from '@/lib/xapi-service';

// Stub for offline mode
const trackActivity = (params?: any) => { };

/**
 * SimulationViewer - Interactive simulation viewer with xAPI tracking
 * Supports code editors, circuit builders, network simulators, etc.
 */

type SimulationViewerProps = {
  src: string;
  title: string;
  moduleCode: string;
  activityId: string;
  description?: string;
  onComplete?: (score?: number) => void;
  allowSave?: boolean;
};

export default function SimulationViewer({
  src,
  title,
  moduleCode,
  activityId,
  description,
  onComplete,
  allowSave = true
}: SimulationViewerProps) {
  const [isLoaded, setIsLoaded] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [interactions, setInteractions] = useState(0);
  const [duration, setDuration] = useState(0);
  const [simulationState, setSimulationState] = useState<any>(null);

  const iframeRef = useRef<HTMLIFrameElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const startTimeRef = useRef(Date.now());
  const durationIntervalRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    startTimeRef.current = Date.now();

    // Track duration
    durationIntervalRef.current = setInterval(() => {
      setDuration(Math.floor((Date.now() - startTimeRef.current) / 1000));
    }, 1000);

    // Track start
    trackActivity({
      verb: 'LAUNCHED',
      activityType: 'SIMULATION',
      activityId,
      activityName: title,
      moduleCode,
      result: {
        duration: 0,
        completion: false
      }
    });

    // Listen for messages from iframe
    const handleMessage = (event: MessageEvent) => {
      if (event.data.type === 'simulation-interaction') {
        setInteractions(prev => prev + 1);
      } else if (event.data.type === 'simulation-complete') {
        handleSimulationComplete(event.data.score);
      } else if (event.data.type === 'simulation-state') {
        setSimulationState(event.data.state);
      }
    };

    window.addEventListener('message', handleMessage);

    return () => {
      if (durationIntervalRef.current) {
        clearInterval(durationIntervalRef.current);
      }
      window.removeEventListener('message', handleMessage);

      // Track completion on unmount
      const finalDuration = Math.floor((Date.now() - startTimeRef.current) / 1000);
      trackActivity({
        verb: 'INTERACTED',
        activityType: 'SIMULATION',
        activityId,
        activityName: title,
        moduleCode,
        result: {
          duration: finalDuration,
          completion: interactions > 5, // Considered active if 5+ interactions
          extensions: {
            interactions
          }
        }
      });
    };
  }, []);

  const handleLoad = () => {
    setIsLoaded(true);
    setError(null);

    // Try to restore saved state
    const savedState = localStorage.getItem(`sim-state-${activityId}`);
    if (savedState && iframeRef.current?.contentWindow) {
      try {
        const state = JSON.parse(savedState);
        iframeRef.current.contentWindow.postMessage({
          action: 'restoreState',
          state
        }, '*');
      } catch (err) {
        console.error('Failed to restore simulation state:', err);
      }
    }
  };

  const handleError = () => {
    setError('Failed to load simulation');
    setIsLoaded(false);
  };

  const handleSimulationComplete = (score?: number) => {
    const finalDuration = Math.floor((Date.now() - startTimeRef.current) / 1000);

    trackActivity({
      verb: 'COMPLETED',
      activityType: 'SIMULATION',
      activityId,
      activityName: title,
      moduleCode,
      result: {
        duration: finalDuration,
        completion: true,
        score: score !== undefined ? { raw: score, max: 100 } : undefined,
        extensions: {
          interactions
        }
      }
    });

    if (onComplete) {
      onComplete(score);
    }
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

  const resetSimulation = () => {
    if (iframeRef.current?.contentWindow) {
      iframeRef.current.contentWindow.postMessage({ action: 'reset' }, '*');
      setInteractions(0);
      startTimeRef.current = Date.now();
      setDuration(0);

      // Clear saved state
      localStorage.removeItem(`sim-state-${activityId}`);
    }
  };

  const saveSimulation = () => {
    if (iframeRef.current?.contentWindow) {
      // Request current state from simulation
      iframeRef.current.contentWindow.postMessage({ action: 'getState' }, '*');

      // State will be received via message handler
      if (simulationState) {
        localStorage.setItem(`sim-state-${activityId}`, JSON.stringify(simulationState));
        alert('Progress saved!');
      }
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
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div className="flex-1">
          <h3 className="text-lg font-semibold text-white">{title}</h3>
          {description && (
            <p className="text-sm text-slate-400 mt-1">{description}</p>
          )}
        </div>
        <div className="flex items-center gap-4 text-sm">
          <div className="text-slate-400">
            <span className="font-medium text-white">{interactions}</span> interactions
          </div>
          <div className="text-slate-400">
            Time: <span className="font-medium text-white">{formatTime(duration)}</span>
          </div>
        </div>
      </div>

      {/* Simulation Container */}
      <div
        ref={containerRef}
        className="relative bg-slate-900 rounded-xl overflow-hidden border-2 border-slate-700"
        style={{ minHeight: '600px' }}
      >
        {/* Loading State */}
        {!isLoaded && !error && (
          <div className="absolute inset-0 flex items-center justify-center bg-slate-900">
            <div className="text-center space-y-4">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto"></div>
              <p className="text-slate-400">Loading simulation...</p>
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

        {/* Simulation Iframe */}
        <iframe
          ref={iframeRef}
          src={src}
          className="w-full h-full border-0"
          style={{ minHeight: '600px' }}
          sandbox="allow-scripts allow-same-origin allow-forms allow-popups"
          onLoad={handleLoad}
          onError={handleError}
        />

        {/* Controls Overlay */}
        {isLoaded && (
          <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 to-transparent p-4">
            <div className="flex items-center justify-between gap-2">
              <div className="flex items-center gap-2">
                {allowSave && (
                  <button
                    onClick={saveSimulation}
                    className="flex items-center gap-2 px-3 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg text-sm font-medium transition"
                  >
                    <Save className="w-4 h-4" />
                    Save Progress
                  </button>
                )}
                <button
                  onClick={resetSimulation}
                  className="flex items-center gap-2 px-3 py-2 bg-slate-700 hover:bg-slate-600 text-white rounded-lg text-sm font-medium transition"
                >
                  <RotateCcw className="w-4 h-4" />
                  Reset
                </button>
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

      {/* Tips Panel */}
      <div className="bg-blue-500/10 border border-blue-500/30 rounded-lg p-4">
        <div className="flex items-start gap-3">
          <Play className="w-5 h-5 text-blue-400 flex-shrink-0 mt-0.5" />
          <div className="flex-1 text-sm text-blue-200">
            <p className="font-semibold text-blue-300 mb-1">Interactive Simulation</p>
            <p>Interact with the simulation to learn by doing. Your progress is automatically tracked and can be saved at any time.</p>
          </div>
        </div>
      </div>
    </div>
  );
}
