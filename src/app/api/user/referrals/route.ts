import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import { User } from '@/models';
import { authenticate } from '@/middleware/auth';
import { ApiResponse } from '@/types';
import { getReferralTree } from '@/utils/mlm';

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
    
    const { searchParams } = new URL(request.url);
    const depth = parseInt(searchParams.get('depth') || '3');
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '20');
    
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
    
    // Get referral tree
    const referralTree = await getReferralTree(user.userId, depth);
    
    // Get direct referrals with pagination
    const skip = (page - 1) * limit;
    const directReferrals = await User.find({ 
      referredBy: userObjectId 
    })
    .select('username email level totalEarnings currentPackage createdAt')
    .populate('currentPackage', 'name price')
    .sort({ createdAt: -1 })
    .skip(skip)
    .limit(limit);
    
    // Get total count for pagination
    const totalDirectReferrals = await User.countDocuments({ 
      referredBy: userObjectId 
    });
    
    // Get referral statistics
    const referralStats = {
      totalDirectReferrals,
      totalTeamMembers: currentUser.teamMembers?.length || 0,
      activeReferrals: await User.countDocuments({ 
        referredBy: userObjectId,
        isActive: true 
      }),
      totalPages: Math.ceil(totalDirectReferrals / limit),
      currentPage: page
    };
    
    return NextResponse.json<ApiResponse>({
      success: true,
      message: 'Referrals fetched successfully',
      data: {
        referralTree,
        directReferrals,
        stats: referralStats,
        referralCode: currentUser.referralCode,
        referralLink: `${process.env.NEXT_PUBLIC_APP_URL}/auth/register?ref=${currentUser.referralCode}`
      }
    }, { status: 200 });
    
  } catch (error: any) {
    console.error('Error fetching referrals:', error);
    return NextResponse.json<ApiResponse>({
      success: false,
      message: 'Internal server error',
      error: error.message
    }, { status: 500 });
  }
}
