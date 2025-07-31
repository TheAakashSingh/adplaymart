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
    const { videoId, duration, completed = true } = body;
    
    // Validation
    if (!videoId || !duration) {
      return NextResponse.json<ApiResponse>({
        success: false,
        message: 'Video ID and duration are required'
      }, { status: 400 });
    }
    
    if (!completed) {
      return NextResponse.json<ApiResponse>({
        success: false,
        message: 'Video must be watched completely to earn rewards'
      }, { status: 400 });
    }
    
    // Get user details
    const currentUser = await User.findById(user.userId).populate('currentPackage');
    if (!currentUser) {
      return NextResponse.json<ApiResponse>({
        success: false,
        message: 'User not found'
      }, { status: 404 });
    }
    
    // Check if user has active package
    if (!currentUser.currentPackage) {
      return NextResponse.json<ApiResponse>({
        success: false,
        message: 'Active package required to earn from video watching'
      }, { status: 400 });
    }
    
    // Get admin settings for video rewards
    const settings = await AdminSettings.findOne({ key: 'video_rewards' });
    const videoRewards = settings?.value || {
      rewardPerVideo: 1,
      maxVideosPerDay: 10,
      minDuration: 30
    };
    
    // Check minimum duration
    if (duration < videoRewards.minDuration) {
      return NextResponse.json<ApiResponse>({
        success: false,
        message: `Video must be at least ${videoRewards.minDuration} seconds long`
      }, { status: 400 });
    }
    
    // Check daily limit
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);
    
    const todayVideoCount = await Transaction.countDocuments({
      userId: user.userId,
      type: 'video_reward',
      createdAt: { $gte: today, $lt: tomorrow }
    });
    
    if (todayVideoCount >= videoRewards.maxVideosPerDay) {
      return NextResponse.json<ApiResponse>({
        success: false,
        message: `Daily video limit reached. You can watch ${videoRewards.maxVideosPerDay} videos per day`
      }, { status: 400 });
    }
    
    // Check if this video was already watched today
    const existingReward = await Transaction.findOne({
      userId: user.userId,
      type: 'video_reward',
      description: { $regex: videoId },
      createdAt: { $gte: today, $lt: tomorrow }
    });
    
    if (existingReward) {
      return NextResponse.json<ApiResponse>({
        success: false,
        message: 'You have already earned reward for this video today'
      }, { status: 400 });
    }
    
    // Calculate reward based on package
    const packageData = currentUser.currentPackage as any;
    let rewardAmount = videoRewards.rewardPerVideo;
    
    // Bonus based on package level
    if (packageData.price >= 5000) {
      rewardAmount *= 2; // Premium packages get 2x rewards
    } else if (packageData.price >= 2000) {
      rewardAmount *= 1.5; // Professional packages get 1.5x rewards
    }
    
    // Add reward to user's wallet
    currentUser.wallets.upgrade += rewardAmount;
    currentUser.gaming.videosWatched += 1;
    currentUser.gaming.totalEarnings += rewardAmount;
    await currentUser.save();
    
    // Create transaction record
    const transaction = new Transaction({
      userId: user.userId,
      type: 'video_reward',
      amount: rewardAmount,
      netAmount: rewardAmount, // No TDS for video rewards
      description: `Video watching reward - ${videoId}`,
      status: 'completed'
    });
    await transaction.save();
    
    return NextResponse.json<ApiResponse>({
      success: true,
      message: 'Video reward earned successfully',
      data: {
        reward: rewardAmount,
        totalEarnings: currentUser.gaming.totalEarnings,
        videosWatchedToday: todayVideoCount + 1,
        remainingVideos: videoRewards.maxVideosPerDay - (todayVideoCount + 1),
        walletBalance: currentUser.wallets.upgrade
      }
    }, { status: 200 });
    
  } catch (error: any) {
    console.error('Video reward error:', error);
    return NextResponse.json<ApiResponse>({
      success: false,
      message: 'Internal server error',
      error: error.message
    }, { status: 500 });
  }
}

// GET method to fetch video watching stats
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
    
    // Get user details
    const currentUser = await User.findById(user.userId);
    if (!currentUser) {
      return NextResponse.json<ApiResponse>({
        success: false,
        message: 'User not found'
      }, { status: 404 });
    }
    
    // Get admin settings
    const settings = await AdminSettings.findOne({ key: 'video_rewards' });
    const videoRewards = settings?.value || {
      rewardPerVideo: 1,
      maxVideosPerDay: 10,
      minDuration: 30
    };
    
    // Get today's video count
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);
    
    const todayVideoCount = await Transaction.countDocuments({
      userId: user.userId,
      type: 'video_reward',
      createdAt: { $gte: today, $lt: tomorrow }
    });
    
    return NextResponse.json<ApiResponse>({
      success: true,
      message: 'Video stats fetched successfully',
      data: {
        gaming: currentUser.gaming,
        todayStats: {
          videosWatched: todayVideoCount,
          remainingVideos: Math.max(0, videoRewards.maxVideosPerDay - todayVideoCount),
          maxVideosPerDay: videoRewards.maxVideosPerDay
        },
        rewards: {
          rewardPerVideo: videoRewards.rewardPerVideo,
          minDuration: videoRewards.minDuration
        }
      }
    }, { status: 200 });
    
  } catch (error: any) {
    console.error('Error fetching video stats:', error);
    return NextResponse.json<ApiResponse>({
      success: false,
      message: 'Internal server error',
      error: error.message
    }, { status: 500 });
  }
}
