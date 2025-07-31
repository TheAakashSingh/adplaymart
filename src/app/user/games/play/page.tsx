'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import {
  PlayIcon,
  TrophyIcon,
  CurrencyRupeeIcon,
  ClockIcon,
  StarIcon,
  ArrowLeftIcon
} from '@heroicons/react/24/outline';

interface Game {
  id: string;
  name: string;
  type: 'casual' | 'puzzle' | 'action';
  description: string;
  minDuration: number;
  baseReward: number;
  maxGamesPerDay: number;
  icon: string;
  difficulty: 'Easy' | 'Medium' | 'Hard';
}

const games: Game[] = [
  // Casual Games
  {
    id: 'number-guessing',
    name: 'Number Guessing',
    type: 'casual',
    description: 'Guess the secret number between 1-100',
    minDuration: 60,
    baseReward: 0.5,
    maxGamesPerDay: 15,
    icon: '🎯',
    difficulty: 'Easy'
  },
  {
    id: 'color-match',
    name: 'Color Match',
    type: 'casual',
    description: 'Match colors as fast as you can',
    minDuration: 60,
    baseReward: 0.5,
    maxGamesPerDay: 15,
    icon: '🎨',
    difficulty: 'Easy'
  },
  {
    id: 'click-game',
    name: 'Click Master',
    type: 'casual',
    description: 'Click as fast as you can in limited time',
    minDuration: 30,
    baseReward: 0.3,
    maxGamesPerDay: 20,
    icon: '👆',
    difficulty: 'Easy'
  },
  {
    id: 'math-quiz',
    name: 'Math Quiz',
    type: 'casual',
    description: 'Solve math problems quickly',
    minDuration: 90,
    baseReward: 0.8,
    maxGamesPerDay: 12,
    icon: '🔢',
    difficulty: 'Medium'
  },

  // Puzzle Games
  {
    id: 'memory-cards',
    name: 'Memory Cards',
    type: 'puzzle',
    description: 'Match pairs of cards to test your memory',
    minDuration: 120,
    baseReward: 1,
    maxGamesPerDay: 10,
    icon: '🧠',
    difficulty: 'Medium'
  },
  {
    id: 'word-puzzle',
    name: 'Word Search',
    type: 'puzzle',
    description: 'Find hidden words in the letter grid',
    minDuration: 120,
    baseReward: 1,
    maxGamesPerDay: 10,
    icon: '📝',
    difficulty: 'Medium'
  },
  {
    id: 'sliding-puzzle',
    name: 'Sliding Puzzle',
    type: 'puzzle',
    description: 'Arrange numbered tiles in order',
    minDuration: 180,
    baseReward: 1.2,
    maxGamesPerDay: 8,
    icon: '🧩',
    difficulty: 'Hard'
  },

  // Action Games
  {
    id: 'snake-game',
    name: 'Snake Game',
    type: 'action',
    description: 'Classic snake game - eat food and grow',
    minDuration: 180,
    baseReward: 1.5,
    maxGamesPerDay: 8,
    icon: '🐍',
    difficulty: 'Hard'
  },
  {
    id: 'space-shooter',
    name: 'Space Shooter',
    type: 'action',
    description: 'Shoot asteroids and enemy ships',
    minDuration: 240,
    baseReward: 2,
    maxGamesPerDay: 6,
    icon: '🚀',
    difficulty: 'Hard'
  },
  {
    id: 'dodge-game',
    name: 'Dodge Master',
    type: 'action',
    description: 'Dodge falling objects and survive',
    minDuration: 120,
    baseReward: 1.3,
    maxGamesPerDay: 10,
    icon: '⚡',
    difficulty: 'Medium'
  },

  // Racing Games
  {
    id: 'car-racing',
    name: 'Car Racing',
    type: 'action',
    description: 'Race against time on challenging tracks',
    minDuration: 180,
    baseReward: 1.8,
    maxGamesPerDay: 8,
    icon: '🏎️',
    difficulty: 'Hard'
  },
  {
    id: 'bike-racing',
    name: 'Bike Racing',
    type: 'action',
    description: 'High-speed motorcycle racing',
    minDuration: 150,
    baseReward: 1.6,
    maxGamesPerDay: 10,
    icon: '🏍️',
    difficulty: 'Medium'
  },

  // Shooting Games
  {
    id: 'target-shooting',
    name: 'Target Shooting',
    type: 'action',
    description: 'Hit targets with precision shooting',
    minDuration: 120,
    baseReward: 1.4,
    maxGamesPerDay: 10,
    icon: '🎯',
    difficulty: 'Medium'
  },
  {
    id: 'bubble-shooter',
    name: 'Bubble Shooter',
    type: 'casual',
    description: 'Pop bubbles by matching colors',
    minDuration: 180,
    baseReward: 1.1,
    maxGamesPerDay: 12,
    icon: '🫧',
    difficulty: 'Medium'
  },

  // Adventure Games
  {
    id: 'treasure-hunt',
    name: 'Treasure Hunt',
    type: 'puzzle',
    description: 'Find hidden treasures in mysterious maps',
    minDuration: 300,
    baseReward: 2.5,
    maxGamesPerDay: 5,
    icon: '🗺️',
    difficulty: 'Hard'
  },
  {
    id: 'maze-runner',
    name: 'Maze Runner',
    type: 'puzzle',
    description: 'Navigate through complex mazes',
    minDuration: 240,
    baseReward: 2,
    maxGamesPerDay: 6,
    icon: '🌀',
    difficulty: 'Hard'
  }
];

