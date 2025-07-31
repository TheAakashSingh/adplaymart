'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import {
  TrophyIcon,
  PlayIcon,
  CurrencyRupeeIcon,
  StarIcon,
  FireIcon,
  PuzzlePieceIcon,
  BoltIcon,
  ChartBarIcon,
  ClockIcon,
  CheckCircleIcon
} from '@heroicons/react/24/outline';

interface GameStats {
  gaming: {
    totalEarnings: number;
    gamesPlayed: number;
    highScore: number;
  };
  todayStats: {
    casual: {
      played: number;
      earned: number;
      remaining: number;
      maxPerDay: number;
    };
    puzzle: {
      played: number;
      earned: number;
      remaining: number;
      maxPerDay: number;
    };
    action: {
      played: number;
      earned: number;
      remaining: number;
      maxPerDay: number;
    };
  };
  rewards: {
    casual: {
      rewardPerGame: number;
      maxGamesPerDay: number;
    };
    puzzle: {
      rewardPerGame: number;
      maxGamesPerDay: number;
    };
    action: {
      rewardPerGame: number;
      maxGamesPerDay: number;
    };
  };
}

interface Game {
  id: string;
  name: string;
  type: 'casual' | 'puzzle' | 'action';
  description: string;
  reward: number;
  duration: number;
  difficulty: 'Easy' | 'Medium' | 'Hard';
  icon: string;
  available: boolean;
}

