import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import { User, Package, Transaction } from '@/models';
import { generateReferralCode, isValidEmail, isValidPhone } from '@/utils/auth';
import { ApiResponse } from '@/types';

export async function POST(request: NextRequest) {
  try {
    await connectDB();
    
    const body = await request.json();
    const { username, email, password, phone, referralCode } = body;
    
    // Validation
    if (!username || !email || !password || !phone) {
      return NextResponse.json<ApiResponse>({
        success: false,
        message: 'All fields are required'
      }, { status: 400 });
    }
    
    if (!isValidEmail(email)) {
      return NextResponse.json<ApiResponse>({
        success: false,
        message: 'Invalid email format'
      }, { status: 400 });
    }
    
    if (!isValidPhone(phone)) {
      return NextResponse.json<ApiResponse>({
        success: false,
        message: 'Invalid phone number format'
      }, { status: 400 });
    }
    
    if (password.length < 6) {
      return NextResponse.json<ApiResponse>({
        success: false,
        message: 'Password must be at least 6 characters long'
      }, { status: 400 });
    }
    
    // Check if user already exists
    const existingUser = await User.findOne({
      $or: [{ email }, { username }, { phone }]
    });
    
    if (existingUser) {
      return NextResponse.json<ApiResponse>({
        success: false,
        message: 'User with this email, username, or phone already exists'
      }, { status: 400 });
    }
    
    // Check referral code if provided
    let referrer = null;
    if (referralCode) {
      referrer = await User.findOne({ referralCode });
      if (!referrer) {
        return NextResponse.json<ApiResponse>({
          success: false,
          message: 'Invalid referral code'
        }, { status: 400 });
      }
    }
    
    // Generate unique referral code for new user
    let newReferralCode;
    let isUnique = false;
    let attempts = 0;
    
    while (!isUnique && attempts < 10) {
      newReferralCode = generateReferralCode(username);
      const existingCode = await User.findOne({ referralCode: newReferralCode });
      if (!existingCode) {
        isUnique = true;
      }
      attempts++;
    }
    
    if (!isUnique) {
      return NextResponse.json<ApiResponse>({
        success: false,
        message: 'Failed to generate unique referral code. Please try again.'
      }, { status: 500 });
    }
    
    // Create new user
    const newUser = new User({
      username,
      email,
      password,
      phone,
      referralCode: newReferralCode,
      referredBy: referrer?._id,
      sponsorId: referrer?._id,
      level: referrer ? referrer.level + 1 : 0
    });
    
    await newUser.save();
    
    // Update referrer's data if exists
    if (referrer) {
      referrer.directReferrals.push(newUser._id);
      referrer.totalReferrals += 1;
      await referrer.save();
      
      // Add referral bonus transaction
      const referralBonus = parseInt(process.env.DEFAULT_REFERRAL_BONUS || '100');
      
      const bonusTransaction = new Transaction({
        userId: referrer._id,
        type: 'referral_bonus',
        amount: referralBonus,
        status: 'completed',
        description: `Referral bonus for inviting ${username}`,
        netAmount: referralBonus
      });
      
      await bonusTransaction.save();
      
      // Update referrer's wallet
      referrer.upgradeWallet += referralBonus;
      referrer.totalEarnings += referralBonus;
      await referrer.save();
    }
    
    // Add video watch reward for new user (₹100 on registration)
    const videoReward = parseInt(process.env.VIDEO_WATCH_REWARD || '100');
    
    const welcomeTransaction = new Transaction({
      userId: newUser._id,
      type: 'video_reward',
      amount: videoReward,
      status: 'completed',
      description: 'Welcome bonus for watching intro video',
      netAmount: videoReward
    });
    
    await welcomeTransaction.save();
    
    // Update new user's wallet
    if (!newUser.wallets) {
      newUser.wallets = { upgrade: 0, withdrawal: 0 };
    }
    newUser.wallets.upgrade += videoReward;
    newUser.totalEarnings += videoReward;
    newUser.videoWatchRewardClaimed = true;
    await newUser.save();
    
    // Remove password from response
    const userResponse = {
      _id: newUser._id,
      username: newUser.username,
      email: newUser.email,
      phone: newUser.phone,
      role: newUser.role,
      referralCode: newUser.referralCode,
      wallets: newUser.wallets,
      totalEarnings: newUser.totalEarnings,
      totalReferrals: newUser.totalReferrals,
      createdAt: newUser.createdAt
    };
    
    return NextResponse.json<ApiResponse>({
      success: true,
      message: 'User registered successfully! Welcome bonus of ₹100 added to your wallet.',
      data: { user: userResponse }
    }, { status: 201 });
    
  } catch (error: any) {
    console.error('Registration error:', error);
    return NextResponse.json<ApiResponse>({
      success: false,
      message: 'Internal server error',
      error: error.message
    }, { status: 500 });
  }
}