export default function GamesPage() {
  const router = useRouter();
  const [user, setUser] = useState<any>(null);
  const [gameStats, setGameStats] = useState<any>({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Check if user is logged in
    const token = localStorage.getItem('token');
    const userData = localStorage.getItem('user');
    
    if (!token || !userData) {
      router.push('/auth/login');
      return;
    }
    
    try {
      const parsedUser = JSON.parse(userData);
      setUser(parsedUser);
      fetchGameStats(token);
    } catch (error) {
      console.error('Error parsing user data:', error);
      router.push('/auth/login');
    }
  }, [router]);

  const fetchGameStats = async (token: string) => {
    try {
      const response = await fetch('/api/gaming/play-game', {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      
      if (response.ok) {
        const data = await response.json();
        setGameStats(data.data || {});
      }
    } catch (error) {
      console.error('Error fetching game stats:', error);
    } finally {
      setLoading(false);
    }
  };

  const handlePlayGame = (gameId: string) => {
    router.push(`/user/games/play/${gameId}`);
  };

  const getRemainingGames = (gameType: string, maxGames: number) => {
    const played = gameStats[gameType]?.gamesPlayed || 0;
    return Math.max(0, maxGames - played);
  };

  const getTotalEarnings = (gameType: string) => {
    return gameStats[gameType]?.totalEarnings || 0;
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-50 via-blue-50 to-indigo-100 flex items-center justify-center">
        <div className="loading-spinner"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-blue-50 to-indigo-100 px-4 py-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <button
          onClick={() => router.back()}
          className="flex items-center space-x-2 text-gray-600 hover:text-gray-800 transition-colors"
        >
          <ArrowLeftIcon className="w-5 h-5" />
          <span>Back</span>
        </button>
        
        <h1 className="text-3xl font-bold bg-gradient-to-r from-purple-600 to-blue-600 bg-clip-text text-transparent">
          🎮 Play Games
        </h1>
        
        <div className="flex items-center space-x-2 bg-white/80 backdrop-blur-md rounded-lg px-3 py-2">
          <CurrencyRupeeIcon className="w-5 h-5 text-green-600" />
          <span className="font-bold text-gray-800">₹{user?.wallets?.income?.toFixed(2) || '0.00'}</span>
        </div>
      </div>

      {/* Games Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {games.map((game) => {
          const remainingGames = getRemainingGames(game.type, game.maxGamesPerDay);
          const totalEarnings = getTotalEarnings(game.type);
          const canPlay = remainingGames > 0;

          return (
            <div
              key={game.id}
              className="bg-white/90 backdrop-blur-md rounded-2xl shadow-xl border border-white/20 overflow-hidden hover:scale-105 transition-all duration-300"
            >
              {/* Game Header */}
              <div className="bg-gradient-to-r from-purple-500 to-blue-500 p-4 text-white">
                <div className="flex items-center justify-between mb-2">
                  <div className="text-3xl">{game.icon}</div>
                  <div className={`px-2 py-1 rounded-full text-xs font-bold ${
                    game.difficulty === 'Easy' ? 'bg-green-500' :
                    game.difficulty === 'Medium' ? 'bg-yellow-500' : 'bg-red-500'
                  }`}>
                    {game.difficulty}
                  </div>
                </div>
                <h3 className="text-xl font-bold">{game.name}</h3>
                <p className="text-sm opacity-90">{game.description}</p>
              </div>

              {/* Game Stats */}
              <div className="p-4">
                <div className="grid grid-cols-2 gap-4 mb-4">
                  <div className="text-center">
                    <div className="flex items-center justify-center space-x-1 text-green-600 mb-1">
                      <CurrencyRupeeIcon className="w-4 h-4" />
                      <span className="font-bold">₹{game.baseReward}</span>
                    </div>
                    <p className="text-xs text-gray-600">Base Reward</p>
                  </div>
                  
                  <div className="text-center">
                    <div className="flex items-center justify-center space-x-1 text-blue-600 mb-1">
                      <ClockIcon className="w-4 h-4" />
                      <span className="font-bold">{Math.floor(game.minDuration / 60)}m</span>
                    </div>
                    <p className="text-xs text-gray-600">Min Duration</p>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4 mb-4">
                  <div className="text-center">
                    <div className="flex items-center justify-center space-x-1 text-purple-600 mb-1">
                      <PlayIcon className="w-4 h-4" />
                      <span className="font-bold">{remainingGames}</span>
                    </div>
                    <p className="text-xs text-gray-600">Games Left</p>
                  </div>
                  
                  <div className="text-center">
                    <div className="flex items-center justify-center space-x-1 text-orange-600 mb-1">
                      <TrophyIcon className="w-4 h-4" />
                      <span className="font-bold">₹{totalEarnings.toFixed(2)}</span>
                    </div>
                    <p className="text-xs text-gray-600">Today's Earnings</p>
                  </div>
                </div>

                {/* Play Button */}
                <button
                  onClick={() => handlePlayGame(game.id)}
                  disabled={!canPlay}
                  className={`w-full py-3 px-4 rounded-lg font-bold transition-all duration-200 flex items-center justify-center space-x-2 ${
                    canPlay
                      ? 'bg-gradient-to-r from-green-500 to-emerald-500 text-white hover:from-green-600 hover:to-emerald-600 shadow-lg'
                      : 'bg-gray-200 text-gray-500 cursor-not-allowed'
                  }`}
                >
                  <PlayIcon className="w-5 h-5" />
                  <span>{canPlay ? 'Play Now' : 'Daily Limit Reached'}</span>
                </button>
              </div>
            </div>
          );
        })}
      </div>

      {/* Daily Summary */}
      <div className="mt-8 bg-white/90 backdrop-blur-md rounded-2xl shadow-xl border border-white/20 p-6">
        <h2 className="text-xl font-bold text-gray-800 mb-4 flex items-center space-x-2">
          <StarIcon className="w-6 h-6 text-yellow-500" />
          <span>Today's Gaming Summary</span>
        </h2>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="text-center p-4 bg-gradient-to-r from-green-50 to-emerald-50 rounded-lg">
            <div className="text-2xl font-bold text-green-600">
              ₹{Object.values(gameStats).reduce((total: number, stat: any) => total + (stat.totalEarnings || 0), 0).toFixed(2)}
            </div>
            <p className="text-sm text-green-700">Total Earnings</p>
          </div>
          
          <div className="text-center p-4 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-lg">
            <div className="text-2xl font-bold text-blue-600">
              {Object.values(gameStats).reduce((total: number, stat: any) => total + (stat.gamesPlayed || 0), 0)}
            </div>
            <p className="text-sm text-blue-700">Games Played</p>
          </div>
          
          <div className="text-center p-4 bg-gradient-to-r from-purple-50 to-pink-50 rounded-lg">
            <div className="text-2xl font-bold text-purple-600">
              {Object.values(gameStats).reduce((total: number, stat: any) => total + (stat.highScore || 0), 0)}
            </div>
            <p className="text-sm text-purple-700">Total Score</p>
          </div>
        </div>
      </div>
    </div>
  );
}
