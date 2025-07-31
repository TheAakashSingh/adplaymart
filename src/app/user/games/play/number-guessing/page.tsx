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

export default function NumberGuessingGame() {
  const router = useRouter();
  const [gameState, setGameState] = useState<'waiting' | 'playing' | 'finished'>('waiting');
  const [secretNumber, setSecretNumber] = useState<number>(0);
  const [guess, setGuess] = useState<string>('');
  const [attempts, setAttempts] = useState<number>(0);
  const [maxAttempts] = useState<number>(7);
  const [hints, setHints] = useState<string[]>([]);
  const [score, setScore] = useState<number>(0);
  const [startTime, setStartTime] = useState<number>(0);
  const [gameTime, setGameTime] = useState<number>(0);
  const [lives, setLives] = useState<number>(3);
  const [reward, setReward] = useState<number>(0);
  const [submitting, setSubmitting] = useState<boolean>(false);

  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (gameState === 'playing') {
      interval = setInterval(() => {
        setGameTime(Date.now() - startTime);
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [gameState, startTime]);

  const startGame = () => {
    const number = Math.floor(Math.random() * 100) + 1;
    setSecretNumber(number);
    setGameState('playing');
    setStartTime(Date.now());
    setAttempts(0);
    setHints([]);
    setScore(1000); // Start with 1000 points
    setLives(3);
    setGuess('');
  };

  const makeGuess = () => {
    if (!guess || isNaN(Number(guess))) return;

    const guessNum = Number(guess);
    const newAttempts = attempts + 1;
    setAttempts(newAttempts);

    if (guessNum === secretNumber) {
      // Win!
      const timeBonus = Math.max(0, 300 - Math.floor(gameTime / 1000)); // Bonus for speed
      const attemptBonus = Math.max(0, (maxAttempts - newAttempts) * 50); // Bonus for fewer attempts
      const finalScore = score + timeBonus + attemptBonus;
      setScore(finalScore);
      setHints([...hints, `🎉 Correct! You found ${secretNumber}!`]);
      setGameState('finished');
      calculateReward(finalScore, gameTime);
    } else {
      // Wrong guess
      setScore(Math.max(0, score - 50)); // Lose points for wrong guess
      
      if (newAttempts >= maxAttempts) {
        setLives(lives - 1);
        if (lives <= 1) {
          setHints([...hints, `💀 Game Over! The number was ${secretNumber}`]);
          setGameState('finished');
          calculateReward(score, gameTime);
        } else {
          // Reset for new round
          setAttempts(0);
          setSecretNumber(Math.floor(Math.random() * 100) + 1);
          setHints([...hints, `❤️ Life lost! New number generated. Lives: ${lives - 1}`]);
        }
      } else {
        // Give hint
        let hint = '';
        if (guessNum < secretNumber) {
          hint = `📈 Too low! Try higher than ${guessNum}`;
        } else {
          hint = `📉 Too high! Try lower than ${guessNum}`;
        }
        
        // Additional hints based on proximity
        const diff = Math.abs(guessNum - secretNumber);
        if (diff <= 5) {
          hint += ' 🔥 Very close!';
        } else if (diff <= 10) {
          hint += ' 🌡️ Getting warm!';
        } else if (diff <= 20) {
          hint += ' ❄️ Getting cold!';
        }
        
        setHints([...hints, hint]);
      }
    }
    
    setGuess('');
  };

  const calculateReward = (finalScore: number, duration: number) => {
    const baseReward = 0.5;
    const scoreMultiplier = finalScore / 1000;
    const timeMultiplier = duration >= 60000 ? 1 : 0.5; // Must play for at least 1 minute
    const calculatedReward = baseReward * scoreMultiplier * timeMultiplier;
    setReward(Math.max(0.1, calculatedReward)); // Minimum 0.1 rupees
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
          gameId: 'number-guessing',
          gameType: 'casual',
          score: score,
          duration: gameTime,
          completed: gameState === 'finished'
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
        
        <h1 className="text-2xl font-bold text-gray-800">🎯 Number Guessing</h1>
        
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
              <div className="text-6xl mb-4">🎯</div>
              <h2 className="text-2xl font-bold text-gray-800 mb-4">Number Guessing Game</h2>
              <p className="text-gray-600 mb-6">
                I'm thinking of a number between 1 and 100. Can you guess it in 7 attempts or less?
              </p>
              <div className="bg-gradient-to-r from-blue-50 to-purple-50 rounded-lg p-4 mb-6">
                <h3 className="font-bold text-gray-800 mb-2">How to Play:</h3>
                <ul className="text-sm text-gray-600 text-left space-y-1">
                  <li>• Guess a number between 1-100</li>
                  <li>• You have 7 attempts per life</li>
                  <li>• You start with 3 lives</li>
                  <li>• Faster guesses = higher score</li>
                  <li>• Play for at least 1 minute to earn rewards</li>
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
            <div>
              <div className="text-center mb-6">
                <div className="flex justify-between items-center mb-4">
                  <div className="text-center">
                    <div className="text-lg font-bold text-purple-600">{score}</div>
                    <div className="text-xs text-gray-600">Score</div>
                  </div>
                  <div className="text-center">
                    <div className="text-lg font-bold text-blue-600">{attempts}/{maxAttempts}</div>
                    <div className="text-xs text-gray-600">Attempts</div>
                  </div>
                  <div className="text-center">
                    <div className="text-lg font-bold text-red-600">{lives}</div>
                    <div className="text-xs text-gray-600">Lives</div>
                  </div>
                </div>
                
                <p className="text-gray-700 mb-4">Guess a number between 1 and 100:</p>
                
                <div className="flex space-x-2 mb-4">
                  <input
                    type="number"
                    value={guess}
                    onChange={(e) => setGuess(e.target.value)}
                    onKeyPress={(e) => e.key === 'Enter' && makeGuess()}
                    placeholder="Enter your guess"
                    min="1"
                    max="100"
                    className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                  <button
                    onClick={makeGuess}
                    disabled={!guess}
                    className="bg-gradient-to-r from-blue-500 to-purple-500 text-white px-6 py-2 rounded-lg font-bold hover:from-blue-600 hover:to-purple-600 transition-all duration-200 disabled:opacity-50"
                  >
                    Guess
                  </button>
                </div>
              </div>

              {/* Hints */}
              <div className="space-y-2 max-h-40 overflow-y-auto">
                {hints.map((hint, index) => (
                  <div key={index} className="bg-gray-50 rounded-lg p-3 text-sm">
                    {hint}
                  </div>
                ))}
              </div>
            </div>
          )}

          {gameState === 'finished' && (
            <div className="text-center">
              <div className="text-6xl mb-4">
                {score > 500 ? '🏆' : score > 200 ? '🥈' : '🥉'}
              </div>
              <h2 className="text-2xl font-bold text-gray-800 mb-4">Game Complete!</h2>
              
              <div className="bg-gradient-to-r from-green-50 to-emerald-50 rounded-lg p-4 mb-6">
                <div className="grid grid-cols-2 gap-4 text-center">
                  <div>
                    <div className="text-lg font-bold text-purple-600">{score}</div>
                    <div className="text-xs text-gray-600">Final Score</div>
                  </div>
                  <div>
                    <div className="text-lg font-bold text-blue-600">{formatTime(gameTime)}</div>
                    <div className="text-xs text-gray-600">Time Played</div>
                  </div>
                  <div>
                    <div className="text-lg font-bold text-orange-600">{attempts}</div>
                    <div className="text-xs text-gray-600">Total Attempts</div>
                  </div>
                  <div>
                    <div className="text-lg font-bold text-green-600">₹{reward.toFixed(2)}</div>
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
