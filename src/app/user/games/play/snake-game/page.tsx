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

interface Position {
  x: number;
  y: number;
}

type Direction = 'UP' | 'DOWN' | 'LEFT' | 'RIGHT';

const GRID_SIZE = 20;
const INITIAL_SNAKE = [{ x: 10, y: 10 }];
const INITIAL_FOOD = { x: 15, y: 15 };

export default function SnakeGame() {
  const router = useRouter();
  const [gameState, setGameState] = useState<'waiting' | 'playing' | 'paused' | 'finished'>('waiting');
  const [snake, setSnake] = useState<Position[]>(INITIAL_SNAKE);
  const [food, setFood] = useState<Position>(INITIAL_FOOD);
  const [direction, setDirection] = useState<Direction>('RIGHT');
  const [score, setScore] = useState<number>(0);
  const [highScore, setHighScore] = useState<number>(0);
  const [startTime, setStartTime] = useState<number>(0);
  const [gameTime, setGameTime] = useState<number>(0);
  const [lives, setLives] = useState<number>(3);
  const [speed, setSpeed] = useState<number>(150);
  const [reward, setReward] = useState<number>(0);
  const [submitting, setSubmitting] = useState<boolean>(false);

  // Generate random food position
  const generateFood = useCallback((snakeBody: Position[]): Position => {
    let newFood: Position;
    do {
      newFood = {
        x: Math.floor(Math.random() * GRID_SIZE),
        y: Math.floor(Math.random() * GRID_SIZE)
      };
    } while (snakeBody.some(segment => segment.x === newFood.x && segment.y === newFood.y));
    return newFood;
  }, []);

  // Check collision with walls or self
  const checkCollision = useCallback((head: Position, snakeBody: Position[]): boolean => {
    // Wall collision
    if (head.x < 0 || head.x >= GRID_SIZE || head.y < 0 || head.y >= GRID_SIZE) {
      return true;
    }
    // Self collision
    return snakeBody.some(segment => segment.x === head.x && segment.y === head.y);
  }, []);

  // Move snake
  const moveSnake = useCallback(() => {
    if (gameState !== 'playing') return;

    setSnake(currentSnake => {
      const newSnake = [...currentSnake];
      const head = { ...newSnake[0] };

      // Move head based on direction
      switch (direction) {
        case 'UP':
          head.y -= 1;
          break;
        case 'DOWN':
          head.y += 1;
          break;
        case 'LEFT':
          head.x -= 1;
          break;
        case 'RIGHT':
          head.x += 1;
          break;
      }

      // Check collision
      if (checkCollision(head, newSnake)) {
        setLives(prev => {
          const newLives = prev - 1;
          if (newLives <= 0) {
            setGameState('finished');
            calculateReward();
          } else {
            // Reset snake position
            setSnake(INITIAL_SNAKE);
            setDirection('RIGHT');
            setFood(generateFood(INITIAL_SNAKE));
          }
          return newLives;
        });
        return currentSnake;
      }

      newSnake.unshift(head);

      // Check if food is eaten
      if (head.x === food.x && head.y === food.y) {
        setScore(prev => {
          const newScore = prev + 10;
          if (newScore > highScore) {
            setHighScore(newScore);
          }
          return newScore;
        });
        setFood(generateFood(newSnake));
        // Increase speed slightly
        setSpeed(prev => Math.max(80, prev - 2));
      } else {
        newSnake.pop();
      }

      return newSnake;
    });
  }, [direction, food, gameState, checkCollision, generateFood, highScore]);

  // Game loop
  useEffect(() => {
    if (gameState === 'playing') {
      const gameInterval = setInterval(moveSnake, speed);
      return () => clearInterval(gameInterval);
    }
  }, [moveSnake, speed, gameState]);

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
    const handleKeyPress = (e: KeyboardEvent) => {
      if (gameState !== 'playing') return;

      switch (e.key) {
        case 'ArrowUp':
        case 'w':
        case 'W':
          e.preventDefault();
          setDirection(prev => prev !== 'DOWN' ? 'UP' : prev);
          break;
        case 'ArrowDown':
        case 's':
        case 'S':
          e.preventDefault();
          setDirection(prev => prev !== 'UP' ? 'DOWN' : prev);
          break;
        case 'ArrowLeft':
        case 'a':
        case 'A':
          e.preventDefault();
          setDirection(prev => prev !== 'RIGHT' ? 'LEFT' : prev);
          break;
        case 'ArrowRight':
        case 'd':
        case 'D':
          e.preventDefault();
          setDirection(prev => prev !== 'LEFT' ? 'RIGHT' : prev);
          break;
        case ' ':
          e.preventDefault();
          setGameState(prev => prev === 'playing' ? 'paused' : 'playing');
          break;
      }
    };

    window.addEventListener('keydown', handleKeyPress);
    return () => window.removeEventListener('keydown', handleKeyPress);
  }, [gameState]);

  const startGame = () => {
    setSnake(INITIAL_SNAKE);
    setFood(generateFood(INITIAL_SNAKE));
    setDirection('RIGHT');
    setScore(0);
    setGameState('playing');
    setStartTime(Date.now());
    setLives(3);
    setSpeed(150);
  };

  const calculateReward = () => {
    const baseReward = 1.5;
    const scoreMultiplier = score / 100;
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
          gameId: 'snake-game',
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

  const handleDirectionChange = (newDirection: Direction) => {
    if (gameState !== 'playing') return;
    
    // Prevent reverse direction
    const opposites: Record<Direction, Direction> = {
      UP: 'DOWN',
      DOWN: 'UP',
      LEFT: 'RIGHT',
      RIGHT: 'LEFT'
    };
    
    if (direction !== opposites[newDirection]) {
      setDirection(newDirection);
    }
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
        
        <h1 className="text-2xl font-bold text-gray-800">🐍 Snake Game</h1>
        
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
      <div className="max-w-2xl mx-auto">
        <div className="bg-white/90 backdrop-blur-md rounded-2xl shadow-xl border border-white/20 p-6">
          
          {gameState === 'waiting' && (
            <div className="text-center">
              <div className="text-6xl mb-4">🐍</div>
              <h2 className="text-2xl font-bold text-gray-800 mb-4">Snake Game</h2>
              <p className="text-gray-600 mb-6">
                Control the snake to eat food and grow longer. Don't hit the walls or yourself!
              </p>
              
              <div className="bg-gradient-to-r from-blue-50 to-purple-50 rounded-lg p-4 mb-6">
                <h3 className="font-bold text-gray-800 mb-2">Controls:</h3>
                <div className="text-sm text-gray-600 space-y-1">
                  <p>• Arrow Keys or WASD to move</p>
                  <p>• Spacebar to pause/resume</p>
                  <p>• Eat food to grow and score points</p>
                  <p>• You have 3 lives</p>
                  <p>• Play for at least 3 minutes to earn rewards</p>
                </div>
              </div>
              
              <button
                onClick={startGame}
                className="w-full bg-gradient-to-r from-green-500 to-emerald-500 text-white py-3 px-6 rounded-lg font-bold hover:from-green-600 hover:to-emerald-600 transition-all duration-200"
              >
                Start Game
              </button>
            </div>
          )}

          {(gameState === 'playing' || gameState === 'paused') && (
            <div>
              {/* Game Stats */}
              <div className="flex justify-between items-center mb-4">
                <div className="text-center">
                  <div className="text-lg font-bold text-green-600">{score}</div>
                  <div className="text-xs text-gray-600">Score</div>
                </div>
                <div className="text-center">
                  <div className="text-lg font-bold text-purple-600">{highScore}</div>
                  <div className="text-xs text-gray-600">High Score</div>
                </div>
                <div className="text-center">
                  <div className="text-lg font-bold text-blue-600">{snake.length}</div>
                  <div className="text-xs text-gray-600">Length</div>
                </div>
                <div className="text-center">
                  <div className="text-lg font-bold text-red-600">{lives}</div>
                  <div className="text-xs text-gray-600">Lives</div>
                </div>
              </div>

              {gameState === 'paused' && (
                <div className="text-center mb-4 p-3 bg-yellow-50 rounded-lg">
                  <p className="text-yellow-800 font-bold">Game Paused</p>
                  <p className="text-sm text-yellow-600">Press spacebar to resume</p>
                </div>
              )}

              {/* Game Board */}
              <div className="bg-gray-900 rounded-lg p-2 mb-4">
                <div 
                  className="grid gap-0 mx-auto"
                  style={{ 
                    gridTemplateColumns: `repeat(${GRID_SIZE}, 1fr)`,
                    width: '400px',
                    height: '400px'
                  }}
                >
                  {Array.from({ length: GRID_SIZE * GRID_SIZE }).map((_, index) => {
                    const x = index % GRID_SIZE;
                    const y = Math.floor(index / GRID_SIZE);
                    
                    const isSnakeHead = snake[0]?.x === x && snake[0]?.y === y;
                    const isSnakeBody = snake.slice(1).some(segment => segment.x === x && segment.y === y);
                    const isFood = food.x === x && food.y === y;
                    
                    let cellClass = 'w-full h-full border border-gray-700';
                    
                    if (isSnakeHead) {
                      cellClass += ' bg-green-400';
                    } else if (isSnakeBody) {
                      cellClass += ' bg-green-600';
                    } else if (isFood) {
                      cellClass += ' bg-red-500';
                    } else {
                      cellClass += ' bg-gray-800';
                    }
                    
                    return (
                      <div key={index} className={cellClass}>
                        {isFood && <div className="w-full h-full flex items-center justify-center text-xs">🍎</div>}
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Mobile Controls */}
              <div className="grid grid-cols-3 gap-2 max-w-48 mx-auto">
                <div></div>
                <button
                  onClick={() => handleDirectionChange('UP')}
                  className="bg-blue-500 text-white p-3 rounded-lg font-bold hover:bg-blue-600 transition-colors"
                >
                  ↑
                </button>
                <div></div>
                <button
                  onClick={() => handleDirectionChange('LEFT')}
                  className="bg-blue-500 text-white p-3 rounded-lg font-bold hover:bg-blue-600 transition-colors"
                >
                  ←
                </button>
                <button
                  onClick={() => setGameState(prev => prev === 'playing' ? 'paused' : 'playing')}
                  className="bg-yellow-500 text-white p-3 rounded-lg font-bold hover:bg-yellow-600 transition-colors"
                >
                  ⏸️
                </button>
                <button
                  onClick={() => handleDirectionChange('RIGHT')}
                  className="bg-blue-500 text-white p-3 rounded-lg font-bold hover:bg-blue-600 transition-colors"
                >
                  →
                </button>
                <div></div>
                <button
                  onClick={() => handleDirectionChange('DOWN')}
                  className="bg-blue-500 text-white p-3 rounded-lg font-bold hover:bg-blue-600 transition-colors"
                >
                  ↓
                </button>
                <div></div>
              </div>
            </div>
          )}

          {gameState === 'finished' && (
            <div className="text-center">
              <div className="text-6xl mb-4">
                {score > 100 ? '🏆' : score > 50 ? '🥈' : '💀'}
              </div>
              <h2 className="text-2xl font-bold text-gray-800 mb-4">Game Over!</h2>
              
              <div className="bg-gradient-to-r from-green-50 to-emerald-50 rounded-lg p-4 mb-6">
                <div className="grid grid-cols-2 gap-4 text-center">
                  <div>
                    <div className="text-lg font-bold text-green-600">{score}</div>
                    <div className="text-xs text-gray-600">Final Score</div>
                  </div>
                  <div>
                    <div className="text-lg font-bold text-purple-600">{highScore}</div>
                    <div className="text-xs text-gray-600">High Score</div>
                  </div>
                  <div>
                    <div className="text-lg font-bold text-blue-600">{formatTime(gameTime)}</div>
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
                  Play Again
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