export default function GamesPage() {
  const router = useRouter();
  const [gameStats, setGameStats] = useState<GameStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [playingGame, setPlayingGame] = useState<string | null>(null);
  const [gameResult, setGameResult] = useState<any>(null);

  const games: Game[] = [
    {
      id: 'bubble-shooter',
      name: 'Bubble Shooter',
      type: 'casual',
      description: 'Pop colorful bubbles and earn rewards',
      reward: 5,
      duration: 3,
      difficulty: 'Easy',
      icon: '🎯',
      available: true
    },
    {
      id: 'number-puzzle',
      name: 'Number Puzzle',
      type: 'puzzle',
      description: 'Solve number puzzles to earn more',
      reward: 10,
      duration: 5,
      difficulty: 'Medium',
      icon: '🧩',
      available: true
    },
    {
      id: 'space-shooter',
      name: 'Space Shooter',
      type: 'action',
      description: 'Defend the galaxy and earn big rewards',
      reward: 15,
      duration: 7,
      difficulty: 'Hard',
      icon: '🚀',
      available: true
    },
    {
      id: 'word-match',
      name: 'Word Match',
      type: 'puzzle',
      description: 'Match words and boost your earnings',
      reward: 8,
      duration: 4,
      difficulty: 'Medium',
      icon: '📝',
      available: true
    },
    {
      id: 'color-rush',
      name: 'Color Rush',
      type: 'casual',
      description: 'Quick color matching game',
      reward: 6,
      duration: 2,
      difficulty: 'Easy',
      icon: '🌈',
      available: true
    },
    {
      id: 'tower-defense',
      name: 'Tower Defense',
      type: 'action',
      description: 'Strategic tower defense gameplay',
      reward: 20,
      duration: 10,
      difficulty: 'Hard',
      icon: '🏰',
      available: true
    }
  ];

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (!token) {
      router.push('/auth/login');
      return;
    }
    
    fetchGameStats(token);
  }, [router]);

  const fetchGameStats = async (token: string) => {
    try {
      const response = await fetch('/api/gaming/play-game', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      
      if (response.ok) {
        const data = await response.json();
        setGameStats(data.data);
      }
    } catch (error) {
      console.error('Error fetching game stats:', error);
    } finally {
      setLoading(false);
    }
  };

  const handlePlayGame = async (game: Game) => {
    // Redirect to the new interactive games page
    router.push('/user/games/play');
  };

  const getGameTypeIcon = (type: string) => {
    switch (type) {
      case 'casual': return <PlayIcon className="w-5 h-5" />;
      case 'puzzle': return <PuzzlePieceIcon className="w-5 h-5" />;
      case 'action': return <BoltIcon className="w-5 h-5" />;
      default: return <PlayIcon className="w-5 h-5" />;
    }
  };

  const getGameTypeColor = (type: string) => {
    switch (type) {
      case 'casual': return 'from-green-400 to-emerald-500';
      case 'puzzle': return 'from-blue-400 to-indigo-500';
      case 'action': return 'from-red-400 to-pink-500';
      default: return 'from-gray-400 to-gray-500';
    }
  };

  const getDifficultyColor = (difficulty: string) => {
    switch (difficulty) {
      case 'Easy': return 'bg-green-100 text-green-800';
      case 'Medium': return 'bg-yellow-100 text-yellow-800';
      case 'Hard': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-50 via-blue-50 to-indigo-100 flex items-center justify-center">
        <div className="loading-spinner"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-blue-50 to-indigo-100">
      {/* Header */}
      <header className="bg-white/80 backdrop-blur-md shadow-lg border-b border-white/20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center space-x-4">
              <button 
                onClick={() => router.push('/user')}
                className="text-gray-600 hover:text-gray-900"
              >
                ← Back to Dashboard
              </button>
              <h1 className="text-2xl font-bold bg-gradient-to-r from-purple-600 to-blue-600 bg-clip-text text-transparent">
                Gaming Center
              </h1>
            </div>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Stats Overview */}
        {gameStats && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            <div className="bg-gradient-to-br from-green-500 to-emerald-600 rounded-2xl p-6 text-white shadow-xl">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-green-100 text-sm">Total Earnings</p>
                  <p className="text-3xl font-bold">₹{gameStats.gaming.totalEarnings}</p>
                </div>
                <CurrencyRupeeIcon className="w-8 h-8 text-white/80" />
              </div>
            </div>

            <div className="bg-gradient-to-br from-blue-500 to-indigo-600 rounded-2xl p-6 text-white shadow-xl">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-blue-100 text-sm">Games Played</p>
                  <p className="text-3xl font-bold">{gameStats.gaming.gamesPlayed}</p>
                </div>
                <PlayIcon className="w-8 h-8 text-white/80" />
              </div>
            </div>

            <div className="bg-gradient-to-br from-purple-500 to-pink-600 rounded-2xl p-6 text-white shadow-xl">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-purple-100 text-sm">High Score</p>
                  <p className="text-3xl font-bold">{gameStats.gaming.highScore}</p>
                </div>
                <TrophyIcon className="w-8 h-8 text-white/80" />
              </div>
            </div>

            <div className="bg-gradient-to-br from-orange-500 to-red-600 rounded-2xl p-6 text-white shadow-xl">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-orange-100 text-sm">Today's Earnings</p>
                  <p className="text-3xl font-bold">
                    ₹{gameStats.todayStats.casual.earned + gameStats.todayStats.puzzle.earned + gameStats.todayStats.action.earned}
                  </p>
                </div>
                <StarIcon className="w-8 h-8 text-white/80" />
              </div>
            </div>
          </div>
        )}

        {/* Daily Progress */}
        {gameStats && (
          <div className="bg-white/80 backdrop-blur-md rounded-2xl p-6 shadow-xl border border-white/20 mb-8">
            <h3 className="text-xl font-bold text-gray-800 mb-6">Today's Progress</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {Object.entries(gameStats.todayStats).map(([type, stats]) => (
                <div key={type} className="text-center">
                  <div className={`bg-gradient-to-r ${getGameTypeColor(type)} w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4`}>
                    <div className="text-white text-2xl">
                      {getGameTypeIcon(type)}
                    </div>
                  </div>
                  <h4 className="text-lg font-bold text-gray-800 capitalize mb-2">{type} Games</h4>
                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-600">Played:</span>
                      <span className="font-medium">{stats.played}/{stats.maxPerDay}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-600">Earned:</span>
                      <span className="font-medium text-green-600">₹{stats.earned}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-600">Remaining:</span>
                      <span className="font-medium text-blue-600">{stats.remaining}</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Games Grid */}
        <div className="mb-8">
          <h3 className="text-2xl font-bold text-gray-800 mb-6">Available Games</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {games.map((game) => {
              const typeStats = gameStats?.todayStats[game.type];
              const canPlay = typeStats ? typeStats.remaining > 0 : false;
              const isPlaying = playingGame === game.id;
              
              return (
                <div key={game.id} className="bg-white/90 backdrop-blur-md rounded-2xl shadow-xl border border-white/20 overflow-hidden hover:scale-105 transition-all duration-300">
                  <div className={`bg-gradient-to-r ${getGameTypeColor(game.type)} p-4 text-white`}>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-3">
                        <div className="text-3xl">{game.icon}</div>
                        <div>
                          <h4 className="text-lg font-bold">{game.name}</h4>
                          <p className="text-sm opacity-90 capitalize">{game.type} Game</p>
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="text-xl font-bold">₹{game.reward}</div>
                        <div className="text-xs opacity-90">Reward</div>
                      </div>
                    </div>
                  </div>
                  
                  <div className="p-6">
                    <p className="text-gray-600 text-sm mb-4">{game.description}</p>
                    
                    <div className="flex items-center justify-between mb-4">
                      <div className="flex items-center space-x-2">
                        <ClockIcon className="w-4 h-4 text-gray-500" />
                        <span className="text-sm text-gray-600">{game.duration} min</span>
                      </div>
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${getDifficultyColor(game.difficulty)}`}>
                        {game.difficulty}
                      </span>
                    </div>
                    
                    <button
                      onClick={() => handlePlayGame(game)}
                      disabled={!canPlay || isPlaying}
                      className={`w-full py-3 px-4 rounded-lg font-bold transition-all duration-200 flex items-center justify-center space-x-2 ${
                        !canPlay
                          ? 'bg-gray-100 text-gray-500 cursor-not-allowed'
                          : isPlaying
                          ? 'bg-yellow-500 text-white cursor-not-allowed'
                          : `bg-gradient-to-r ${getGameTypeColor(game.type)} text-white hover:shadow-lg`
                      }`}
                    >
                      {isPlaying ? (
                        <>
                          <div className="loading-spinner w-4 h-4"></div>
                          <span>Playing...</span>
                        </>
                      ) : !canPlay ? (
                        <>
                          <CheckCircleIcon className="w-5 h-5" />
                          <span>Daily Limit Reached</span>
                        </>
                      ) : (
                        <>
                          <PlayIcon className="w-5 h-5" />
                          <span>Play Now</span>
                        </>
                      )}
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Game Result Modal */}
        {gameResult && (
          <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
            <div className="bg-white rounded-2xl max-w-md w-full p-6 text-center">
              <div className="text-6xl mb-4">🎉</div>
              <h3 className="text-2xl font-bold text-gray-800 mb-2">Game Completed!</h3>
              <p className="text-gray-600 mb-4">{gameResult.message}</p>
              
              <div className="bg-green-50 rounded-lg p-4 mb-6">
                <div className="text-3xl font-bold text-green-600">₹{gameResult.reward}</div>
                <div className="text-green-700 text-sm">Reward Earned</div>
              </div>
              
              <div className="text-sm text-gray-600 mb-6">
                Score: {gameResult.score} | Game: {gameResult.game}
              </div>
              
              <button
                onClick={() => setGameResult(null)}
                className="bg-gradient-to-r from-blue-500 to-purple-500 text-white px-6 py-2 rounded-lg hover:from-blue-600 hover:to-purple-600 transition-all duration-200"
              >
                Continue Playing
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
