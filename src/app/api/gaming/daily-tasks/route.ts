import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import { User, Transaction, AdminSettings } from '@/models';
import { authenticate } from '@/middleware/auth';
import { ApiResponse } from '@/types';

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
    const currentUser = await User.findById(user.userId).populate('currentPackage');
    if (!currentUser) {
      return NextResponse.json<ApiResponse>({
        success: false,
        message: 'User not found'
      }, { status: 404 });
    }
    
    // Get admin settings for daily tasks
    const settings = await AdminSettings.findOne({ key: 'daily_tasks' });
    const dailyTasks = settings?.value || {
      login: { reward: 5, description: 'Daily login bonus' },
      watchVideos: { target: 5, reward: 10, description: 'Watch 5 videos' },
      viewAds: { target: 10, reward: 8, description: 'View 10 ads' },
      playGames: { target: 3, reward: 15, description: 'Play 3 games' },
      referFriend: { reward: 50, description: 'Refer a new friend' },
      makeTransaction: { reward: 20, description: 'Make any transaction' }
    };
    
    // Get today's date range
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);
    
    // Check today's activities
    const todayTransactions = await Transaction.find({
      userId: user.userId,
      createdAt: { $gte: today, $lt: tomorrow }
    });
    
    // Count activities
    const videosWatched = todayTransactions.filter(t => t.type === 'video_reward').length;
    const adsViewed = todayTransactions.filter(t => t.type === 'ad_reward').length;
    const gamesPlayed = todayTransactions.filter(t => t.type === 'gaming_reward').length;
    const transactionsMade = todayTransactions.filter(t => ['purchase', 'package_purchase'].includes(t.type)).length;
    
    // Check if daily login bonus was claimed
    const loginBonusClaimed = todayTransactions.some(t => t.type === 'daily_login');
    
    // Check referrals today
    const todayReferrals = await User.countDocuments({
      referredBy: user.userId,
      createdAt: { $gte: today, $lt: tomorrow }
    });
    
    // Build tasks status
    const tasks = [
      {
        id: 'login',
        title: 'Daily Login',
        description: dailyTasks.login.description,
        reward: dailyTasks.login.reward,
        completed: loginBonusClaimed,
        progress: loginBonusClaimed ? 1 : 0,
        target: 1,
        type: 'login'
      },
      {
        id: 'watchVideos',
        title: 'Watch Videos',
        description: dailyTasks.watchVideos.description,
        reward: dailyTasks.watchVideos.reward,
        completed: videosWatched >= dailyTasks.watchVideos.target,
        progress: videosWatched,
        target: dailyTasks.watchVideos.target,
        type: 'activity'
      },
      {
        id: 'viewAds',
        title: 'View Ads',
        description: dailyTasks.viewAds.description,
        reward: dailyTasks.viewAds.reward,
        completed: adsViewed >= dailyTasks.viewAds.target,
        progress: adsViewed,
        target: dailyTasks.viewAds.target,
        type: 'activity'
      },
      {
        id: 'playGames',
        title: 'Play Games',
        description: dailyTasks.playGames.description,
        reward: dailyTasks.playGames.reward,
        completed: gamesPlayed >= dailyTasks.playGames.target,
        progress: gamesPlayed,
        target: dailyTasks.playGames.target,
        type: 'activity'
      },
      {
        id: 'referFriend',
        title: 'Refer Friend',
        description: dailyTasks.referFriend.description,
        reward: dailyTasks.referFriend.reward,
        completed: todayReferrals > 0,
        progress: todayReferrals,
        target: 1,
        type: 'social'
      },
      {
        id: 'makeTransaction',
        title: 'Make Transaction',
        description: dailyTasks.makeTransaction.description,
        reward: dailyTasks.makeTransaction.reward,
        completed: transactionsMade > 0,
        progress: transactionsMade,
        target: 1,
        type: 'financial'
      }
    ];
    
    // Calculate completion stats
    const completedTasks = tasks.filter(t => t.completed).length;
    const totalTasks = tasks.length;
    const completionPercentage = Math.round((completedTasks / totalTasks) * 100);
    const totalPossibleRewards = tasks.reduce((sum, task) => sum + task.reward, 0);
    const earnedRewards = tasks.filter(t => t.completed).reduce((sum, task) => sum + task.reward, 0);
    
    return NextResponse.json<ApiResponse>({
      success: true,
      message: 'Daily tasks fetched successfully',
      data: {
        tasks,
        summary: {
          completedTasks,
          totalTasks,
          completionPercentage,
          earnedRewards,
          totalPossibleRewards,
          remainingRewards: totalPossibleRewards - earnedRewards
        },
        userStats: {
          currentPackage: currentUser.currentPackage ? (currentUser.currentPackage as any).name : null,
          walletBalance: currentUser.wallets.upgrade,
          totalEarnings: currentUser.gaming.totalEarnings
        }
      }
    }, { status: 200 });
    
  } catch (error: any) {
    console.error('Error fetching daily tasks:', error);
    return NextResponse.json<ApiResponse>({
      success: false,
      message: 'Internal server error',
      error: error.message
    }, { status: 500 });
  }
}

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
    const { taskId } = body;
    
    if (taskId !== 'login') {
      return NextResponse.json<ApiResponse>({
        success: false,
        message: 'Only login bonus can be claimed manually'
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
        message: 'Active package required to claim daily bonuses'
      }, { status: 400 });
    }
    
    // Check if already claimed today
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);
    
    const existingBonus = await Transaction.findOne({
      userId: user.userId,
      type: 'daily_login',
      createdAt: { $gte: today, $lt: tomorrow }
    });
    
    if (existingBonus) {
      return NextResponse.json<ApiResponse>({
        success: false,
        message: 'Daily login bonus already claimed today'
      }, { status: 400 });
    }
    
    // Get admin settings
    const settings = await AdminSettings.findOne({ key: 'daily_tasks' });
    const dailyTasks = settings?.value || {
      login: { reward: 5, description: 'Daily login bonus' }
    };
    
    let rewardAmount = dailyTasks.login.reward;
    
    // Package bonus
    const packageData = currentUser.currentPackage as any;
    if (packageData.price >= 5000) {
      rewardAmount *= 2; // Premium packages get 2x login bonus
    } else if (packageData.price >= 2000) {
      rewardAmount *= 1.5; // Professional packages get 1.5x login bonus
    }
    
    // Add reward to user's wallet
    currentUser.wallets.upgrade += rewardAmount;
    currentUser.gaming.totalEarnings += rewardAmount;
    await currentUser.save();
    
    // Create transaction record
    const transaction = new Transaction({
      userId: user.userId,
      type: 'daily_login',
      amount: rewardAmount,
      description: 'Daily login bonus',
      status: 'completed'
    });
    await transaction.save();
    
    return NextResponse.json<ApiResponse>({
      success: true,
      message: 'Daily login bonus claimed successfully',
      data: {
        reward: rewardAmount,
        walletBalance: currentUser.wallets.upgrade,
        totalEarnings: currentUser.gaming.totalEarnings
      }
    }, { status: 200 });
    
  } catch (error: any) {
    console.error('Daily task claim error:', error);
    return NextResponse.json<ApiResponse>({
      success: false,
      message: 'Internal server error',
      error: error.message
    }, { status: 500 });
  }
}
