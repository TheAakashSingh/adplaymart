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
    const { videoId, videoType, watchDuration, totalDuration } = body;
    
    // Validation
    if (!videoId || !videoType || !watchDuration || !totalDuration) {
      return NextResponse.json<ApiResponse>({
        success: false,
        message: 'Video ID, type, watch duration, and total duration are required'
      }, { status: 400 });
    }
    
    // Check if video was watched completely (at least 90% of total duration)
    const watchPercentage = (watchDuration / totalDuration) * 100;
    if (watchPercentage < 90) {
      return NextResponse.json<ApiResponse>({
        success: false,
        message: 'Video must be watched completely to earn rewards'
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
    const currentUser = await User.findById(userObjectId);
    if (!currentUser) {
      return NextResponse.json<ApiResponse>({
        success: false,
        message: 'User not found'
      }, { status: 404 });
    }
    
    // Initialize wallets if not exists
    if (!currentUser.wallets) {
      currentUser.wallets = { upgrade: 0, withdrawal: 0 };
    }
    
    let rewardAmount = 0;
    let rewardMessage = '';
    let canEarn = true;
    
    // Handle different video types
    switch (videoType) {
      case 'welcome':
        // One-time welcome video reward
        if (currentUser.videoWatchRewardClaimed) {
          canEarn = false;
          rewardMessage = 'Welcome video reward already claimed';
        } else {
          rewardAmount = 100; // ₹100 for welcome video
          currentUser.videoWatchRewardClaimed = true;
          rewardMessage = 'Welcome video reward earned!';
        }
        break;
        
      case 'daily_ad':
        // Daily ad watching (50 ads/day for ₹100/day for 7 days)
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        
        const lastAdDate = currentUser.lastAdWatchDate ? new Date(currentUser.lastAdWatchDate) : null;
        const isToday = lastAdDate && lastAdDate.getTime() === today.getTime();
        
        // Reset daily count if it's a new day
        if (!isToday) {
          currentUser.dailyAdWatched = 0;
          currentUser.lastAdWatchDate = today;
        }
        
        // Check daily limit (50 ads per day)
        if (currentUser.dailyAdWatched >= 50) {
          canEarn = false;
          rewardMessage = 'Daily ad limit reached (50 ads/day)';
        } else {
          rewardAmount = 2; // ₹2 per ad (50 ads × ₹2 = ₹100/day)
          currentUser.dailyAdWatched += 1;
          rewardMessage = `Ad reward earned! (${currentUser.dailyAdWatched}/50 today)`;
        }
        break;
        
      case 'game_unlock':
        // Video to unlock gaming features
        rewardAmount = 50; // ₹50 for game unlock video
        rewardMessage = 'Gaming features unlocked!';
        break;
        
      default:
        return NextResponse.json<ApiResponse>({
          success: false,
          message: 'Invalid video type'
        }, { status: 400 });
    }
    
    if (!canEarn) {
      return NextResponse.json<ApiResponse>({
        success: false,
        message: rewardMessage
      }, { status: 400 });
    }
    
    // Add reward to withdrawal wallet
    currentUser.wallets.withdrawal += rewardAmount;
    currentUser.totalEarnings += rewardAmount;
    
    // Initialize gaming if not exists
    if (!currentUser.gaming) {
      currentUser.gaming = {
        totalEarnings: 0,
        gamesPlayed: 0,
        highScore: 0
      };
    }
    
    // Update gaming earnings for game-related videos
    if (videoType === 'game_unlock') {
      currentUser.gaming.totalEarnings += rewardAmount;
    }
    
    await currentUser.save();
    
    // Create transaction record
    const transaction = new Transaction({
      userId: userObjectId,
      type: 'video_reward',
      amount: rewardAmount,
      netAmount: rewardAmount, // No TDS for video rewards
      status: 'completed',
      description: `Video watch reward - ${videoType}`,
      metadata: {
        videoId,
        videoType,
        watchDuration,
        totalDuration,
        watchPercentage: Math.round(watchPercentage)
      }
    });
    
    await transaction.save();
    
    return NextResponse.json<ApiResponse>({
      success: true,
      message: rewardMessage,
      data: {
        rewardAmount,
        videoType,
        watchPercentage: Math.round(watchPercentage),
        wallets: currentUser.wallets,
        totalEarnings: currentUser.totalEarnings,
        dailyAdProgress: videoType === 'daily_ad' ? {
          watched: currentUser.dailyAdWatched,
          remaining: 50 - currentUser.dailyAdWatched,
          dailyEarnings: currentUser.dailyAdWatched * 2
        } : null
      }
    }, { status: 200 });
    
  } catch (error: any) {
    console.error('Error processing video watch:', error);
    return NextResponse.json<ApiResponse>({
      success: false,
      message: 'Internal server error',
      error: error.message
    }, { status: 500 });
  }
}

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
    
    // Calculate daily ad progress
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    const lastAdDate = currentUser.lastAdWatchDate ? new Date(currentUser.lastAdWatchDate) : null;
    const isToday = lastAdDate && lastAdDate.getTime() === today.getTime();
    
    const dailyAdProgress = {
      watched: isToday ? currentUser.dailyAdWatched : 0,
      remaining: isToday ? 50 - currentUser.dailyAdWatched : 50,
      dailyEarnings: isToday ? currentUser.dailyAdWatched * 2 : 0,
      canWatchMore: isToday ? currentUser.dailyAdWatched < 50 : true
    };
    
    return NextResponse.json<ApiResponse>({
      success: true,
      message: 'Video watch status retrieved successfully',
      data: {
        welcomeVideoWatched: currentUser.videoWatchRewardClaimed || false,
        dailyAdProgress,
        totalVideoEarnings: currentUser.totalEarnings || 0,
        availableVideos: [
          {
            type: 'welcome',
            title: 'Welcome Video',
            reward: 100,
            duration: 120, // 2 minutes
            available: !currentUser.videoWatchRewardClaimed,
            description: 'Watch our welcome video and earn ₹100 instantly!'
          },
          {
            type: 'daily_ad',
            title: 'Daily Ads',
            reward: 2,
            duration: 30, // 30 seconds per ad
            available: dailyAdProgress.canWatchMore,
            description: 'Watch ads and earn ₹2 per ad (50 ads/day = ₹100/day)'
          },
          {
            type: 'game_unlock',
            title: 'Gaming Tutorial',
            reward: 50,
            duration: 90, // 1.5 minutes
            available: true,
            description: 'Learn how to play games and earn ₹50'
          }
        ]
      }
    }, { status: 200 });
    
  } catch (error: any) {
    console.error('Error getting video watch status:', error);
    return NextResponse.json<ApiResponse>({
      success: false,
      message: 'Internal server error',
      error: error.message
    }, { status: 500 });
  }
}
