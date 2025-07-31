import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import { AdminSettings } from '@/models';
import { authenticate, authorize } from '@/middleware/auth';
import { ApiResponse } from '@/types';

export async function GET(request: NextRequest) {
  try {
    // Authenticate and authorize admin
    const { user, error } = await authenticate(request);
    if (error) {
      return NextResponse.json<ApiResponse>({
        success: false,
        message: error
      }, { status: 401 });
    }

    const authError = await authorize(user, ['admin']);
    if (authError) {
      return NextResponse.json<ApiResponse>({
        success: false,
        message: authError
      }, { status: 403 });
    }

    await connectDB();
    
    const { searchParams } = new URL(request.url);
    const category = searchParams.get('category');
    
    let query: any = {};
    if (category) {
      query.category = category;
    }
    
    const settings = await AdminSettings.find(query).sort({ category: 1, key: 1 });
    
    // Group settings by category
    const groupedSettings = settings.reduce((acc, setting) => {
      if (!acc[setting.category]) {
        acc[setting.category] = [];
      }
      acc[setting.category].push(setting);
      return acc;
    }, {} as any);
    
    return NextResponse.json<ApiResponse>({
      success: true,
      message: 'Settings fetched successfully',
      data: {
        settings: groupedSettings,
        categories: Object.keys(groupedSettings)
      }
    }, { status: 200 });
    
  } catch (error: any) {
    console.error('Error fetching settings:', error);
    return NextResponse.json<ApiResponse>({
      success: false,
      message: 'Internal server error',
      error: error.message
    }, { status: 500 });
  }
}

export async function PUT(request: NextRequest) {
  try {
    // Authenticate and authorize admin
    const { user, error } = await authenticate(request);
    if (error) {
      return NextResponse.json<ApiResponse>({
        success: false,
        message: error
      }, { status: 401 });
    }

    const authError = await authorize(user, ['admin']);
    if (authError) {
      return NextResponse.json<ApiResponse>({
        success: false,
        message: authError
      }, { status: 403 });
    }

    await connectDB();
    
    const body = await request.json();
    const { settings } = body;
    
    if (!settings || !Array.isArray(settings)) {
      return NextResponse.json<ApiResponse>({
        success: false,
        message: 'Settings array is required'
      }, { status: 400 });
    }
    
    const updatePromises = settings.map(async (setting: any) => {
      const { key, value, category, description } = setting;
      
      if (!key || value === undefined) {
        throw new Error('Key and value are required for each setting');
      }
      
      return AdminSettings.findOneAndUpdate(
        { key },
        {
          key,
          value,
          category: category || 'general',
          description: description || '',
          updatedAt: new Date()
        },
        { upsert: true, new: true }
      );
    });
    
    const updatedSettings = await Promise.all(updatePromises);
    
    return NextResponse.json<ApiResponse>({
      success: true,
      message: 'Settings updated successfully',
      data: { settings: updatedSettings }
    }, { status: 200 });
    
  } catch (error: any) {
    console.error('Error updating settings:', error);
    return NextResponse.json<ApiResponse>({
      success: false,
      message: error.message || 'Internal server error'
    }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    // Authenticate and authorize admin
    const { user, error } = await authenticate(request);
    if (error) {
      return NextResponse.json<ApiResponse>({
        success: false,
        message: error
      }, { status: 401 });
    }

    const authError = await authorize(user, ['admin']);
    if (authError) {
      return NextResponse.json<ApiResponse>({
        success: false,
        message: authError
      }, { status: 403 });
    }

    await connectDB();
    
    const body = await request.json();
    const { action } = body;
    
    if (action === 'initialize') {
      // Initialize default settings
      const defaultSettings = [
        // MLM Settings
        {
          key: 'mlm_settings',
          category: 'mlm',
          description: 'MLM system configuration',
          value: {
            maxLevels: 25,
            matrixSize: 5,
            levelIncomePercentages: [10, 8, 6, 5, 4, 3, 3, 2, 2, 2, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1],
            referralBonus: 50,
            welcomeBonus: 10
          }
        },
        // Gaming Rewards
        {
          key: 'video_rewards',
          category: 'gaming',
          description: 'Video watching rewards configuration',
          value: {
            rewardPerVideo: 1,
            maxVideosPerDay: 10,
            minDuration: 30
          }
        },
        {
          key: 'ad_rewards',
          category: 'gaming',
          description: 'Ad viewing rewards configuration',
          value: {
            banner: { rewardPerAd: 0.5, maxAdsPerDay: 20, minDuration: 5 },
            video: { rewardPerAd: 2, maxAdsPerDay: 10, minDuration: 15 },
            interstitial: { rewardPerAd: 1, maxAdsPerDay: 15, minDuration: 10 }
          }
        },
        {
          key: 'gaming_rewards',
          category: 'gaming',
          description: 'Gaming rewards configuration',
          value: {
            casual: { baseReward: 0.5, maxGamesPerDay: 15, minDuration: 60, scoreMultiplier: 0.001 },
            puzzle: { baseReward: 1, maxGamesPerDay: 10, minDuration: 120, scoreMultiplier: 0.002 },
            action: { baseReward: 1.5, maxGamesPerDay: 8, minDuration: 180, scoreMultiplier: 0.003 }
          }
        },
        {
          key: 'daily_tasks',
          category: 'gaming',
          description: 'Daily tasks configuration',
          value: {
            login: { reward: 5, description: 'Daily login bonus' },
            watchVideos: { target: 5, reward: 10, description: 'Watch 5 videos' },
            viewAds: { target: 10, reward: 8, description: 'View 10 ads' },
            playGames: { target: 3, reward: 15, description: 'Play 3 games' },
            referFriend: { reward: 50, description: 'Refer a new friend' },
            makeTransaction: { reward: 20, description: 'Make any transaction' }
          }
        },
        // Withdrawal Settings
        {
          key: 'withdrawal_settings',
          category: 'financial',
          description: 'Withdrawal system configuration',
          value: {
            minWithdrawal: 100,
            maxWithdrawal: 50000,
            processingFee: 10,
            tdsPercentage: 5,
            processingTime: '24-48 hours',
            workingDays: ['monday', 'tuesday', 'wednesday', 'thursday', 'friday']
          }
        },
        // E-commerce Settings
        {
          key: 'ecommerce_settings',
          category: 'ecommerce',
          description: 'E-commerce platform configuration',
          value: {
            commissionPercentage: 10,
            shippingCharges: 50,
            freeShippingThreshold: 500,
            returnPolicy: 7,
            vendorVerificationRequired: true
          }
        },
        // General Settings
        {
          key: 'app_settings',
          category: 'general',
          description: 'General application settings',
          value: {
            appName: 'ADPLAY-MART',
            supportEmail: 'support@ADPLAY-MART.com',
            supportPhone: '+91-9999999999',
            maintenanceMode: false,
            registrationOpen: true
          }
        }
      ];
      
      const initPromises = defaultSettings.map(setting => 
        AdminSettings.findOneAndUpdate(
          { key: setting.key },
          setting,
          { upsert: true, new: true }
        )
      );
      
      await Promise.all(initPromises);
      
      return NextResponse.json<ApiResponse>({
        success: true,
        message: 'Default settings initialized successfully'
      }, { status: 200 });
    }
    
    return NextResponse.json<ApiResponse>({
      success: false,
      message: 'Invalid action'
    }, { status: 400 });
    
  } catch (error: any) {
    console.error('Error initializing settings:', error);
    return NextResponse.json<ApiResponse>({
      success: false,
      message: 'Internal server error',
      error: error.message
    }, { status: 500 });
  }
}
