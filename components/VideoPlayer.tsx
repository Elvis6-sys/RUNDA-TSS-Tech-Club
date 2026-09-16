"use client";

import { useState, useRef, useEffect } from 'react';
// import { useSession } from 'next-auth/react';
import { Play, Pause, Volume2, VolumeX, Maximize } from 'lucide-react';
// import { trackVideoView } from '@/lib/xapi-service';

/**
 * VideoPlayer with automatic xAPI tracking
 * Tracks watch time, completion, progress
 */

type VideoPlayerProps = {
  videoId: string;
  videoTitle: string;
  videoUrl: string;
  moduleCode?: string;
  onComplete?: () => void;
};

export default function VideoPlayer({
  videoId,
  videoTitle,
  videoUrl,
  moduleCode,
  onComplete
}: VideoPlayerProps) {
  // const { data: session } = useSession();
  const videoRef = useRef<HTMLVideoElement>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [progress, setProgress] = useState(0);
  const [duration, setDuration] = useState(0);
  const [currentTime, setCurrentTime] = useState(0);
  const [hasTrackedCompletion, setHasTrackedCompletion] = useState(false);

  const startTimeRef = useRef(Date.now());
  const watchDurationRef = useRef(0);

  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    const updateTime = () => {
      setCurrentTime(video.currentTime);
      setProgress((video.currentTime / video.duration) * 100);

      // Track completion at 90%
      if (video.currentTime / video.duration >= 0.9 && !hasTrackedCompletion) {
        handleCompletion();
      }
    };

    const updateDuration = () => {
      setDuration(video.duration);
    };

    video.addEventListener('timeupdate', updateTime);
    video.addEventListener('loadedmetadata', updateDuration);

    return () => {
      video.removeEventListener('timeupdate', updateTime);
      video.removeEventListener('loadedmetadata', updateDuration);

      // Track on unmount
      trackProgress(false);
    };
  }, [hasTrackedCompletion]);

  const togglePlay = () => {
    const video = videoRef.current;
    if (!video) return;

    if (isPlaying) {
      video.pause();
    } else {
      video.play();
    }
    setIsPlaying(!isPlaying);
  };

  const toggleMute = () => {
    const video = videoRef.current;
    if (!video) return;

    video.muted = !isMuted;
    setIsMuted(!isMuted);
  };

  const handleSeek = (e: React.ChangeEvent<HTMLInputElement>) => {
    const video = videoRef.current;
    if (!video) return;

    const newTime = (parseFloat(e.target.value) / 100) * video.duration;
    video.currentTime = newTime;
    setCurrentTime(newTime);
    setProgress(parseFloat(e.target.value));
  };

  const toggleFullscreen = () => {
    const video = videoRef.current;
    if (!video) return;

    if (document.fullscreenElement) {
      document.exitFullscreen();
    } else {
      video.requestFullscreen();
    }
  };

  const trackProgress = async (completed: boolean) => {
    // Disabled for offline mode
    return;
    /*
    if (!session?.user) return;

    const totalDuration = Math.floor((Date.now() - startTimeRef.current) / 1000);
    watchDurationRef.current = totalDuration;

    try {
      await trackVideoView({
        userId: session.user.id!,
        userName: session.user.name || 'Unknown',
        userEmail: session.user.email!,
        videoId,
        videoTitle,
        moduleCode,
        duration: totalDuration,
        progress: Math.floor(progress),
        completed
      });
    } catch (error) {
      console.error('[VideoPlayer] Track error:', error);
    }
    */
  };

  const handleCompletion = async () => {
    if (hasTrackedCompletion) return;

    setHasTrackedCompletion(true);
    await trackProgress(true);
    onComplete?.();
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <div className="relative w-full bg-black rounded-lg overflow-hidden shadow-lg">
      <video
        ref={videoRef}
        src={videoUrl}
        className="w-full aspect-video"
        onPlay={() => setIsPlaying(true)}
        onPause={() => setIsPlaying(false)}
      />

      {/* Controls Overlay */}
      <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 to-transparent p-4">
        {/* Progress Bar */}
        <input
          type="range"
          min="0"
          max="100"
          value={progress}
          onChange={handleSeek}
          className="w-full h-1 bg-gray-600 rounded-lg appearance-none cursor-pointer mb-3"
          style={{
            background: `linear-gradient(to right, #3b82f6 0%, #3b82f6 ${progress}%, #4b5563 ${progress}%, #4b5563 100%)`
          }}
        />

        <div className="flex items-center justify-between text-white">
          <div className="flex items-center gap-3">
            {/* Play/Pause */}
            <button
              onClick={togglePlay}
              className="p-2 hover:bg-white/20 rounded-full transition"
            >
              {isPlaying ? <Pause className="w-5 h-5" /> : <Play className="w-5 h-5" />}
            </button>

            {/* Mute */}
            <button
              onClick={toggleMute}
              className="p-2 hover:bg-white/20 rounded-full transition"
            >
              {isMuted ? <VolumeX className="w-5 h-5" /> : <Volume2 className="w-5 h-5" />}
            </button>

            {/* Time */}
            <span className="text-sm">
              {formatTime(currentTime)} / {formatTime(duration)}
            </span>
          </div>

          <div className="flex items-center gap-2">
            {/* Progress Badge */}
            {progress > 0 && (
              <span className="text-xs bg-blue-600 px-2 py-1 rounded">
                {Math.floor(progress)}% watched
              </span>
            )}

            {/* Fullscreen */}
            <button
              onClick={toggleFullscreen}
              className="p-2 hover:bg-white/20 rounded-full transition"
            >
              <Maximize className="w-5 h-5" />
            </button>
          </div>
        </div>
      </div>
    </div >
  );
}
