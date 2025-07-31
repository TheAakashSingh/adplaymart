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

const colors = [
  { name: 'Red', value: '#EF4444', bg: 'bg-red-500' },
  { name: 'Blue', value: '#3B82F6', bg: 'bg-blue-500' },
  { name: 'Green', value: '#10B981', bg: 'bg-green-500' },
  { name: 'Yellow', value: '#F59E0B', bg: 'bg-yellow-500' },
  { name: 'Purple', value: '#8B5CF6', bg: 'bg-purple-500' },
  { name: 'Pink', value: '#EC4899', bg: 'bg-pink-500' },
  { name: 'Orange', value: '#F97316', bg: 'bg-orange-500' },
  { name: 'Indigo', value: '#6366F1', bg: 'bg-indigo-500' }
];

export default function ColorMatchGame() {
  const router = useRouter();
  const [gameState, setGameState] = useState<'waiting' | 'playing' | 'finished'>('waiting');
  const [currentColor, setCurrentColor] = useState<any>(null);
  const [score, setScore] = useState<number>(0);
  const [lives, setLives] = useState<number>(3);
  const [timeLeft, setTimeLeft] = useState<number>(60);
  const [startTime, setStartTime] = useState<number>(0);
  const [gameTime, setGameTime] = useState<number>(0);
  const [streak, setStreak] = useState<number>(0);
  const [bestStreak, setBestStreak] = useState<number>(0);
  const [reward, setReward] = useState<number>(0);
  const [submitting, setSubmitting] = useState<boolean>(false);
  const [difficulty, setDifficulty] = useState<'easy' | 'medium' | 'hard'>('medium');

  const difficultySettings = {
    easy: { timeLimit: 90, pointsPerMatch: 10, timeBonus: 2 },
    medium: { timeLimit: 60, pointsPerMatch: 15, timeBonus: 3 },
    hard: { timeLimit: 45, pointsPerMatch: 20, timeBonus: 5 }
  };

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

  const startGame = () => {
    const settings = difficultySettings[difficulty];
    setGameState('playing');
    setStartTime(Date.now());
    setTimeLeft(settings.timeLimit);
    setScore(0);
    setLives(3);
    setStreak(0);
    setBestStreak(0);
    generateNewColor();
  };

  const generateNewColor = () => {
    const randomColor = colors[Math.floor(Math.random() * colors.length)];
    setCurrentColor(randomColor);
  };

  const handleColorClick = (selectedColor: any) => {
    if (gameState !== 'playing') return;

    const settings = difficultySettings[difficulty];
    
    if (selectedColor.name === currentColor.name) {
      // Correct match!
      const newStreak = streak + 1;
      setStreak(newStreak);
      if (newStreak > bestStreak) {
        setBestStreak(newStreak);
      }
      
      const streakBonus = Math.floor(newStreak / 5) * 5; // Bonus every 5 streak
      const points = settings.pointsPerMatch + streakBonus;
      setScore(prev => prev + points);
      
      generateNewColor();
    } else {
      // Wrong match
      setStreak(0);
      setLives(prev => {
        const newLives = prev - 1;
        if (newLives <= 0) {
          setGameState('finished');
          calculateReward();
        }
        return newLives;
      });
    }
  };

  const calculateReward = () => {
    const baseReward = 0.5;
    const scoreMultiplier = score / 100;
    const streakBonus = bestStreak * 0.01;
    const timeMultiplier = gameTime >= 60000 ? 1 : 0.5; // Must play for at least 1 minute
    const calculatedReward = baseReward * scoreMultiplier + streakBonus * timeMultiplier;
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
          gameId: 'color-match',
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
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
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
        
        <h1 className="text-2xl font-bold text-gray-800">🎨 Color Match</h1>
        
        <div className="flex items-center space-x-4">
          {gameState === 'playing' && (
            <>
              <div className="flex items-center space-x-1 text-red-600">
                <HeartIcon className="w-5 h-5" />
                <span className="font-bold">{lives}</span>
              </div>
              <div className="flex items-center space-x-1 text-blue-600">
                <ClockIcon className="w-5 h-5" />
                <span className="font-bold">{formatTime(timeLeft)}</span>
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
              <div className="text-6xl mb-4">🎨</div>
              <h2 className="text-2xl font-bold text-gray-800 mb-4">Color Match Game</h2>
              <p className="text-gray-600 mb-6">
                Match the color name with the correct color as fast as you can!
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
                  <li>• A color name will appear</li>
                  <li>• Click the matching color quickly</li>
                  <li>• Build streaks for bonus points</li>
                  <li>• You have 3 lives</li>
                  <li>• Race against time!</li>
                </ul>
              </div>
              
              <button
                onClick={startGame}
                className="w-full bg-gradient-to-r from-green-500 to-emerald-500 text-white py-3 px-6 rounded-lg font-bold hover:from-green-600 hover:to-emerald-600 transition-all duration-200"
              >
                Start Game
              </button>
            </div>
          )}

          {gameState === 'playing' && (
            <div className="text-center">
              {/* Game Stats */}
              <div className="grid grid-cols-4 gap-2 mb-6">
                <div className="text-center">
                  <div className="text-lg font-bold text-green-600">{score}</div>
                  <div className="text-xs text-gray-600">Score</div>
                </div>
                <div className="text-center">
                  <div className="text-lg font-bold text-purple-600">{streak}</div>
                  <div className="text-xs text-gray-600">Streak</div>
                </div>
                <div className="text-center">
                  <div className="text-lg font-bold text-orange-600">{bestStreak}</div>
                  <div className="text-xs text-gray-600">Best</div>
                </div>
                <div className="text-center">
                  <div className="text-lg font-bold text-red-600">{lives}</div>
                  <div className="text-xs text-gray-600">Lives</div>
                </div>
              </div>

              {/* Current Color Challenge */}
              {currentColor && (
                <div className="mb-8">
                  <h3 className="text-xl font-bold text-gray-800 mb-4">Find this color:</h3>
                  <div className="text-4xl font-bold text-gray-900 mb-6 p-4 bg-gray-100 rounded-lg">
                    {currentColor.name}
                  </div>
                </div>
              )}

              {/* Color Options */}
              <div className="grid grid-cols-2 gap-3">
                {colors.map((color, index) => (
                  <button
                    key={index}
                    onClick={() => handleColorClick(color)}
                    className={`${color.bg} h-20 rounded-lg shadow-lg hover:scale-105 transition-all duration-200 flex items-center justify-center text-white font-bold text-lg`}
                  >
                    {color.name}
                  </button>
                ))}
              </div>
            </div>
          )}

          {gameState === 'finished' && (
            <div className="text-center">
              <div className="text-6xl mb-4">
                {score > 200 ? '🏆' : score > 100 ? '🥈' : '🥉'}
              </div>
              <h2 className="text-2xl font-bold text-gray-800 mb-4">Game Complete!</h2>
              
              <div className="bg-gradient-to-r from-green-50 to-emerald-50 rounded-lg p-4 mb-6">
                <div className="grid grid-cols-2 gap-4 text-center">
                  <div>
                    <div className="text-lg font-bold text-green-600">{score}</div>
                    <div className="text-xs text-gray-600">Final Score</div>
                  </div>
                  <div>
                    <div className="text-lg font-bold text-purple-600">{bestStreak}</div>
                    <div className="text-xs text-gray-600">Best Streak</div>
                  </div>
                  <div>
                    <div className="text-lg font-bold text-blue-600">{formatTime(Math.floor(gameTime / 1000))}</div>
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
