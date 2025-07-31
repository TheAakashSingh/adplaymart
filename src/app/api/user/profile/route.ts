import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import { User } from '@/models';
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
    const currentUser = await User.findById(userObjectId)
      .populate('currentPackage', 'name price dailyIncome')
      .select('-password');
    
    if (!currentUser) {
      return NextResponse.json<ApiResponse>({
        success: false,
        message: 'User not found'
      }, { status: 404 });
    }
    
    // Get referral count
    const totalReferrals = await User.countDocuments({ referredBy: userObjectId });
    
    return NextResponse.json<ApiResponse>({
      success: true,
      message: 'User profile fetched successfully',
      data: {
        _id: currentUser._id,
        username: currentUser.username,
        email: currentUser.email,
        phone: currentUser.phone,
        role: currentUser.role,
        isActive: currentUser.isActive,
        profileImage: currentUser.profileImage,
        referralCode: currentUser.referralCode,
        level: currentUser.level,
        totalReferrals,
        wallets: currentUser.wallets,
        currentPackage: currentUser.currentPackage,
        gaming: currentUser.gaming,
        totalEarnings: currentUser.totalEarnings,
        createdAt: currentUser.createdAt
      }
    }, { status: 200 });
    
  } catch (error: any) {
    console.error('Error fetching user profile:', error);
    return NextResponse.json<ApiResponse>({
      success: false,
      message: 'Internal server error',
      error: error.message
    }, { status: 500 });
  }
}

export async function PUT(request: NextRequest) {
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
    const { username, phone, profileImage } = body;
    
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
    
    // Validation
    if (username && (username.length < 3 || username.length > 20)) {
      return NextResponse.json<ApiResponse>({
        success: false,
        message: 'Username must be between 3 and 20 characters'
      }, { status: 400 });
    }
    
    if (phone && !/^[0-9]{10}$/.test(phone)) {
      return NextResponse.json<ApiResponse>({
        success: false,
        message: 'Phone number must be 10 digits'
      }, { status: 400 });
    }
    
    // Check if username is already taken (if updating username)
    if (username) {
      const existingUser = await User.findOne({ 
        username, 
        _id: { $ne: userObjectId } 
      });
      if (existingUser) {
        return NextResponse.json<ApiResponse>({
          success: false,
          message: 'Username is already taken'
        }, { status: 400 });
      }
    }
    
    // Update user profile
    const updateData: any = {};
    if (username) updateData.username = username;
    if (phone) updateData.phone = phone;
    if (profileImage) updateData.profileImage = profileImage;
    
    const updatedUser = await User.findByIdAndUpdate(
      userObjectId,
      updateData,
      { new: true }
    ).populate('currentPackage', 'name price dailyIncome').select('-password');
    
    if (!updatedUser) {
      return NextResponse.json<ApiResponse>({
        success: false,
        message: 'User not found'
      }, { status: 404 });
    }
    
    return NextResponse.json<ApiResponse>({
      success: true,
      message: 'Profile updated successfully',
      data: {
        _id: updatedUser._id,
        username: updatedUser.username,
        email: updatedUser.email,
        phone: updatedUser.phone,
        role: updatedUser.role,
        profileImage: updatedUser.profileImage,
        referralCode: updatedUser.referralCode,
        level: updatedUser.level,
        wallets: updatedUser.wallets,
        currentPackage: updatedUser.currentPackage,
        gaming: updatedUser.gaming,
        totalEarnings: updatedUser.totalEarnings,
        createdAt: updatedUser.createdAt
      }
    }, { status: 200 });
    
  } catch (error: any) {
    console.error('Error updating user profile:', error);
    return NextResponse.json<ApiResponse>({
      success: false,
      message: 'Internal server error',
      error: error.message
    }, { status: 500 });
  }
}
