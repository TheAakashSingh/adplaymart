'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import {
  ArrowLeftIcon,
  TrophyIcon,
  CurrencyRupeeIcon,
  ClockIcon,
  HeartIcon
} from '@heroicons/react/24/outline';

interface Bubble {
  id: number;
  x: number;
  y: number;
  color: string;
  row: number;
  col: number;
}

const colors = ['#EF4444', '#3B82F6', '#10B981', '#F59E0B', '#8B5CF6', '#EC4899'];

export default function BubbleShooterGame() {
  const router = useRouter();
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [gameState, setGameState] = useState<'waiting' | 'playing' | 'finished'>('waiting');
  const [bubbles, setBubbles] = useState<Bubble[]>([]);
  const [currentBubble, setCurrentBubble] = useState<string>('');
  const [nextBubble, setNextBubble] = useState<string>('');
  const [score, setScore] = useState<number>(0);
  const [level, setLevel] = useState<number>(1);
  const [shots, setShots] = useState<number>(0);
  const [startTime, setStartTime] = useState<number>(0);
  const [gameTime, setGameTime] = useState<number>(0);
  const [reward, setReward] = useState<number>(0);
  const [submitting, setSubmitting] = useState<boolean>(false);
  const [aimAngle, setAimAngle] = useState<number>(0);

  const CANVAS_WIDTH = 400;
  const CANVAS_HEIGHT = 600;
  const BUBBLE_RADIUS = 20;
  const ROWS = 8;
  const COLS = 10;

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
    if (gameState === 'playing') {
      drawGame();
    }
  }, [bubbles, currentBubble, aimAngle, gameState]);

  const initializeGame = () => {
    const initialBubbles: Bubble[] = [];
    let id = 0;

    // Create initial bubble grid
    for (let row = 0; row < 5; row++) {
      const colsInRow = row % 2 === 0 ? COLS : COLS - 1;
      for (let col = 0; col < colsInRow; col++) {
        const x = col * (BUBBLE_RADIUS * 2) + (row % 2 === 0 ? BUBBLE_RADIUS : BUBBLE_RADIUS * 2);
        const y = row * (BUBBLE_RADIUS * 1.7) + BUBBLE_RADIUS;
        
        initialBubbles.push({
          id: id++,
          x,
          y,
          color: colors[Math.floor(Math.random() * colors.length)],
          row,
          col
        });
      }
    }

    setBubbles(initialBubbles);
    setCurrentBubble(colors[Math.floor(Math.random() * colors.length)]);
    setNextBubble(colors[Math.floor(Math.random() * colors.length)]);
    setScore(0);
    setLevel(1);
    setShots(0);
    setGameState('playing');
    setStartTime(Date.now());
  };

  const drawGame = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Clear canvas
    ctx.clearRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);

    // Draw background
    ctx.fillStyle = '#1F2937';
    ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);

    // Draw bubbles
    bubbles.forEach(bubble => {
      ctx.beginPath();
      ctx.arc(bubble.x, bubble.y, BUBBLE_RADIUS, 0, Math.PI * 2);
      ctx.fillStyle = bubble.color;
      ctx.fill();
      ctx.strokeStyle = '#FFFFFF';
      ctx.lineWidth = 2;
      ctx.stroke();
    });

    // Draw shooter
    const shooterX = CANVAS_WIDTH / 2;
    const shooterY = CANVAS_HEIGHT - 50;
    
    ctx.beginPath();
    ctx.arc(shooterX, shooterY, BUBBLE_RADIUS, 0, Math.PI * 2);
    ctx.fillStyle = currentBubble;
    ctx.fill();
    ctx.strokeStyle = '#FFFFFF';
    ctx.lineWidth = 2;
    ctx.stroke();

    // Draw aim line
    const aimLength = 100;
    const aimX = shooterX + Math.cos(aimAngle) * aimLength;
    const aimY = shooterY + Math.sin(aimAngle) * aimLength;
    
    ctx.beginPath();
    ctx.moveTo(shooterX, shooterY);
    ctx.lineTo(aimX, aimY);
    ctx.strokeStyle = '#FFFFFF';
    ctx.lineWidth = 2;
    ctx.stroke();

    // Draw next bubble
    ctx.beginPath();
    ctx.arc(CANVAS_WIDTH - 40, CANVAS_HEIGHT - 50, 15, 0, Math.PI * 2);
    ctx.fillStyle = nextBubble;
    ctx.fill();
    ctx.strokeStyle = '#FFFFFF';
    ctx.lineWidth = 1;
    ctx.stroke();
  };

  const handleCanvasClick = (event: React.MouseEvent<HTMLCanvasElement>) => {
    if (gameState !== 'playing') return;

    const canvas = canvasRef.current;
    if (!canvas) return;

    const rect = canvas.getBoundingClientRect();
    const clickX = event.clientX - rect.left;
    const clickY = event.clientY - rect.top;

    const shooterX = CANVAS_WIDTH / 2;
    const shooterY = CANVAS_HEIGHT - 50;

    const angle = Math.atan2(clickY - shooterY, clickX - shooterX);
    setAimAngle(angle);

    // Shoot bubble
    shootBubble(angle);
  };

  const shootBubble = (angle: number) => {
    setShots(prev => prev + 1);
    
    // Simulate bubble trajectory and collision
    setTimeout(() => {
      // Find collision point (simplified)
      const hitBubble = bubbles[Math.floor(Math.random() * Math.min(bubbles.length, 10))];
      
      if (hitBubble) {
        // Check for matches
        const matchingBubbles = findMatchingBubbles(hitBubble, currentBubble);
        
        if (matchingBubbles.length >= 3) {
          // Remove matching bubbles
          setBubbles(prev => prev.filter(b => !matchingBubbles.includes(b.id)));
          setScore(prev => prev + matchingBubbles.length * 10);
          
          // Check for floating bubbles
          removeFloatingBubbles();
        } else {
          // Add new bubble to grid
          const newBubble: Bubble = {
            id: Date.now(),
            x: hitBubble.x + (Math.random() - 0.5) * 80,
            y: hitBubble.y + 40,
            color: currentBubble,
            row: hitBubble.row + 1,
            col: hitBubble.col
          };
          setBubbles(prev => [...prev, newBubble]);
        }
      }

      // Update bubbles
      setCurrentBubble(nextBubble);
      setNextBubble(colors[Math.floor(Math.random() * colors.length)]);

      // Check win condition
      if (bubbles.length <= 10) {
        setLevel(prev => prev + 1);
        if (level >= 3) {
          setGameState('finished');
          calculateReward();
        } else {
          // Generate new level
          setTimeout(() => initializeGame(), 1000);
        }
      }

      // Check lose condition
      if (bubbles.some(b => b.y > CANVAS_HEIGHT - 150)) {
        setGameState('finished');
        calculateReward();
      }
    }, 500);
  };

  const findMatchingBubbles = (targetBubble: Bubble, color: string): number[] => {
    if (targetBubble.color !== color) return [];
    
    const matches = [targetBubble.id];
    const visited = new Set([targetBubble.id]);
    const queue = [targetBubble];

    while (queue.length > 0) {
      const current = queue.shift()!;
      
      // Find adjacent bubbles of same color
      bubbles.forEach(bubble => {
        if (visited.has(bubble.id)) return;
        
        const distance = Math.sqrt(
          Math.pow(bubble.x - current.x, 2) + Math.pow(bubble.y - current.y, 2)
        );
        
        if (distance < BUBBLE_RADIUS * 2.5 && bubble.color === color) {
          matches.push(bubble.id);
          visited.add(bubble.id);
          queue.push(bubble);
        }
      });
    }

    return matches;
  };

  const removeFloatingBubbles = () => {
    // Remove bubbles not connected to top
    const connectedBubbles = new Set<number>();
    const queue: Bubble[] = [];

    // Start with top row bubbles
    bubbles.forEach(bubble => {
      if (bubble.row === 0) {
        connectedBubbles.add(bubble.id);
        queue.push(bubble);
      }
    });

    // Find all connected bubbles
    while (queue.length > 0) {
      const current = queue.shift()!;
      
      bubbles.forEach(bubble => {
        if (connectedBubbles.has(bubble.id)) return;
        
        const distance = Math.sqrt(
          Math.pow(bubble.x - current.x, 2) + Math.pow(bubble.y - current.y, 2)
        );
        
        if (distance < BUBBLE_RADIUS * 2.5) {
          connectedBubbles.add(bubble.id);
          queue.push(bubble);
        }
      });
    }

    // Remove floating bubbles
    setBubbles(prev => prev.filter(b => connectedBubbles.has(b.id)));
  };

  const calculateReward = () => {
    const baseReward = 1.1;
    const scoreMultiplier = score / 500;
    const levelBonus = level * 0.2;
    const timeMultiplier = gameTime >= 180000 ? 1 : 0.5; // Must play for at least 3 minutes
    const calculatedReward = baseReward * scoreMultiplier + levelBonus * timeMultiplier;
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
          gameId: 'bubble-shooter',
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
        
        <h1 className="text-2xl font-bold text-gray-800">🫧 Bubble Shooter</h1>
        
        <div className="flex items-center space-x-4">
          {gameState === 'playing' && (
            <div className="flex items-center space-x-1 text-blue-600">
              <ClockIcon className="w-5 h-5" />
              <span className="font-bold">{formatTime(gameTime)}</span>
            </div>
          )}
        </div>
      </div>

      {/* Game Container */}
      <div className="max-w-md mx-auto">
        <div className="bg-white/90 backdrop-blur-md rounded-2xl shadow-xl border border-white/20 p-6">
          
          {gameState === 'waiting' && (
            <div className="text-center">
              <div className="text-6xl mb-4">🫧</div>
              <h2 className="text-2xl font-bold text-gray-800 mb-4">Bubble Shooter</h2>
              <p className="text-gray-600 mb-6">
                Match 3 or more bubbles of the same color to pop them!
              </p>
              
              <div className="bg-gradient-to-r from-blue-50 to-purple-50 rounded-lg p-4 mb-6">
                <h3 className="font-bold text-gray-800 mb-2">How to Play:</h3>
                <ul className="text-sm text-gray-600 text-left space-y-1">
                  <li>• Click to aim and shoot bubbles</li>
                  <li>• Match 3+ bubbles to pop them</li>
                  <li>• Clear floating bubbles for bonus points</li>
                  <li>• Complete levels to progress</li>
                  <li>• Play for at least 3 minutes to earn rewards</li>
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
              <div className="grid grid-cols-3 gap-4 mb-4">
                <div className="text-center">
                  <div className="text-lg font-bold text-green-600">{score}</div>
                  <div className="text-xs text-gray-600">Score</div>
                </div>
                <div className="text-center">
                  <div className="text-lg font-bold text-purple-600">{level}</div>
                  <div className="text-xs text-gray-600">Level</div>
                </div>
                <div className="text-center">
                  <div className="text-lg font-bold text-blue-600">{shots}</div>
                  <div className="text-xs text-gray-600">Shots</div>
                </div>
              </div>

              {/* Game Canvas */}
              <canvas
                ref={canvasRef}
                width={CANVAS_WIDTH}
                height={CANVAS_HEIGHT}
                onClick={handleCanvasClick}
                className="border-2 border-gray-300 rounded-lg cursor-crosshair w-full max-w-sm mx-auto"
                style={{ aspectRatio: `${CANVAS_WIDTH}/${CANVAS_HEIGHT}` }}
              />

              <div className="text-center mt-4">
                <p className="text-sm text-gray-600">Click to aim and shoot!</p>
              </div>
            </div>
          )}

          {gameState === 'finished' && (
            <div className="text-center">
              <div className="text-6xl mb-4">
                {level >= 3 ? '🏆' : score > 200 ? '🥈' : '🥉'}
              </div>
              <h2 className="text-2xl font-bold text-gray-800 mb-4">Game Complete!</h2>
              
              <div className="bg-gradient-to-r from-green-50 to-emerald-50 rounded-lg p-4 mb-6">
                <div className="grid grid-cols-2 gap-4 text-center">
                  <div>
                    <div className="text-lg font-bold text-green-600">{score}</div>
                    <div className="text-xs text-gray-600">Final Score</div>
                  </div>
                  <div>
                    <div className="text-lg font-bold text-purple-600">{level}</div>
                    <div className="text-xs text-gray-600">Levels Completed</div>
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
