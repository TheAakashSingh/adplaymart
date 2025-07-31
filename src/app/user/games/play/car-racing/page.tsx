'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import {
  ArrowLeftIcon,
  TrophyIcon,
  CurrencyRupeeIcon,
  ClockIcon,
  HeartIcon
} from '@heroicons/react/24/outline';

interface Car {
  x: number;
  y: number;
  speed: number;
}

interface Obstacle {
  x: number;
  y: number;
  width: number;
  height: number;
}

export default function CarRacingGame() {
  const router = useRouter();
  const [gameState, setGameState] = useState<'waiting' | 'playing' | 'finished'>('waiting');
  const [playerCar, setPlayerCar] = useState<Car>({ x: 200, y: 450, speed: 5 });
  const [obstacles, setObstacles] = useState<Obstacle[]>([]);
  const [score, setScore] = useState<number>(0);
  const [distance, setDistance] = useState<number>(0);
  const [speed, setSpeed] = useState<number>(2);
  const [lives, setLives] = useState<number>(3);
  const [startTime, setStartTime] = useState<number>(0);
  const [gameTime, setGameTime] = useState<number>(0);
  const [reward, setReward] = useState<number>(0);
  const [submitting, setSubmitting] = useState<boolean>(false);
  const [keys, setKeys] = useState<{ [key: string]: boolean }>({});

  const GAME_WIDTH = 400;
  const GAME_HEIGHT = 500;
  const CAR_WIDTH = 40;
  const CAR_HEIGHT = 60;

  const updateGame = useCallback(() => {
    // Move player car
    setPlayerCar(prev => {
      let newX = prev.x;

      if (keys['ArrowLeft'] || keys['a'] || keys['A']) {
        newX = Math.max(50, prev.x - 8);
      }
      if (keys['ArrowRight'] || keys['d'] || keys['D']) {
        newX = Math.min(GAME_WIDTH - 50 - CAR_WIDTH, prev.x + 8);
      }

      return { ...prev, x: newX };
    });

    // Move obstacles
    setObstacles(prev => {
      const newObstacles = prev.map(obstacle => ({
        ...obstacle,
        y: obstacle.y + speed
      })).filter(obstacle => obstacle.y < GAME_HEIGHT);

      // Add new obstacles
      if (Math.random() < 0.02) {
        const lanes = [80, 160, 240, 320];
        const lane = lanes[Math.floor(Math.random() * lanes.length)];
        newObstacles.push({
          x: lane,
          y: -60,
          width: CAR_WIDTH,
          height: CAR_HEIGHT
        });
      }

      return newObstacles;
    });

    // Update score and speed
    setDistance(prev => prev + 1);
    setScore(prev => prev + 1);

    if (distance % 500 === 0) {
      setSpeed(prev => Math.min(8, prev + 0.5));
    }

    // Check collisions
    obstacles.forEach(obstacle => {
      if (
        playerCar.x < obstacle.x + obstacle.width &&
        playerCar.x + CAR_WIDTH > obstacle.x &&
        playerCar.y < obstacle.y + obstacle.height &&
        playerCar.y + CAR_HEIGHT > obstacle.y
      ) {
        // Collision detected
        setLives(prev => {
          const newLives = prev - 1;
          if (newLives <= 0) {
            setGameState('finished');
            calculateReward();
          }
          return newLives;
        });

        // Remove the obstacle that caused collision
        setObstacles(prev => prev.filter(obs => obs !== obstacle));
      }
    });
  }, [keys, speed, distance, playerCar, obstacles]);

  // Game loop
  useEffect(() => {
    let gameLoop: NodeJS.Timeout;
    if (gameState === 'playing') {
      gameLoop = setInterval(() => {
        updateGame();
      }, 50); // 20 FPS
    }
    return () => clearInterval(gameLoop);
  }, [gameState, updateGame]);

  // Timer
  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (gameState === 'playing') {
      interval = setInterval(() => {
        setGameTime(Date.now() - startTime);
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [gameState, startTime]);

  // Keyboard controls
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      setKeys(prev => ({ ...prev, [e.key]: true }));
    };

    const handleKeyUp = (e: KeyboardEvent) => {
      setKeys(prev => ({ ...prev, [e.key]: false }));
    };

    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);

    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
    };
  }, []);



  const startGame = () => {
    setPlayerCar({ x: 200, y: 450, speed: 5 });
    setObstacles([]);
    setScore(0);
    setDistance(0);
    setSpeed(2);
    setLives(3);
    setGameState('playing');
    setStartTime(Date.now());
  };

  const calculateReward = () => {
    const baseReward = 1.8;
    const scoreMultiplier = score / 1000;
    const timeMultiplier = gameTime >= 180000 ? 1 : 0.5; // Must play for at least 3 minutes
    const calculatedReward = baseReward * scoreMultiplier * timeMultiplier;
    setReward(Math.max(0.1, calculatedReward));
  };

  const submitGameResult = async () => {
    setSubmitting(true);
    try {
      const token = localStorage.getItem('token');
      const response = await fetch('/api/gaming/play-game', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          gameId: 'car-racing',
          gameType: 'action',
          score: score,
          duration: gameTime,
          completed: true
        })
      });

      const data = await response.json();
      
      if (data.success) {
        alert(`🎉 Game completed! You earned ₹${data.data.reward.toFixed(2)}`);
        router.push('/user/games/play');
      } else {
        alert(data.message || 'Failed to submit game result');
      }
    } catch (error) {
      console.error('Error submitting game result:', error);
      alert('Something went wrong. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  const formatTime = (ms: number) => {
    const seconds = Math.floor(ms / 1000);
    const minutes = Math.floor(seconds / 60);
    return `${minutes}:${(seconds % 60).toString().padStart(2, '0')}`;
  };

  const handleMobileControl = (direction: 'left' | 'right') => {
    setPlayerCar(prev => {
      let newX = prev.x;
      if (direction === 'left') {
        newX = Math.max(50, prev.x - 20);
      } else {
        newX = Math.min(GAME_WIDTH - 50 - CAR_WIDTH, prev.x + 20);
      }
      return { ...prev, x: newX };
    });
  };

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
        
        <h1 className="text-2xl font-bold text-gray-800">🏎️ Car Racing</h1>
        
        <div className="flex items-center space-x-4">
          {gameState === 'playing' && (
            <>
              <div className="flex items-center space-x-1 text-red-600">
                <HeartIcon className="w-5 h-5" />
                <span className="font-bold">{lives}</span>
              </div>
              <div className="flex items-center space-x-1 text-blue-600">
                <ClockIcon className="w-5 h-5" />
                <span className="font-bold">{formatTime(gameTime)}</span>
              </div>
            </>
          )}
        </div>
      </div>

      {/* Game Container */}
      <div className="max-w-md mx-auto">
        <div className="bg-white/90 backdrop-blur-md rounded-2xl shadow-xl border border-white/20 p-6">
          
          {gameState === 'waiting' && (
            <div className="text-center">
              <div className="text-6xl mb-4">🏎️</div>
              <h2 className="text-2xl font-bold text-gray-800 mb-4">Car Racing Game</h2>
              <p className="text-gray-600 mb-6">
                Race through traffic and avoid obstacles to score points!
              </p>
              
              <div className="bg-gradient-to-r from-blue-50 to-purple-50 rounded-lg p-4 mb-6">
                <h3 className="font-bold text-gray-800 mb-2">Controls:</h3>
                <div className="text-sm text-gray-600 space-y-1">
                  <p>• Arrow Keys or A/D to steer</p>
                  <p>• Avoid other cars and obstacles</p>
                  <p>• Speed increases over time</p>
                  <p>• You have 3 lives</p>
                  <p>• Play for at least 3 minutes to earn rewards</p>
                </div>
              </div>
              
              <button
                onClick={startGame}
                className="w-full bg-gradient-to-r from-green-500 to-emerald-500 text-white py-3 px-6 rounded-lg font-bold hover:from-green-600 hover:to-emerald-600 transition-all duration-200"
              >
                Start Racing
              </button>
            </div>
          )}

          {gameState === 'playing' && (
            <div>
              {/* Game Stats */}
              <div className="grid grid-cols-4 gap-2 mb-4">
                <div className="text-center">
                  <div className="text-lg font-bold text-green-600">{score}</div>
                  <div className="text-xs text-gray-600">Score</div>
                </div>
                <div className="text-center">
                  <div className="text-lg font-bold text-blue-600">{Math.floor(distance / 10)}m</div>
                  <div className="text-xs text-gray-600">Distance</div>
                </div>
                <div className="text-center">
                  <div className="text-lg font-bold text-purple-600">{speed.toFixed(1)}</div>
                  <div className="text-xs text-gray-600">Speed</div>
                </div>
                <div className="text-center">
                  <div className="text-lg font-bold text-red-600">{lives}</div>
                  <div className="text-xs text-gray-600">Lives</div>
                </div>
              </div>

              {/* Game Area */}
              <div 
                className="relative bg-gray-800 rounded-lg mx-auto border-4 border-yellow-400"
                style={{ width: GAME_WIDTH, height: GAME_HEIGHT }}
              >
                {/* Road markings */}
                <div className="absolute inset-0">
                  {[...Array(10)].map((_, i) => (
                    <div
                      key={i}
                      className="absolute w-1 h-8 bg-white"
                      style={{
                        left: '50%',
                        top: `${i * 60}px`,
                        transform: 'translateX(-50%)'
                      }}
                    />
                  ))}
                </div>

                {/* Player Car */}
                <div
                  className="absolute bg-blue-500 rounded transition-all duration-100"
                  style={{
                    left: playerCar.x,
                    top: playerCar.y,
                    width: CAR_WIDTH,
                    height: CAR_HEIGHT
                  }}
                >
                  <div className="w-full h-full flex items-center justify-center text-white text-xs font-bold">
                    🚗
                  </div>
                </div>

                {/* Obstacles */}
                {obstacles.map((obstacle, index) => (
                  <div
                    key={index}
                    className="absolute bg-red-500 rounded"
                    style={{
                      left: obstacle.x,
                      top: obstacle.y,
                      width: obstacle.width,
                      height: obstacle.height
                    }}
                  >
                    <div className="w-full h-full flex items-center justify-center text-white text-xs font-bold">
                      🚙
                    </div>
                  </div>
                ))}
              </div>

              {/* Mobile Controls */}
              <div className="flex justify-center space-x-4 mt-4">
                <button
                  onTouchStart={() => handleMobileControl('left')}
                  onClick={() => handleMobileControl('left')}
                  className="bg-blue-500 text-white px-6 py-3 rounded-lg font-bold hover:bg-blue-600 transition-colors"
                >
                  ← Left
                </button>
                <button
                  onTouchStart={() => handleMobileControl('right')}
                  onClick={() => handleMobileControl('right')}
                  className="bg-blue-500 text-white px-6 py-3 rounded-lg font-bold hover:bg-blue-600 transition-colors"
                >
                  Right →
                </button>
              </div>

              <div className="text-center mt-4">
                <p className="text-sm text-gray-600">Use arrow keys or buttons to steer!</p>
              </div>
            </div>
          )}

          {gameState === 'finished' && (
            <div className="text-center">
              <div className="text-6xl mb-4">
                {score > 1000 ? '🏆' : score > 500 ? '🥈' : '💥'}
              </div>
              <h2 className="text-2xl font-bold text-gray-800 mb-4">Race Complete!</h2>
              
              <div className="bg-gradient-to-r from-green-50 to-emerald-50 rounded-lg p-4 mb-6">
                <div className="grid grid-cols-2 gap-4 text-center">
                  <div>
                    <div className="text-lg font-bold text-green-600">{score}</div>
                    <div className="text-xs text-gray-600">Final Score</div>
                  </div>
                  <div>
                    <div className="text-lg font-bold text-blue-600">{Math.floor(distance / 10)}m</div>
                    <div className="text-xs text-gray-600">Distance Traveled</div>
                  </div>
                  <div>
                    <div className="text-lg font-bold text-purple-600">{formatTime(gameTime)}</div>
                    <div className="text-xs text-gray-600">Time Played</div>
                  </div>
                  <div>
                    <div className="text-lg font-bold text-orange-600">₹{reward.toFixed(2)}</div>
                    <div className="text-xs text-gray-600">Estimated Reward</div>
                  </div>
                </div>
              </div>

              <div className="space-y-3">
                <button
                  onClick={submitGameResult}
                  disabled={submitting}
                  className="w-full bg-gradient-to-r from-green-500 to-emerald-500 text-white py-3 px-6 rounded-lg font-bold hover:from-green-600 hover:to-emerald-600 transition-all duration-200 disabled:opacity-50"
                >
                  {submitting ? 'Submitting...' : 'Claim Reward'}
                </button>
                
                <button
                  onClick={startGame}
                  className="w-full bg-gradient-to-r from-blue-500 to-purple-500 text-white py-3 px-6 rounded-lg font-bold hover:from-blue-600 hover:to-purple-600 transition-all duration-200"
                >
                  Race Again
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
