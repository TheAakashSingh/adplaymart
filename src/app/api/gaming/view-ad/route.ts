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
    const { adId, duration, completed = true, adType = 'banner' } = body;
    
    // Validation
    if (!adId || !duration) {
      return NextResponse.json<ApiResponse>({
        success: false,
        message: 'Ad ID and duration are required'
      }, { status: 400 });
    }
    
    if (!completed) {
      return NextResponse.json<ApiResponse>({
        success: false,
        message: 'Ad must be viewed completely to earn rewards'
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
        message: 'Active package required to earn from ad viewing'
      }, { status: 400 });
    }
    
    // Get admin settings for ad rewards
    const settings = await AdminSettings.findOne({ key: 'ad_rewards' });
    const adRewards = settings?.value || {
      banner: { rewardPerAd: 0.5, maxAdsPerDay: 20, minDuration: 5 },
      video: { rewardPerAd: 2, maxAdsPerDay: 10, minDuration: 15 },
      interstitial: { rewardPerAd: 1, maxAdsPerDay: 15, minDuration: 10 }
    };
    
    const adConfig = adRewards[adType] || adRewards.banner;
    
    // Check minimum duration
    if (duration < adConfig.minDuration) {
      return NextResponse.json<ApiResponse>({
        success: false,
        message: `Ad must be viewed for at least ${adConfig.minDuration} seconds`
      }, { status: 400 });
    }
    
    // Check daily limit
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);
    
    const todayAdCount = await Transaction.countDocuments({
      userId: user.userId,
      type: 'ad_reward',
      description: { $regex: adType },
      createdAt: { $gte: today, $lt: tomorrow }
    });
    
    if (todayAdCount >= adConfig.maxAdsPerDay) {
      return NextResponse.json<ApiResponse>({
        success: false,
        message: `Daily ${adType} ad limit reached. You can view ${adConfig.maxAdsPerDay} ${adType} ads per day`
      }, { status: 400 });
    }
    
    // Check if this ad was already viewed today
    const existingReward = await Transaction.findOne({
      userId: user.userId,
      type: 'ad_reward',
      description: { $regex: adId },
      createdAt: { $gte: today, $lt: tomorrow }
    });
    
    if (existingReward) {
      return NextResponse.json<ApiResponse>({
        success: false,
        message: 'You have already earned reward for this ad today'
      }, { status: 400 });
    }
    
    // Calculate reward based on package
    const packageData = currentUser.currentPackage as any;
    let rewardAmount = adConfig.rewardPerAd;
    
    // Bonus based on package level
    if (packageData.price >= 5000) {
      rewardAmount *= 2; // Premium packages get 2x rewards
    } else if (packageData.price >= 2000) {
      rewardAmount *= 1.5; // Professional packages get 1.5x rewards
    }
    
    // Add reward to user's wallet
    currentUser.wallets.upgrade += rewardAmount;
    currentUser.gaming.adsViewed += 1;
    currentUser.gaming.totalEarnings += rewardAmount;
    await currentUser.save();
    
    // Create transaction record
    const transaction = new Transaction({
      userId: user.userId,
      type: 'ad_reward',
      amount: rewardAmount,
      netAmount: rewardAmount, // No TDS for ad rewards
      description: `${adType} ad viewing reward - ${adId}`,
      status: 'completed'
    });
    await transaction.save();
    
    return NextResponse.json<ApiResponse>({
      success: true,
      message: 'Ad reward earned successfully',
      data: {
        reward: rewardAmount,
        totalEarnings: currentUser.gaming.totalEarnings,
        adsViewedToday: todayAdCount + 1,
        remainingAds: adConfig.maxAdsPerDay - (todayAdCount + 1),
        walletBalance: currentUser.wallets.upgrade
      }
    }, { status: 200 });
    
  } catch (error: any) {
    console.error('Ad reward error:', error);
    return NextResponse.json<ApiResponse>({
      success: false,
      message: 'Internal server error',
      error: error.message
    }, { status: 500 });
  }
}

// GET method to fetch ad viewing stats
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
    const settings = await AdminSettings.findOne({ key: 'ad_rewards' });
    const adRewards = settings?.value || {
      banner: { rewardPerAd: 0.5, maxAdsPerDay: 20, minDuration: 5 },
      video: { rewardPerAd: 2, maxAdsPerDay: 10, minDuration: 15 },
      interstitial: { rewardPerAd: 1, maxAdsPerDay: 15, minDuration: 10 }
    };
    
    // Get today's ad counts by type
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);
    
    const todayAdStats = await Transaction.aggregate([
      {
        $match: {
          userId: user.userId,
          type: 'ad_reward',
          createdAt: { $gte: today, $lt: tomorrow }
        }
      },
      {
        $group: {
          _id: {
            $cond: [
              { $regexMatch: { input: '$description', regex: /banner/ } },
              'banner',
              {
                $cond: [
                  { $regexMatch: { input: '$description', regex: /video/ } },
                  'video',
                  'interstitial'
                ]
              }
            ]
          },
          count: { $sum: 1 }
        }
      }
    ]);
    
    const adStatsByType = {
      banner: 0,
      video: 0,
      interstitial: 0
    };
    
    todayAdStats.forEach(stat => {
      adStatsByType[stat._id] = stat.count;
    });
    
    return NextResponse.json<ApiResponse>({
      success: true,
      message: 'Ad stats fetched successfully',
      data: {
        gaming: currentUser.gaming,
        todayStats: {
          banner: {
            viewed: adStatsByType.banner,
            remaining: Math.max(0, adRewards.banner.maxAdsPerDay - adStatsByType.banner),
            maxPerDay: adRewards.banner.maxAdsPerDay
          },
          video: {
            viewed: adStatsByType.video,
            remaining: Math.max(0, adRewards.video.maxAdsPerDay - adStatsByType.video),
            maxPerDay: adRewards.video.maxAdsPerDay
          },
          interstitial: {
            viewed: adStatsByType.interstitial,
            remaining: Math.max(0, adRewards.interstitial.maxAdsPerDay - adStatsByType.interstitial),
            maxPerDay: adRewards.interstitial.maxAdsPerDay
          }
        },
        rewards: adRewards
      }
    }, { status: 200 });
    
  } catch (error: any) {
    console.error('Error fetching ad stats:', error);
    return NextResponse.json<ApiResponse>({
      success: false,
      message: 'Internal server error',
      error: error.message
    }, { status: 500 });
  }
}
