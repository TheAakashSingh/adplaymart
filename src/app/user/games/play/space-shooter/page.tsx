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

interface Player {
  x: number;
  y: number;
}

interface Bullet {
  x: number;
  y: number;
  id: number;
}

interface Enemy {
  x: number;
  y: number;
  id: number;
  type: 'asteroid' | 'ship';
  health: number;
}

interface PowerUp {
  x: number;
  y: number;
  id: number;
  type: 'health' | 'rapidfire' | 'shield';
}

export default function SpaceShooterGame() {
  const router = useRouter();
  const [gameState, setGameState] = useState<'waiting' | 'playing' | 'finished'>('waiting');
  const [player, setPlayer] = useState<Player>({ x: 200, y: 450 });
  const [bullets, setBullets] = useState<Bullet[]>([]);
  const [enemies, setEnemies] = useState<Enemy[]>([]);
  const [powerUps, setPowerUps] = useState<PowerUp[]>([]);
  const [score, setScore] = useState<number>(0);
  const [lives, setLives] = useState<number>(3);
  const [level, setLevel] = useState<number>(1);
  const [startTime, setStartTime] = useState<number>(0);
  const [gameTime, setGameTime] = useState<number>(0);
  const [reward, setReward] = useState<number>(0);
  const [submitting, setSubmitting] = useState<boolean>(false);
  const [keys, setKeys] = useState<{ [key: string]: boolean }>({});
  const [rapidFire, setRapidFire] = useState<boolean>(false);
  const [shield, setShield] = useState<boolean>(false);

  const GAME_WIDTH = 400;
  const GAME_HEIGHT = 500;
  const PLAYER_SIZE = 30;
  const BULLET_SIZE = 4;
  const ENEMY_SIZE = 25;

  // Game loop
  useEffect(() => {
    let gameLoop: NodeJS.Timeout;
    if (gameState === 'playing') {
      gameLoop = setInterval(() => {
        updateGame();
      }, 50); // 20 FPS
    }
    return () => clearInterval(gameLoop);
  }, [gameState]);

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

  // Auto-shoot
  useEffect(() => {
    let shootInterval: NodeJS.Timeout;
    if (gameState === 'playing' && (keys[' '] || rapidFire)) {
      const interval = rapidFire ? 100 : 200;
      shootInterval = setInterval(() => {
        shoot();
      }, interval);
    }
    return () => clearInterval(shootInterval);
  }, [gameState, keys, rapidFire]);

  const updateGame = useCallback(() => {
    // Move player
    setPlayer(prev => {
      let newX = prev.x;
      let newY = prev.y;
      
      if (keys['ArrowLeft'] || keys['a'] || keys['A']) {
        newX = Math.max(0, prev.x - 8);
      }
      if (keys['ArrowRight'] || keys['d'] || keys['D']) {
        newX = Math.min(GAME_WIDTH - PLAYER_SIZE, prev.x + 8);
      }
      if (keys['ArrowUp'] || keys['w'] || keys['W']) {
        newY = Math.max(0, prev.y - 8);
      }
      if (keys['ArrowDown'] || keys['s'] || keys['S']) {
        newY = Math.min(GAME_HEIGHT - PLAYER_SIZE, prev.y + 8);
      }
      
      return { x: newX, y: newY };
    });

    // Move bullets
    setBullets(prev => prev.map(bullet => ({
      ...bullet,
      y: bullet.y - 10
    })).filter(bullet => bullet.y > -10));

    // Move enemies
    setEnemies(prev => {
      const newEnemies = prev.map(enemy => ({
        ...enemy,
        y: enemy.y + (enemy.type === 'ship' ? 3 : 2)
      })).filter(enemy => enemy.y < GAME_HEIGHT + 50);

      // Add new enemies
      if (Math.random() < 0.03 + level * 0.01) {
        const enemyType = Math.random() < 0.7 ? 'asteroid' : 'ship';
        newEnemies.push({
          x: Math.random() * (GAME_WIDTH - ENEMY_SIZE),
          y: -ENEMY_SIZE,
          id: Date.now() + Math.random(),
          type: enemyType,
          health: enemyType === 'ship' ? 2 : 1
        });
      }

      return newEnemies;
    });

    // Move power-ups
    setPowerUps(prev => {
      const newPowerUps = prev.map(powerUp => ({
        ...powerUp,
        y: powerUp.y + 2
      })).filter(powerUp => powerUp.y < GAME_HEIGHT + 20);

      // Add new power-ups occasionally
      if (Math.random() < 0.005) {
        const types: PowerUp['type'][] = ['health', 'rapidfire', 'shield'];
        newPowerUps.push({
          x: Math.random() * (GAME_WIDTH - 20),
          y: -20,
          id: Date.now() + Math.random(),
          type: types[Math.floor(Math.random() * types.length)]
        });
      }

      return newPowerUps;
    });

    // Check bullet-enemy collisions
    setBullets(prevBullets => {
      const remainingBullets = [...prevBullets];
      
      setEnemies(prevEnemies => {
        const remainingEnemies = [...prevEnemies];
        
        prevBullets.forEach(bullet => {
          prevEnemies.forEach(enemy => {
            if (
              bullet.x < enemy.x + ENEMY_SIZE &&
              bullet.x + BULLET_SIZE > enemy.x &&
              bullet.y < enemy.y + ENEMY_SIZE &&
              bullet.y + BULLET_SIZE > enemy.y
            ) {
              // Hit!
              const bulletIndex = remainingBullets.findIndex(b => b.id === bullet.id);
              if (bulletIndex > -1) {
                remainingBullets.splice(bulletIndex, 1);
              }
              
              const enemyIndex = remainingEnemies.findIndex(e => e.id === enemy.id);
              if (enemyIndex > -1) {
                remainingEnemies[enemyIndex].health -= 1;
                if (remainingEnemies[enemyIndex].health <= 0) {
                  setScore(prev => prev + (enemy.type === 'ship' ? 20 : 10));
                  remainingEnemies.splice(enemyIndex, 1);
                }
              }
            }
          });
        });
        
        return remainingEnemies;
      });
      
      return remainingBullets;
    });

    // Check player-enemy collisions
    if (!shield) {
      enemies.forEach(enemy => {
        if (
          player.x < enemy.x + ENEMY_SIZE &&
          player.x + PLAYER_SIZE > enemy.x &&
          player.y < enemy.y + ENEMY_SIZE &&
          player.y + PLAYER_SIZE > enemy.y
        ) {
          // Player hit!
          setLives(prev => {
            const newLives = prev - 1;
            if (newLives <= 0) {
              setGameState('finished');
              calculateReward();
            }
            return newLives;
          });
          
          // Remove the enemy
          setEnemies(prev => prev.filter(e => e.id !== enemy.id));
        }
      });
    }

    // Check player-powerup collisions
    powerUps.forEach(powerUp => {
      if (
        player.x < powerUp.x + 20 &&
        player.x + PLAYER_SIZE > powerUp.x &&
        player.y < powerUp.y + 20 &&
        player.y + PLAYER_SIZE > powerUp.y
      ) {
        // Power-up collected!
        setPowerUps(prev => prev.filter(p => p.id !== powerUp.id));
        
        switch (powerUp.type) {
          case 'health':
            setLives(prev => Math.min(5, prev + 1));
            break;
          case 'rapidfire':
            setRapidFire(true);
            setTimeout(() => setRapidFire(false), 5000);
            break;
          case 'shield':
            setShield(true);
            setTimeout(() => setShield(false), 3000);
            break;
        }
      }
    });

    // Level progression
    if (score > level * 200) {
      setLevel(prev => prev + 1);
    }
  }, [keys, player, enemies, powerUps, level, score, shield]);

  const shoot = () => {
    setBullets(prev => [...prev, {
      x: player.x + PLAYER_SIZE / 2 - BULLET_SIZE / 2,
      y: player.y,
      id: Date.now() + Math.random()
    }]);
  };

  const startGame = () => {
    setPlayer({ x: 200, y: 450 });
    setBullets([]);
    setEnemies([]);
    setPowerUps([]);
    setScore(0);
    setLives(3);
    setLevel(1);
    setRapidFire(false);
    setShield(false);
    setGameState('playing');
    setStartTime(Date.now());
  };

  const calculateReward = () => {
    const baseReward = 2.0;
    const scoreMultiplier = score / 500;
    const levelBonus = level * 0.3;
    const timeMultiplier = gameTime >= 240000 ? 1 : 0.5; // Must play for at least 4 minutes
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
          gameId: 'space-shooter',
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

  const handleMobileControl = (action: 'left' | 'right' | 'up' | 'down' | 'shoot') => {
    if (action === 'shoot') {
      shoot();
    } else {
      setPlayer(prev => {
        let newX = prev.x;
        let newY = prev.y;
        
        switch (action) {
          case 'left':
            newX = Math.max(0, prev.x - 20);
            break;
          case 'right':
            newX = Math.min(GAME_WIDTH - PLAYER_SIZE, prev.x + 20);
            break;
          case 'up':
            newY = Math.max(0, prev.y - 20);
            break;
          case 'down':
            newY = Math.min(GAME_HEIGHT - PLAYER_SIZE, prev.y + 20);
            break;
        }
        
        return { x: newX, y: newY };
      });
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
        
        <h1 className="text-2xl font-bold text-gray-800">🚀 Space Shooter</h1>
        
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
              <div className="text-6xl mb-4">🚀</div>
              <h2 className="text-2xl font-bold text-gray-800 mb-4">Space Shooter</h2>
              <p className="text-gray-600 mb-6">
                Defend Earth from asteroids and enemy ships!
              </p>
              
              <div className="bg-gradient-to-r from-blue-50 to-purple-50 rounded-lg p-4 mb-6">
                <h3 className="font-bold text-gray-800 mb-2">Controls:</h3>
                <div className="text-sm text-gray-600 space-y-1">
                  <p>• Arrow Keys or WASD to move</p>
                  <p>• Spacebar to shoot</p>
                  <p>• Destroy asteroids (10 pts) and ships (20 pts)</p>
                  <p>• Collect power-ups for bonuses</p>
                  <p>• You have 3 lives</p>
                  <p>• Play for at least 4 minutes to earn rewards</p>
                </div>
              </div>
              
              <button
                onClick={startGame}
                className="w-full bg-gradient-to-r from-green-500 to-emerald-500 text-white py-3 px-6 rounded-lg font-bold hover:from-green-600 hover:to-emerald-600 transition-all duration-200"
              >
                Launch Mission
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
                  <div className="text-lg font-bold text-purple-600">{level}</div>
                  <div className="text-xs text-gray-600">Level</div>
                </div>
                <div className="text-center">
                  <div className="text-lg font-bold text-red-600">{lives}</div>
                  <div className="text-xs text-gray-600">Lives</div>
                </div>
                <div className="text-center">
                  <div className="text-lg font-bold text-blue-600">{enemies.length}</div>
                  <div className="text-xs text-gray-600">Enemies</div>
                </div>
              </div>

              {/* Power-up indicators */}
              <div className="flex justify-center space-x-2 mb-4">
                {rapidFire && (
                  <div className="bg-orange-500 text-white px-2 py-1 rounded text-xs font-bold">
                    🔥 RAPID FIRE
                  </div>
                )}
                {shield && (
                  <div className="bg-blue-500 text-white px-2 py-1 rounded text-xs font-bold">
                    🛡️ SHIELD
                  </div>
                )}
              </div>

              {/* Game Area */}
              <div 
                className="relative bg-black rounded-lg mx-auto border-2 border-gray-400 overflow-hidden"
                style={{ width: GAME_WIDTH, height: GAME_HEIGHT }}
              >
                {/* Stars background */}
                <div className="absolute inset-0">
                  {[...Array(50)].map((_, i) => (
                    <div
                      key={i}
                      className="absolute w-1 h-1 bg-white rounded-full"
                      style={{
                        left: `${Math.random() * 100}%`,
                        top: `${Math.random() * 100}%`,
                        opacity: Math.random()
                      }}
                    />
                  ))}
                </div>

                {/* Player */}
                <div
                  className={`absolute transition-all duration-100 ${shield ? 'ring-2 ring-blue-400' : ''}`}
                  style={{
                    left: player.x,
                    top: player.y,
                    width: PLAYER_SIZE,
                    height: PLAYER_SIZE
                  }}
                >
                  <div className="w-full h-full flex items-center justify-center text-2xl">
                    🚀
                  </div>
                </div>

                {/* Bullets */}
                {bullets.map(bullet => (
                  <div
                    key={bullet.id}
                    className="absolute bg-yellow-400 rounded-full"
                    style={{
                      left: bullet.x,
                      top: bullet.y,
                      width: BULLET_SIZE,
                      height: BULLET_SIZE * 2
                    }}
                  />
                ))}

                {/* Enemies */}
                {enemies.map(enemy => (
                  <div
                    key={enemy.id}
                    className="absolute"
                    style={{
                      left: enemy.x,
                      top: enemy.y,
                      width: ENEMY_SIZE,
                      height: ENEMY_SIZE
                    }}
                  >
                    <div className="w-full h-full flex items-center justify-center text-xl">
                      {enemy.type === 'asteroid' ? '☄️' : '🛸'}
                    </div>
                  </div>
                ))}

                {/* Power-ups */}
                {powerUps.map(powerUp => (
                  <div
                    key={powerUp.id}
                    className="absolute"
                    style={{
                      left: powerUp.x,
                      top: powerUp.y,
                      width: 20,
                      height: 20
                    }}
                  >
                    <div className="w-full h-full flex items-center justify-center text-sm">
                      {powerUp.type === 'health' ? '❤️' : 
                       powerUp.type === 'rapidfire' ? '🔥' : '🛡️'}
                    </div>
                  </div>
                ))}
              </div>

              {/* Mobile Controls */}
              <div className="grid grid-cols-3 gap-2 mt-4">
                <button
                  onTouchStart={() => handleMobileControl('left')}
                  onClick={() => handleMobileControl('left')}
                  className="bg-blue-500 text-white py-2 rounded font-bold hover:bg-blue-600 transition-colors"
                >
                  ←
                </button>
                <button
                  onTouchStart={() => handleMobileControl('up')}
                  onClick={() => handleMobileControl('up')}
                  className="bg-blue-500 text-white py-2 rounded font-bold hover:bg-blue-600 transition-colors"
                >
                  ↑
                </button>
                <button
                  onTouchStart={() => handleMobileControl('right')}
                  onClick={() => handleMobileControl('right')}
                  className="bg-blue-500 text-white py-2 rounded font-bold hover:bg-blue-600 transition-colors"
                >
                  →
                </button>
                <button
                  onTouchStart={() => handleMobileControl('shoot')}
                  onClick={() => handleMobileControl('shoot')}
                  className="bg-red-500 text-white py-2 rounded font-bold hover:bg-red-600 transition-colors"
                >
                  🔫
                </button>
                <button
                  onTouchStart={() => handleMobileControl('down')}
                  onClick={() => handleMobileControl('down')}
                  className="bg-blue-500 text-white py-2 rounded font-bold hover:bg-blue-600 transition-colors"
                >
                  ↓
                </button>
                <div></div>
              </div>

              <div className="text-center mt-4">
                <p className="text-sm text-gray-600">Use controls or keyboard to play!</p>
              </div>
            </div>
          )}

          {gameState === 'finished' && (
            <div className="text-center">
              <div className="text-6xl mb-4">
                {score > 500 ? '🏆' : score > 200 ? '🥈' : '💥'}
              </div>
              <h2 className="text-2xl font-bold text-gray-800 mb-4">Mission Complete!</h2>
              
              <div className="bg-gradient-to-r from-green-50 to-emerald-50 rounded-lg p-4 mb-6">
                <div className="grid grid-cols-2 gap-4 text-center">
                  <div>
                    <div className="text-lg font-bold text-green-600">{score}</div>
                    <div className="text-xs text-gray-600">Final Score</div>
                  </div>
                  <div>
                    <div className="text-lg font-bold text-purple-600">{level}</div>
                    <div className="text-xs text-gray-600">Level Reached</div>
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
                  Launch Again
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
