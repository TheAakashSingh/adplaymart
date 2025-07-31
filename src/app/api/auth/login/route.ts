import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import { User } from '@/models';
import { generateToken, comparePassword } from '@/utils/auth';
import { ApiResponse } from '@/types';

export async function POST(request: NextRequest) {
  try {
    await connectDB();
    
    const body = await request.json();
    const { email, password } = body;
    
    // Validation
    if (!email || !password) {
      return NextResponse.json<ApiResponse>({
        success: false,
        message: 'Email and password are required'
      }, { status: 400 });
    }
    
    // Find user by email or username
    const user = await User.findOne({
      $or: [{ email }, { username: email }]
    });
    
    if (!user) {
      return NextResponse.json<ApiResponse>({
        success: false,
        message: 'Invalid credentials'
      }, { status: 401 });
    }
    
    // Check if user is active
    if (!user.isActive) {
      return NextResponse.json<ApiResponse>({
        success: false,
        message: 'Your account has been deactivated. Please contact support.'
      }, { status: 401 });
    }
    
    // Verify password
    const isPasswordValid = await user.comparePassword(password);
    
    if (!isPasswordValid) {
      return NextResponse.json<ApiResponse>({
        success: false,
        message: 'Invalid credentials'
      }, { status: 401 });
    }
    
    // Generate JWT token
    const token = generateToken({
      userId: user._id.toString(),
      email: user.email,
      role: user.role
    });
    
    // Prepare user data for response (exclude password)
    const userData = {
      _id: user._id,
      username: user.username,
      email: user.email,
      phone: user.phone,
      role: user.role,
      isActive: user.isActive,
      isEmailVerified: user.isEmailVerified,
      profileImage: user.profileImage,
      referralCode: user.referralCode,
      level: user.level,
      totalReferrals: user.totalReferrals,
      upgradeWallet: user.upgradeWallet,
      withdrawalWallet: user.withdrawalWallet,
      totalEarnings: user.totalEarnings,
      totalWithdrawals: user.totalWithdrawals,
      currentPackage: user.currentPackage,
      packageActivatedAt: user.packageActivatedAt,
      investmentAmount: user.investmentAmount,
      dailyAdWatched: user.dailyAdWatched,
      lastAdWatchDate: user.lastAdWatchDate,
      gamesPlayed: user.gamesPlayed,
      lastGameDate: user.lastGameDate,
      videoWatchRewardClaimed: user.videoWatchRewardClaimed,
      createdAt: user.createdAt,
      updatedAt: user.updatedAt
    };
    
    return NextResponse.json<ApiResponse>({
      success: true,
      message: 'Login successful',
      data: {
        user: userData,
        token
      }
    }, { status: 200 });
    
  } catch (error: any) {
    console.error('Login error:', error);
    return NextResponse.json<ApiResponse>({
      success: false,
      message: 'Internal server error',
      error: error.message
    }, { status: 500 });
  }
}

// GET method to verify token
export async function GET(request: NextRequest) {
  try {
    const authHeader = request.headers.get('authorization');
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json<ApiResponse>({
        success: false,
        message: 'No token provided'
      }, { status: 401 });
    }
    
    const token = authHeader.substring(7);
    
    // Import here to avoid circular dependency
    const { authenticate } = await import('@/middleware/auth');
    const { user, error } = await authenticate(request);
    
    if (error) {
      return NextResponse.json<ApiResponse>({
        success: false,
        message: error
      }, { status: 401 });
    }
    
    return NextResponse.json<ApiResponse>({
      success: true,
      message: 'Token is valid',
      data: { user }
    }, { status: 200 });
    
  } catch (error: any) {
    console.error('Token verification error:', error);
    return NextResponse.json<ApiResponse>({
      success: false,
      message: 'Token verification failed',
      error: error.message
    }, { status: 401 });
  }
}
