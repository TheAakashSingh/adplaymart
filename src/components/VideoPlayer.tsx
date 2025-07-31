'use client';

import { useState, useRef, useEffect } from 'react';
import { PlayIcon, PauseIcon, CheckCircleIcon } from '@heroicons/react/24/solid';

interface VideoPlayerProps {
  videoId: string;
  videoType: 'welcome' | 'daily_ad' | 'game_unlock';
  title: string;
  description: string;
  reward: number;
  duration: number;
  onVideoComplete: (watchData: {
    videoId: string;
    videoType: string;
    watchDuration: number;
    totalDuration: number;
  }) => void;
  onError?: (error: string) => void;
}

export default function VideoPlayer({
  videoId,
  videoType,
  title,
  description,
  reward,
  duration,
  onVideoComplete,
  onError
}: VideoPlayerProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [watchedDuration, setWatchedDuration] = useState(0);
  const [isCompleted, setIsCompleted] = useState(false);
  const [canSkip, setCanSkip] = useState(false);
  const [showReward, setShowReward] = useState(false);

  // Sample video URLs (replace with your actual video URLs)
  const getVideoUrl = (type: string) => {
    // For demo purposes, we'll use a sample video URL
    // Replace these with your actual video URLs
    switch (type) {
      case 'welcome':
        return 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4';
      case 'daily_ad':
        return 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ElephantsDream.mp4';
      case 'game_unlock':
        return 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerBlazes.mp4';
      default:
        return 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4';
    }
  };

  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    const handleTimeUpdate = () => {
      const current = video.currentTime;
      setCurrentTime(current);
      
      // Track actual watched duration (not just current time)
      if (!video.paused) {
        setWatchedDuration(prev => prev + 0.1); // Increment every 100ms
      }
      
      // Allow skipping after watching 90% of the video
      if (current >= duration * 0.9) {
        setCanSkip(true);
      }
      
      // Auto-complete when video ends
      if (current >= duration - 1) {
        handleVideoComplete();
      }
    };

    const handleEnded = () => {
      handleVideoComplete();
    };

    video.addEventListener('timeupdate', handleTimeUpdate);
    video.addEventListener('ended', handleEnded);

    return () => {
      video.removeEventListener('timeupdate', handleTimeUpdate);
      video.removeEventListener('ended', handleEnded);
    };
  }, [duration]);

  const handleVideoComplete = () => {
    if (isCompleted) return;
    
    const video = videoRef.current;
    if (!video) return;

    const actualWatchDuration = Math.min(watchedDuration, duration);
    const watchPercentage = (actualWatchDuration / duration) * 100;

    if (watchPercentage >= 90) {
      setIsCompleted(true);
      setShowReward(true);
      
      onVideoComplete({
        videoId,
        videoType,
        watchDuration: actualWatchDuration,
        totalDuration: duration
      });
    } else {
      onError?.('Please watch the complete video to earn rewards');
    }
  };

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

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const progressPercentage = (currentTime / duration) * 100;
  const watchedPercentage = (watchedDuration / duration) * 100;

  return (
    <div className="bg-white rounded-lg shadow-lg overflow-hidden">
      {/* Video Header */}
      <div className="bg-gradient-to-r from-blue-600 to-purple-600 text-white p-4">
        <h3 className="text-lg font-semibold">{title}</h3>
        <p className="text-blue-100 text-sm">{description}</p>
        <div className="flex items-center justify-between mt-2">
          <span className="text-yellow-300 font-bold">Reward: ₹{reward}</span>
          <span className="text-blue-100 text-sm">Duration: {formatTime(duration)}</span>
        </div>
      </div>

      {/* Video Player */}
      <div className="relative bg-black">
        <video
          ref={videoRef}
          className="w-full h-64 object-cover"
          src={getVideoUrl(videoType)}
          poster="/images/video-poster.svg"
          onPlay={() => setIsPlaying(true)}
          onPause={() => setIsPlaying(false)}
          onError={() => onError?.('Error loading video')}
          controlsList="nodownload"
          disablePictureInPicture
          onContextMenu={(e) => e.preventDefault()} // Disable right-click
        />
        
        {/* Custom Controls Overlay */}
        <div className="absolute inset-0 flex items-center justify-center">
          <button
            onClick={togglePlay}
            className="bg-black bg-opacity-50 text-white p-4 rounded-full hover:bg-opacity-70 transition-all"
            disabled={isCompleted}
          >
            {isPlaying ? (
              <PauseIcon className="w-8 h-8" />
            ) : (
              <PlayIcon className="w-8 h-8" />
            )}
          </button>
        </div>

        {/* Completion Overlay */}
        {isCompleted && (
          <div className="absolute inset-0 bg-green-600 bg-opacity-90 flex items-center justify-center">
            <div className="text-center text-white">
              <CheckCircleIcon className="w-16 h-16 mx-auto mb-2" />
              <h4 className="text-xl font-bold">Video Completed!</h4>
              <p className="text-green-100">Reward Earned: ₹{reward}</p>
            </div>
          </div>
        )}
      </div>

      {/* Progress Bar */}
      <div className="p-4">
        <div className="flex items-center justify-between text-sm text-gray-600 mb-2">
          <span>{formatTime(currentTime)}</span>
          <span className="text-blue-600 font-medium">
            Watched: {Math.round(watchedPercentage)}%
          </span>
          <span>{formatTime(duration)}</span>
        </div>
        
        <div className="w-full bg-gray-200 rounded-full h-2 mb-2">
          <div
            className="bg-blue-600 h-2 rounded-full transition-all duration-300"
            style={{ width: `${progressPercentage}%` }}
          />
        </div>
        
        {/* Watched Progress (separate bar) */}
        <div className="w-full bg-gray-100 rounded-full h-1">
          <div
            className="bg-green-500 h-1 rounded-full transition-all duration-300"
            style={{ width: `${watchedPercentage}%` }}
          />
        </div>

        {/* Skip Button (only available after 90% watched) */}
        {canSkip && !isCompleted && (
          <div className="mt-3 text-center">
            <button
              onClick={handleVideoComplete}
              className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition-colors"
            >
              Complete & Claim Reward
            </button>
          </div>
        )}

        {/* Reward Animation */}
        {showReward && (
          <div className="mt-3 text-center">
            <div className="inline-flex items-center bg-green-100 text-green-800 px-4 py-2 rounded-lg">
              <CheckCircleIcon className="w-5 h-5 mr-2" />
              <span className="font-medium">₹{reward} added to your wallet!</span>
            </div>
          </div>
        )}

        {/* Video Type Specific Info */}
        {videoType === 'daily_ad' && (
          <div className="mt-3 p-3 bg-blue-50 rounded-lg">
            <p className="text-blue-800 text-sm">
              💡 <strong>Daily Ad Plan:</strong> Watch 50 ads daily to earn ₹100/day for 7 days!
            </p>
          </div>
        )}

        {videoType === 'welcome' && (
          <div className="mt-3 p-3 bg-yellow-50 rounded-lg">
            <p className="text-yellow-800 text-sm">
              🎉 <strong>Welcome Bonus:</strong> One-time reward for new users!
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
