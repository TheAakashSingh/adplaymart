import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import { User, Transaction, AdminSettings } from '@/models';
import { authenticate } from '@/middleware/auth';
import { ApiResponse } from '@/types';

export async function POST(request: NextRequest) {
  try {
    // Authenticate user
    const { user, error } = await authenticate(request);
    if (error) {
      return NextResponse.json<ApiResponse>({
        success: false,
        message: error
      }, { status: 401 });
    }

    await connectDB();
    
    const body = await request.json();
    const { gameId, score, duration, gameType = 'casual' } = body;
    
    // Validation
    if (!gameId || score === undefined || !duration) {
      return NextResponse.json<ApiResponse>({
        success: false,
        message: 'Game ID, score, and duration are required'
      }, { status: 400 });
    }
    
    // Convert string to ObjectId if needed
    const mongoose = require('mongoose');
    let userObjectId;
    try {
      userObjectId = new mongoose.Types.ObjectId(user.userId);
    } catch (error) {
      return NextResponse.json<ApiResponse>({
        success: false,
        message: 'Invalid user ID format'
      }, { status: 400 });
    }

    // Get user details
    const currentUser = await User.findById(userObjectId).populate('currentPackage');
    if (!currentUser) {
      return NextResponse.json<ApiResponse>({
        success: false,
        message: 'User not found'
      }, { status: 404 });
    }

    // Check if user has watched welcome video (requirement for gaming)
    if (!currentUser.videoWatchRewardClaimed) {
      return NextResponse.json<ApiResponse>({
        success: false,
        message: 'Please watch the welcome video first to unlock gaming features'
      }, { status: 400 });
    }

    // Initialize wallets if not exists
    if (!currentUser.wallets) {
      currentUser.wallets = { upgrade: 0, withdrawal: 0 };
    }

    // Initialize gaming if not exists
    if (!currentUser.gaming) {
      currentUser.gaming = {
        totalEarnings: 0,
        gamesPlayed: 0,
        highScore: 0
      };
    }

    // Check if user has active package
    if (!currentUser.currentPackage) {
      return NextResponse.json<ApiResponse>({
        success: false,
        message: 'Active package required to earn from gaming'
      }, { status: 400 });
    }
    
    // Get admin settings for gaming rewards
    const settings = await AdminSettings.findOne({ key: 'gaming_rewards' });
    const gamingRewards = settings?.value || {
      casual: { baseReward: 0.5, maxGamesPerDay: 15, minDuration: 60, scoreMultiplier: 0.001 },
      puzzle: { baseReward: 1, maxGamesPerDay: 10, minDuration: 120, scoreMultiplier: 0.002 },
      action: { baseReward: 1.5, maxGamesPerDay: 8, minDuration: 180, scoreMultiplier: 0.003 }
    };
    
    const gameConfig = gamingRewards[gameType] || gamingRewards.casual;
    
    // Check minimum duration
    if (duration < gameConfig.minDuration) {
      return NextResponse.json<ApiResponse>({
        success: false,
        message: `Game must be played for at least ${gameConfig.minDuration} seconds`
      }, { status: 400 });
    }
    
    // Check daily limit
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);
    
    const todayGameCount = await Transaction.countDocuments({
      userId: userObjectId,
      type: 'game_reward',
      description: { $regex: gameType },
      createdAt: { $gte: today, $lt: tomorrow }
    });
    
    if (todayGameCount >= gameConfig.maxGamesPerDay) {
      return NextResponse.json<ApiResponse>({
        success: false,
        message: `Daily ${gameType} game limit reached. You can play ${gameConfig.maxGamesPerDay} ${gameType} games per day`
      }, { status: 400 });
    }
    
    // Calculate reward based on score and package
    const packageData = currentUser.currentPackage as any;
    let baseReward = gameConfig.baseReward;
    let scoreBonus = Math.min(score * gameConfig.scoreMultiplier, baseReward); // Cap score bonus
    let totalReward = baseReward + scoreBonus;
    
    // Package multiplier
    if (packageData.price >= 5000) {
      totalReward *= 2; // Premium packages get 2x rewards
    } else if (packageData.price >= 2000) {
      totalReward *= 1.5; // Professional packages get 1.5x rewards
    }
    
    // Performance bonus for high scores
    if (score >= 1000) {
      totalReward *= 1.2; // 20% bonus for high scores
    }
    
    // Round to 2 decimal places
    totalReward = Math.round(totalReward * 100) / 100;
    
    // Add reward to user's wallet
    currentUser.wallets.upgrade += totalReward;
    currentUser.gaming.gamesPlayed += 1;
    currentUser.gaming.totalEarnings += totalReward;
    
    // Update high score if applicable
    if (score > currentUser.gaming.highScore) {
      currentUser.gaming.highScore = score;
    }
    
    await currentUser.save();
    
    // Create transaction record
    const transaction = new Transaction({
      userId: userObjectId,
      type: 'game_reward',
      amount: totalReward,
      netAmount: totalReward, // No TDS for gaming rewards
      description: `${gameType} game reward - ${gameId} (Score: ${score})`,
      status: 'completed'
    });
    await transaction.save();
    
    return NextResponse.json<ApiResponse>({
      success: true,
      message: 'Gaming reward earned successfully',
      data: {
        reward: totalReward,
        breakdown: {
          baseReward,
          scoreBonus,
          packageMultiplier: packageData.price >= 5000 ? 2 : packageData.price >= 2000 ? 1.5 : 1,
          performanceBonus: score >= 1000 ? 1.2 : 1
        },
        totalEarnings: currentUser.gaming.totalEarnings,
        gamesPlayedToday: todayGameCount + 1,
        remainingGames: gameConfig.maxGamesPerDay - (todayGameCount + 1),
        highScore: currentUser.gaming.highScore,
        walletBalance: currentUser.wallets.upgrade
      }
    }, { status: 200 });
    
  } catch (error: any) {
    console.error('Gaming reward error:', error);
    return NextResponse.json<ApiResponse>({
      success: false,
      message: 'Internal server error',
      error: error.message
    }, { status: 500 });
  }
}

