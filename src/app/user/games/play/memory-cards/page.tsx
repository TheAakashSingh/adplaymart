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

interface Card {
  id: number;
  emoji: string;
  isFlipped: boolean;
  isMatched: boolean;
}

const cardEmojis = ['🐶', '🐱', '🐭', '🐹', '🐰', '🦊', '🐻', '🐼', '🐨', '🐯', '🦁', '🐮'];

export default function MemoryCardsGame() {
  const router = useRouter();
  const [gameState, setGameState] = useState<'waiting' | 'playing' | 'finished'>('waiting');
  const [cards, setCards] = useState<Card[]>([]);
  const [flippedCards, setFlippedCards] = useState<number[]>([]);
  const [matchedPairs, setMatchedPairs] = useState<number>(0);
  const [moves, setMoves] = useState<number>(0);
  const [score, setScore] = useState<number>(0);
  const [startTime, setStartTime] = useState<number>(0);
  const [gameTime, setGameTime] = useState<number>(0);
  const [lives, setLives] = useState<number>(3);
  const [mistakes, setMistakes] = useState<number>(0);
  const [maxMistakes] = useState<number>(10);
  const [reward, setReward] = useState<number>(0);
  const [submitting, setSubmitting] = useState<boolean>(false);
  const [difficulty, setDifficulty] = useState<'easy' | 'medium' | 'hard'>('medium');

  const difficultySettings = {
    easy: { pairs: 6, timeBonus: 200 },
    medium: { pairs: 8, timeBonus: 300 },
    hard: { pairs: 12, timeBonus: 500 }
  };

  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (gameState === 'playing') {
      interval = setInterval(() => {
        setGameTime(Date.now() - startTime);
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [gameState, startTime]);

  useEffect(() => {
    if (flippedCards.length === 2) {
      const [first, second] = flippedCards;
      const firstCard = cards.find(card => card.id === first);
      const secondCard = cards.find(card => card.id === second);

      if (firstCard && secondCard && firstCard.emoji === secondCard.emoji) {
        // Match found!
        setTimeout(() => {
          setCards(prev => prev.map(card => 
            card.id === first || card.id === second 
              ? { ...card, isMatched: true }
              : card
          ));
          setMatchedPairs(prev => prev + 1);
          setScore(prev => prev + 100);
          setFlippedCards([]);
        }, 500);
      } else {
        // No match
        setTimeout(() => {
          setCards(prev => prev.map(card => 
            card.id === first || card.id === second 
              ? { ...card, isFlipped: false }
              : card
          ));
          setMistakes(prev => prev + 1);
          setScore(prev => Math.max(0, prev - 20));
          setFlippedCards([]);
        }, 1000);
      }
      setMoves(prev => prev + 1);
    }
  }, [flippedCards, cards]);

  useEffect(() => {
    const totalPairs = difficultySettings[difficulty].pairs;
    if (matchedPairs === totalPairs && gameState === 'playing') {
      // Game won!
      setGameState('finished');
      calculateReward();
    }
  }, [matchedPairs, difficulty, gameState]);

  useEffect(() => {
    if (mistakes >= maxMistakes && gameState === 'playing') {
      setLives(prev => prev - 1);
      if (lives <= 1) {
        setGameState('finished');
        calculateReward();
      } else {
        // Reset mistakes for new life
        setMistakes(0);
      }
    }
  }, [mistakes, maxMistakes, lives, gameState]);

  const initializeGame = () => {
    const totalPairs = difficultySettings[difficulty].pairs;
    const selectedEmojis = cardEmojis.slice(0, totalPairs);
    const gameCards: Card[] = [];
    
    selectedEmojis.forEach((emoji, index) => {
      gameCards.push(
        { id: index * 2, emoji, isFlipped: false, isMatched: false },
        { id: index * 2 + 1, emoji, isFlipped: false, isMatched: false }
      );
    });

    // Shuffle cards
    for (let i = gameCards.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [gameCards[i], gameCards[j]] = [gameCards[j], gameCards[i]];
    }

    setCards(gameCards);
    setGameState('playing');
    setStartTime(Date.now());
    setMatchedPairs(0);
    setMoves(0);
    setScore(1000);
    setFlippedCards([]);
    setMistakes(0);
    setLives(3);
  };

  const flipCard = (cardId: number) => {
    if (flippedCards.length >= 2) return;
    
    const card = cards.find(c => c.id === cardId);
    if (!card || card.isFlipped || card.isMatched) return;

    setCards(prev => prev.map(c => 
      c.id === cardId ? { ...c, isFlipped: true } : c
    ));
    setFlippedCards(prev => [...prev, cardId]);
  };

  const calculateReward = () => {
    const baseReward = 1.0;
    const timeBonus = Math.max(0, difficultySettings[difficulty].timeBonus - Math.floor(gameTime / 1000));
    const scoreMultiplier = score / 1000;
    const timeMultiplier = gameTime >= 120000 ? 1 : 0.5; // Must play for at least 2 minutes
    const calculatedReward = baseReward * scoreMultiplier * timeMultiplier + (timeBonus * 0.01);
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
          gameId: 'memory-cards',
          gameType: 'puzzle',
          score: score,
          duration: gameTime,
          completed: matchedPairs === difficultySettings[difficulty].pairs
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

  const getGridCols = () => {
    const totalPairs = difficultySettings[difficulty].pairs;
    if (totalPairs <= 6) return 'grid-cols-3';
    if (totalPairs <= 8) return 'grid-cols-4';
    return 'grid-cols-4';
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
        
        <h1 className="text-2xl font-bold text-gray-800">🧠 Memory Cards</h1>
        
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
              <div className="text-6xl mb-4">🧠</div>
              <h2 className="text-2xl font-bold text-gray-800 mb-4">Memory Cards Game</h2>
              <p className="text-gray-600 mb-6">
                Flip cards to find matching pairs. Test your memory skills!
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
                      <div className="text-sm text-gray-600">{settings.pairs} pairs</div>
                    </button>
                  ))}
                </div>
              </div>

              <div className="bg-gradient-to-r from-blue-50 to-purple-50 rounded-lg p-4 mb-6">
                <h3 className="font-bold text-gray-800 mb-2">How to Play:</h3>
                <ul className="text-sm text-gray-600 text-left space-y-1">
                  <li>• Click cards to flip them</li>
                  <li>• Find matching pairs of emojis</li>
                  <li>• You have 3 lives</li>
                  <li>• 10 mistakes = lose a life</li>
                  <li>• Play for at least 2 minutes to earn rewards</li>
                </ul>
              </div>
              
              <button
                onClick={initializeGame}
                className="w-full bg-gradient-to-r from-green-500 to-emerald-500 text-white py-3 px-6 rounded-lg font-bold hover:from-green-600 hover:to-emerald-600 transition-all duration-200"
              >
                Start Game
              </button>
            </div>
          )}

          {gameState === 'playing' && (
            <div>
              {/* Game Stats */}
              <div className="flex justify-between items-center mb-6">
                <div className="text-center">
                  <div className="text-lg font-bold text-purple-600">{score}</div>
                  <div className="text-xs text-gray-600">Score</div>
                </div>
                <div className="text-center">
                  <div className="text-lg font-bold text-blue-600">{moves}</div>
                  <div className="text-xs text-gray-600">Moves</div>
                </div>
                <div className="text-center">
                  <div className="text-lg font-bold text-green-600">{matchedPairs}/{difficultySettings[difficulty].pairs}</div>
                  <div className="text-xs text-gray-600">Pairs</div>
                </div>
                <div className="text-center">
                  <div className="text-lg font-bold text-red-600">{mistakes}/{maxMistakes}</div>
                  <div className="text-xs text-gray-600">Mistakes</div>
                </div>
              </div>

              {/* Cards Grid */}
              <div className={`grid ${getGridCols()} gap-3`}>
                {cards.map((card) => (
                  <div
                    key={card.id}
                    onClick={() => flipCard(card.id)}
                    className={`aspect-square rounded-lg border-2 flex items-center justify-center text-2xl cursor-pointer transition-all duration-300 ${
                      card.isFlipped || card.isMatched
                        ? 'bg-white border-blue-500 transform scale-105'
                        : 'bg-gradient-to-br from-blue-400 to-purple-500 border-blue-400 hover:scale-105'
                    }`}
                  >
                    {card.isFlipped || card.isMatched ? card.emoji : '❓'}
                  </div>
                ))}
              </div>
            </div>
          )}

          {gameState === 'finished' && (
            <div className="text-center">
              <div className="text-6xl mb-4">
                {matchedPairs === difficultySettings[difficulty].pairs ? '🏆' : '💔'}
              </div>
              <h2 className="text-2xl font-bold text-gray-800 mb-4">
                {matchedPairs === difficultySettings[difficulty].pairs ? 'Congratulations!' : 'Game Over!'}
              </h2>
              
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
                    <div className="text-lg font-bold text-green-600">{matchedPairs}/{difficultySettings[difficulty].pairs}</div>
                    <div className="text-xs text-gray-600">Pairs Found</div>
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
                  onClick={initializeGame}
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
