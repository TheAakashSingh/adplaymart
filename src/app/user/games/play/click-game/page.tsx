'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import {
  ArrowLeftIcon,
  TrophyIcon,
  CurrencyRupeeIcon,
  ClockIcon,
  HeartIcon
} from '@heroicons/react/24/outline';

interface Target {
  id: number;
  x: number;
  y: number;
  size: number;
  color: string;
  points: number;
  timeLeft: number;
}

export default function ClickMasterGame() {
  const router = useRouter();
  const [gameState, setGameState] = useState<'waiting' | 'playing' | 'finished'>('waiting');
  const [targets, setTargets] = useState<Target[]>([]);
  const [score, setScore] = useState<number>(0);
  const [clicks, setClicks] = useState<number>(0);
  const [timeLeft, setTimeLeft] = useState<number>(30);
  const [startTime, setStartTime] = useState<number>(0);
  const [gameTime, setGameTime] = useState<number>(0);
  const [combo, setCombo] = useState<number>(0);
  const [maxCombo, setMaxCombo] = useState<number>(0);
  const [reward, setReward] = useState<number>(0);
  const [submitting, setSubmitting] = useState<boolean>(false);
  const [difficulty, setDifficulty] = useState<'easy' | 'medium' | 'hard'>('medium');

  const difficultySettings = {
    easy: { timeLimit: 45, targetSpeed: 3000, maxTargets: 3, basePoints: 10 },
    medium: { timeLimit: 30, targetSpeed: 2000, maxTargets: 5, basePoints: 15 },
    hard: { timeLimit: 20, targetSpeed: 1500, maxTargets: 7, basePoints: 20 }
  };

  const targetColors = [
    { color: '#EF4444', points: 10 }, // Red
    { color: '#3B82F6', points: 15 }, // Blue
    { color: '#10B981', points: 20 }, // Green
    { color: '#F59E0B', points: 25 }, // Yellow
    { color: '#8B5CF6', points: 30 }, // Purple
    { color: '#EC4899', points: 35 }, // Pink
  ];

  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (gameState === 'playing' && timeLeft > 0) {
      interval = setInterval(() => {
        setTimeLeft(prev => {
          if (prev <= 1) {
            setGameState('finished');
            calculateReward();
            return 0;
          }
          return prev - 1;
        });
        setGameTime(Date.now() - startTime);
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [gameState, timeLeft, startTime]);

  // Target generation
  useEffect(() => {
    let targetInterval: NodeJS.Timeout;
    if (gameState === 'playing') {
      const settings = difficultySettings[difficulty];
      targetInterval = setInterval(() => {
        if (targets.length < settings.maxTargets) {
          generateTarget();
        }
      }, settings.targetSpeed);
    }
    return () => clearInterval(targetInterval);
  }, [gameState, targets.length, difficulty]);

  // Target lifecycle
  useEffect(() => {
    let lifecycleInterval: NodeJS.Timeout;
    if (gameState === 'playing') {
      lifecycleInterval = setInterval(() => {
        setTargets(prev => prev.map(target => ({
          ...target,
          timeLeft: target.timeLeft - 100
        })).filter(target => target.timeLeft > 0));
      }, 100);
    }
    return () => clearInterval(lifecycleInterval);
  }, [gameState]);

  const generateTarget = () => {
    const gameArea = { width: 350, height: 400 };
    const size = Math.random() * 40 + 30; // 30-70px
    const colorData = targetColors[Math.floor(Math.random() * targetColors.length)];
    
    const newTarget: Target = {
      id: Date.now() + Math.random(),
      x: Math.random() * (gameArea.width - size),
      y: Math.random() * (gameArea.height - size),
      size,
      color: colorData.color,
      points: Math.floor(colorData.points * (70 / size)), // Smaller targets = more points
      timeLeft: Math.random() * 3000 + 2000 // 2-5 seconds
    };

    setTargets(prev => [...prev, newTarget]);
  };

  const handleTargetClick = (target: Target) => {
    if (gameState !== 'playing') return;

    setTargets(prev => prev.filter(t => t.id !== target.id));
    setClicks(prev => prev + 1);
    
    const comboMultiplier = Math.floor(combo / 5) + 1;
    const points = target.points * comboMultiplier;
    setScore(prev => prev + points);
    
    setCombo(prev => {
      const newCombo = prev + 1;
      if (newCombo > maxCombo) {
        setMaxCombo(newCombo);
      }
      return newCombo;
    });

    // Reset combo if no click for 2 seconds
    setTimeout(() => {
      setCombo(prev => Math.max(0, prev - 1));
    }, 2000);
  };

  const handleMissClick = () => {
    if (gameState !== 'playing') return;
    setCombo(0);
    setClicks(prev => prev + 1);
  };

  const startGame = () => {
    const settings = difficultySettings[difficulty];
    setGameState('playing');
    setStartTime(Date.now());
    setTimeLeft(settings.timeLimit);
    setScore(0);
    setClicks(0);
    setCombo(0);
    setMaxCombo(0);
    setTargets([]);
  };

  const calculateReward = () => {
    const baseReward = 0.3;
    const scoreMultiplier = score / 500;
    const accuracyBonus = clicks > 0 ? (score / (clicks * 20)) : 0;
    const comboBonus = maxCombo * 0.01;
    const timeMultiplier = gameTime >= 30000 ? 1 : 0.5; // Must play for at least 30 seconds
    const calculatedReward = baseReward * scoreMultiplier + accuracyBonus + comboBonus * timeMultiplier;
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
          gameId: 'click-game',
          gameType: 'casual',
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

  const formatTime = (seconds: number) => {
    return `${seconds}s`;
  };

  const getAccuracy = () => {
    if (clicks === 0) return 0;
    const hits = targets.length === 0 ? clicks - (clicks - score / 15) : clicks;
    return Math.round((hits / clicks) * 100);
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
        
        <h1 className="text-2xl font-bold text-gray-800">👆 Click Master</h1>
        
        <div className="flex items-center space-x-4">
          {gameState === 'playing' && (
            <div className="flex items-center space-x-1 text-blue-600">
              <ClockIcon className="w-5 h-5" />
              <span className="font-bold">{formatTime(timeLeft)}</span>
            </div>
          )}
        </div>
      </div>

      {/* Game Container */}
      <div className="max-w-md mx-auto">
        <div className="bg-white/90 backdrop-blur-md rounded-2xl shadow-xl border border-white/20 p-6">
          
          {gameState === 'waiting' && (
            <div className="text-center">
              <div className="text-6xl mb-4">👆</div>
              <h2 className="text-2xl font-bold text-gray-800 mb-4">Click Master</h2>
              <p className="text-gray-600 mb-6">
                Click on targets as fast as you can! Smaller targets give more points.
              </p>

              {/* Difficulty Selection */}
              <div className="mb-6">
                <h3 className="font-bold text-gray-800 mb-3">Choose Difficulty:</h3>
                <div className="grid grid-cols-3 gap-3">
                  {Object.entries(difficultySettings).map(([level, settings]) => (
                    <button
                      key={level}
                      onClick={() => setDifficulty(level as any)}
                      className={`p-3 rounded-lg border-2 transition-all ${
                        difficulty === level
                          ? 'border-blue-500 bg-blue-50'
                          : 'border-gray-200 hover:border-gray-300'
                      }`}
                    >
                      <div className="font-bold capitalize">{level}</div>
                      <div className="text-sm text-gray-600">{settings.timeLimit}s</div>
                    </button>
                  ))}
                </div>
              </div>

              <div className="bg-gradient-to-r from-blue-50 to-purple-50 rounded-lg p-4 mb-6">
                <h3 className="font-bold text-gray-800 mb-2">How to Play:</h3>
                <ul className="text-sm text-gray-600 text-left space-y-1">
                  <li>• Click on colored targets quickly</li>
                  <li>• Smaller targets = more points</li>
                  <li>• Build combos for multipliers</li>
                  <li>• Targets disappear after a few seconds</li>
                  <li>• Missing targets breaks your combo</li>
                </ul>
              </div>
              
              <button
                onClick={startGame}
                className="w-full bg-gradient-to-r from-green-500 to-emerald-500 text-white py-3 px-6 rounded-lg font-bold hover:from-green-600 hover:to-emerald-600 transition-all duration-200"
              >
                Start Clicking
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
                  <div className="text-lg font-bold text-purple-600">{combo}</div>
                  <div className="text-xs text-gray-600">Combo</div>
                </div>
                <div className="text-center">
                  <div className="text-lg font-bold text-blue-600">{clicks}</div>
                  <div className="text-xs text-gray-600">Clicks</div>
                </div>
                <div className="text-center">
                  <div className="text-lg font-bold text-orange-600">{getAccuracy()}%</div>
                  <div className="text-xs text-gray-600">Accuracy</div>
                </div>
              </div>

              {/* Combo indicator */}
              {combo > 0 && (
                <div className="text-center mb-4">
                  <div className={`inline-block px-3 py-1 rounded-full text-white font-bold ${
                    combo >= 10 ? 'bg-red-500' : combo >= 5 ? 'bg-orange-500' : 'bg-blue-500'
                  }`}>
                    {combo}x COMBO!
                  </div>
                </div>
              )}

              {/* Game Area */}
              <div 
                className="relative bg-gradient-to-br from-gray-100 to-gray-200 rounded-lg mx-auto border-2 border-gray-300 cursor-crosshair"
                style={{ width: 350, height: 400 }}
                onClick={handleMissClick}
              >
                {/* Targets */}
                {targets.map(target => (
                  <button
                    key={target.id}
                    onClick={(e) => {
                      e.stopPropagation();
                      handleTargetClick(target);
                    }}
                    className="absolute rounded-full border-2 border-white shadow-lg hover:scale-110 transition-transform duration-100 flex items-center justify-center text-white font-bold"
                    style={{
                      left: target.x,
                      top: target.y,
                      width: target.size,
                      height: target.size,
                      backgroundColor: target.color,
                      fontSize: `${Math.max(10, target.size / 4)}px`
                    }}
                  >
                    {target.points}
                  </button>
                ))}

                {/* Instructions overlay */}
                {targets.length === 0 && (
                  <div className="absolute inset-0 flex items-center justify-center">
                    <div className="text-gray-500 text-center">
                      <div className="text-4xl mb-2">🎯</div>
                      <p className="text-sm">Targets will appear here!</p>
                    </div>
                  </div>
                )}
              </div>

              <div className="text-center mt-4">
                <p className="text-sm text-gray-600">Click on the colored targets!</p>
              </div>
            </div>
          )}

          {gameState === 'finished' && (
            <div className="text-center">
              <div className="text-6xl mb-4">
                {score > 500 ? '🏆' : score > 200 ? '🥈' : '🎯'}
              </div>
              <h2 className="text-2xl font-bold text-gray-800 mb-4">Game Complete!</h2>
              
              <div className="bg-gradient-to-r from-green-50 to-emerald-50 rounded-lg p-4 mb-6">
                <div className="grid grid-cols-2 gap-4 text-center">
                  <div>
                    <div className="text-lg font-bold text-green-600">{score}</div>
                    <div className="text-xs text-gray-600">Final Score</div>
                  </div>
                  <div>
                    <div className="text-lg font-bold text-purple-600">{maxCombo}</div>
                    <div className="text-xs text-gray-600">Max Combo</div>
                  </div>
                  <div>
                    <div className="text-lg font-bold text-blue-600">{getAccuracy()}%</div>
                    <div className="text-xs text-gray-600">Accuracy</div>
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
