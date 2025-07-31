'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import VideoPlayer from '@/components/VideoPlayer';
import { 
  PlayCircleIcon, 
  CurrencyRupeeIcon, 
  ClockIcon,
  CheckCircleIcon,
  ExclamationTriangleIcon
} from '@heroicons/react/24/outline';

interface VideoData {
  type: string;
  title: string;
  reward: number;
  duration: number;
  available: boolean;
  description: string;
}

interface VideoStatus {
  welcomeVideoWatched: boolean;
  dailyAdProgress: {
    watched: number;
    remaining: number;
    dailyEarnings: number;
    canWatchMore: boolean;
  };
  totalVideoEarnings: number;
  availableVideos: VideoData[];
}

export default function VideosPage() {
  const router = useRouter();
  const [videoStatus, setVideoStatus] = useState<VideoStatus | null>(null);
  const [selectedVideo, setSelectedVideo] = useState<VideoData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  useEffect(() => {
    fetchVideoStatus();
  }, []);

  const fetchVideoStatus = async () => {
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        router.push('/auth/login');
        return;
      }

      const response = await fetch('/api/video/watch', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      const data = await response.json();
      if (data.success) {
        setVideoStatus(data.data);
      } else {
        setError(data.message);
      }
    } catch (error) {
      setError('Failed to load video status');
    } finally {
      setLoading(false);
    }
  };

  const handleVideoComplete = async (watchData: {
    videoId: string;
    videoType: string;
    watchDuration: number;
    totalDuration: number;
  }) => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch('/api/video/watch', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(watchData)
      });

      const data = await response.json();
      if (data.success) {
        setSuccess(data.message);
        setSelectedVideo(null);
        // Refresh video status
        await fetchVideoStatus();
      } else {
        setError(data.message);
      }
    } catch (error) {
      setError('Failed to process video completion');
    }
  };

  const handleVideoError = (errorMessage: string) => {
    setError(errorMessage);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading videos...</p>
        </div>
      </div>
    );
  }

  if (!videoStatus) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <ExclamationTriangleIcon className="w-12 h-12 text-red-500 mx-auto mb-4" />
          <p className="text-gray-600">Failed to load video data</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Watch & Earn</h1>
          <p className="mt-2 text-gray-600">
            Watch videos and ads to earn instant rewards!
          </p>
        </div>

        {/* Error/Success Messages */}
        {error && (
          <div className="mb-6 bg-red-50 border border-red-200 rounded-lg p-4">
            <div className="flex">
              <ExclamationTriangleIcon className="w-5 h-5 text-red-400 mr-2" />
              <p className="text-red-800">{error}</p>
            </div>
          </div>
        )}

        {success && (
          <div className="mb-6 bg-green-50 border border-green-200 rounded-lg p-4">
            <div className="flex">
              <CheckCircleIcon className="w-5 h-5 text-green-400 mr-2" />
              <p className="text-green-800">{success}</p>
            </div>
          </div>
        )}

        {/* Video Player Modal */}
        {selectedVideo && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-lg max-w-4xl w-full max-h-[90vh] overflow-y-auto">
              <div className="p-4 border-b flex justify-between items-center">
                <h3 className="text-lg font-semibold">Watching: {selectedVideo.title}</h3>
                <button
                  onClick={() => setSelectedVideo(null)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  ✕
                </button>
              </div>
              <div className="p-4">
                <VideoPlayer
                  videoId={`${selectedVideo.type}_${Date.now()}`}
                  videoType={selectedVideo.type as any}
                  title={selectedVideo.title}
                  description={selectedVideo.description}
                  reward={selectedVideo.reward}
                  duration={selectedVideo.duration}
                  onVideoComplete={handleVideoComplete}
                  onError={handleVideoError}
                />
              </div>
            </div>
          </div>
        )}

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center">
              <CurrencyRupeeIcon className="w-8 h-8 text-green-600" />
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-500">Total Video Earnings</p>
                <p className="text-2xl font-bold text-gray-900">₹{videoStatus.totalVideoEarnings}</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center">
              <PlayCircleIcon className="w-8 h-8 text-blue-600" />
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-500">Today's Ads Watched</p>
                <p className="text-2xl font-bold text-gray-900">
                  {videoStatus.dailyAdProgress.watched}/50
                </p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center">
              <CurrencyRupeeIcon className="w-8 h-8 text-yellow-600" />
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-500">Today's Ad Earnings</p>
                <p className="text-2xl font-bold text-gray-900">₹{videoStatus.dailyAdProgress.dailyEarnings}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Daily Ad Progress */}
        <div className="bg-white rounded-lg shadow p-6 mb-8">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Daily Ad Progress</h3>
          <div className="w-full bg-gray-200 rounded-full h-3 mb-4">
            <div
              className="bg-blue-600 h-3 rounded-full transition-all duration-300"
              style={{ width: `${(videoStatus.dailyAdProgress.watched / 50) * 100}%` }}
            />
          </div>
          <div className="flex justify-between text-sm text-gray-600">
            <span>Watched: {videoStatus.dailyAdProgress.watched} ads</span>
            <span>Remaining: {videoStatus.dailyAdProgress.remaining} ads</span>
            <span>Potential: ₹{videoStatus.dailyAdProgress.remaining * 2}</span>
          </div>
        </div>

        {/* Available Videos */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {videoStatus.availableVideos.map((video, index) => (
            <div key={index} className="bg-white rounded-lg shadow overflow-hidden">
              <div className="p-6">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-semibold text-gray-900">{video.title}</h3>
                  <span className="bg-green-100 text-green-800 text-xs font-medium px-2.5 py-0.5 rounded">
                    ₹{video.reward}
                  </span>
                </div>
                
                <p className="text-gray-600 text-sm mb-4">{video.description}</p>
                
                <div className="flex items-center text-sm text-gray-500 mb-4">
                  <ClockIcon className="w-4 h-4 mr-1" />
                  <span>{Math.floor(video.duration / 60)}:{(video.duration % 60).toString().padStart(2, '0')} min</span>
                </div>

                {video.available ? (
                  <button
                    onClick={() => setSelectedVideo(video)}
                    className="w-full bg-blue-600 text-white py-2 px-4 rounded-lg hover:bg-blue-700 transition-colors flex items-center justify-center"
                  >
                    <PlayCircleIcon className="w-5 h-5 mr-2" />
                    Watch Now
                  </button>
                ) : (
                  <button
                    disabled
                    className="w-full bg-gray-300 text-gray-500 py-2 px-4 rounded-lg cursor-not-allowed flex items-center justify-center"
                  >
                    <CheckCircleIcon className="w-5 h-5 mr-2" />
                    {video.type === 'welcome' ? 'Already Watched' : 'Daily Limit Reached'}
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>

        {/* Instructions */}
        <div className="mt-8 bg-blue-50 rounded-lg p-6">
          <h3 className="text-lg font-semibold text-blue-900 mb-4">How to Earn</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="text-center">
              <div className="bg-blue-100 rounded-full w-12 h-12 flex items-center justify-center mx-auto mb-2">
                <span className="text-blue-600 font-bold">1</span>
              </div>
              <h4 className="font-medium text-blue-900">Watch Welcome Video</h4>
              <p className="text-blue-700 text-sm">Earn ₹100 instantly on registration</p>
            </div>
            <div className="text-center">
              <div className="bg-blue-100 rounded-full w-12 h-12 flex items-center justify-center mx-auto mb-2">
                <span className="text-blue-600 font-bold">2</span>
              </div>
              <h4 className="font-medium text-blue-900">Watch Daily Ads</h4>
              <p className="text-blue-700 text-sm">50 ads/day = ₹100/day for 7 days</p>
            </div>
            <div className="text-center">
              <div className="bg-blue-100 rounded-full w-12 h-12 flex items-center justify-center mx-auto mb-2">
                <span className="text-blue-600 font-bold">3</span>
              </div>
              <h4 className="font-medium text-blue-900">Play Games</h4>
              <p className="text-blue-700 text-sm">Watch tutorials and earn more</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