// GET method to fetch gaming stats
export async function GET(request: NextRequest) {
  try {
    // Authenticate user
    const { user, error } = await authenticate(request);
    if (error) {
      return NextResponse.json<ApiResponse>({
        success: false,
        message: error
      }, { status: 401 });
    }

    await connectDB();

    // Convert string to ObjectId if needed
    const mongoose = require('mongoose');
    let userObjectId;
    try {
      userObjectId = new mongoose.Types.ObjectId(user.userId);
    } catch (error) {
      return NextResponse.json<ApiResponse>({
        success: false,
        message: 'Invalid user ID format'
      }, { status: 400 });
    }

    // Get user details
    const currentUser = await User.findById(userObjectId);
    if (!currentUser) {
      return NextResponse.json<ApiResponse>({
        success: false,
        message: 'User not found'
      }, { status: 404 });
    }
    
    // Get admin settings
    const settings = await AdminSettings.findOne({ key: 'gaming_rewards' });
    const gamingRewards = settings?.value || {
      casual: { baseReward: 0.5, maxGamesPerDay: 15, minDuration: 60, scoreMultiplier: 0.001 },
      puzzle: { baseReward: 1, maxGamesPerDay: 10, minDuration: 120, scoreMultiplier: 0.002 },
      action: { baseReward: 1.5, maxGamesPerDay: 8, minDuration: 180, scoreMultiplier: 0.003 }
    };
    
    // Get today's game counts by type
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);
    
    const todayGameStats = await Transaction.aggregate([
      {
        $match: {
          userId: userObjectId,
          type: 'game_reward',
          createdAt: { $gte: today, $lt: tomorrow }
        }
      },
      {
        $group: {
          _id: {
            $cond: [
              { $regexMatch: { input: '$description', regex: /casual/ } },
              'casual',
              {
                $cond: [
                  { $regexMatch: { input: '$description', regex: /puzzle/ } },
                  'puzzle',
                  'action'
                ]
              }
            ]
          },
          count: { $sum: 1 },
          totalEarnings: { $sum: '$amount' }
        }
      }
    ]);
    
    const gameStatsByType = {
      casual: { played: 0, earnings: 0 },
      puzzle: { played: 0, earnings: 0 },
      action: { played: 0, earnings: 0 }
    };
    
    todayGameStats.forEach(stat => {
      gameStatsByType[stat._id] = {
        played: stat.count,
        earnings: stat.totalEarnings
      };
    });
    
    return NextResponse.json<ApiResponse>({
      success: true,
      message: 'Gaming stats fetched successfully',
      data: {
        gaming: currentUser.gaming,
        todayStats: {
          casual: {
            ...gameStatsByType.casual,
            remaining: Math.max(0, gamingRewards.casual.maxGamesPerDay - gameStatsByType.casual.played),
            maxPerDay: gamingRewards.casual.maxGamesPerDay
          },
          puzzle: {
            ...gameStatsByType.puzzle,
            remaining: Math.max(0, gamingRewards.puzzle.maxGamesPerDay - gameStatsByType.puzzle.played),
            maxPerDay: gamingRewards.puzzle.maxGamesPerDay
          },
          action: {
            ...gameStatsByType.action,
            remaining: Math.max(0, gamingRewards.action.maxGamesPerDay - gameStatsByType.action.played),
            maxPerDay: gamingRewards.action.maxGamesPerDay
          }
        },
        rewards: gamingRewards
      }
    }, { status: 200 });
    
  } catch (error: any) {
    console.error('Error fetching gaming stats:', error);
    return NextResponse.json<ApiResponse>({
      success: false,
      message: 'Internal server error',
      error: error.message
    }, { status: 500 });
  }
}
