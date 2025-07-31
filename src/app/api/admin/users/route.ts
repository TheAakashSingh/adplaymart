import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import { User, Transaction } from '@/models';
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
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '20');
    const search = searchParams.get('search');
    const role = searchParams.get('role');
    const status = searchParams.get('status');
    const packageFilter = searchParams.get('package');
    
    const skip = (page - 1) * limit;
    
    // Build query
    let query: any = {};
    
    if (search) {
      query.$or = [
        { username: { $regex: search, $options: 'i' } },
        { email: { $regex: search, $options: 'i' } },
        { phone: { $regex: search, $options: 'i' } },
        { referralCode: { $regex: search, $options: 'i' } }
      ];
    }
    
    if (role && role !== 'all') {
      query.role = role;
    }
    
    if (status === 'active') {
      query.isActive = true;
    } else if (status === 'inactive') {
      query.isActive = false;
    }
    
    if (packageFilter === 'active') {
      query.currentPackage = { $ne: null };
    } else if (packageFilter === 'none') {
      query.currentPackage = null;
    }
    
    const users = await User.find(query)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .populate('currentPackage', 'name price')
      .populate('referredBy', 'username email')
      .select('-password');
    
    const total = await User.countDocuments(query);
    
    // Get user statistics
    const userStats = await User.aggregate([
      {
        $group: {
          _id: '$role',
          count: { $sum: 1 },
          activeCount: {
            $sum: { $cond: [{ $eq: ['$isActive', true] }, 1, 0] }
          }
        }
      }
    ]);
    
    return NextResponse.json<ApiResponse>({
      success: true,
      message: 'Users fetched successfully',
      data: {
        users,
        pagination: {
          page,
          limit,
          total,
          pages: Math.ceil(total / limit)
        },
        statistics: userStats
      }
    }, { status: 200 });
    
  } catch (error: any) {
    console.error('Error fetching users:', error);
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
    const { userId, action, data } = body;
    
    if (!userId || !action) {
      return NextResponse.json<ApiResponse>({
        success: false,
        message: 'User ID and action are required'
      }, { status: 400 });
    }
    
    const targetUser = await User.findById(userId);
    if (!targetUser) {
      return NextResponse.json<ApiResponse>({
        success: false,
        message: 'User not found'
      }, { status: 404 });
    }
    
    let updateData: any = {};
    let message = '';
    
    switch (action) {
      case 'activate':
        updateData.isActive = true;
        message = 'User activated successfully';
        break;
        
      case 'deactivate':
        updateData.isActive = false;
        message = 'User deactivated successfully';
        break;
        
      case 'changeRole':
        if (!data.role || !['user', 'vendor', 'admin'].includes(data.role)) {
          return NextResponse.json<ApiResponse>({
            success: false,
            message: 'Valid role is required'
          }, { status: 400 });
        }
        updateData.role = data.role;
        message = `User role changed to ${data.role}`;
        break;
        
      case 'updateWallet':
        if (!data.walletType || !['upgrade', 'withdrawal'].includes(data.walletType)) {
          return NextResponse.json<ApiResponse>({
            success: false,
            message: 'Valid wallet type is required'
          }, { status: 400 });
        }
        if (typeof data.amount !== 'number') {
          return NextResponse.json<ApiResponse>({
            success: false,
            message: 'Valid amount is required'
          }, { status: 400 });
        }
        
        updateData[`wallets.${data.walletType}`] = data.amount;
        message = `${data.walletType} wallet updated successfully`;
        
        // Create transaction record
        const transaction = new Transaction({
          userId: targetUser._id,
          type: 'admin_adjustment',
          amount: data.amount - targetUser.wallets[data.walletType],
          description: `Admin wallet adjustment - ${data.walletType} wallet`,
          status: 'completed'
        });
        await transaction.save();
        break;
        
      case 'resetPassword':
        if (!data.newPassword || data.newPassword.length < 6) {
          return NextResponse.json<ApiResponse>({
            success: false,
            message: 'Password must be at least 6 characters long'
          }, { status: 400 });
        }
        
        const bcrypt = require('bcryptjs');
        updateData.password = await bcrypt.hash(data.newPassword, 12);
        message = 'Password reset successfully';
        break;
        
      case 'updateProfile':
        if (data.username) updateData.username = data.username;
        if (data.email) updateData.email = data.email;
        if (data.phone) updateData.phone = data.phone;
        message = 'Profile updated successfully';
        break;
        
      default:
        return NextResponse.json<ApiResponse>({
          success: false,
          message: 'Invalid action'
        }, { status: 400 });
    }
    
    const updatedUser = await User.findByIdAndUpdate(
      userId,
      updateData,
      { new: true }
    ).populate('currentPackage', 'name price').select('-password');
    
    return NextResponse.json<ApiResponse>({
      success: true,
      message,
      data: { user: updatedUser }
    }, { status: 200 });
    
  } catch (error: any) {
    console.error('Error updating user:', error);
    return NextResponse.json<ApiResponse>({
      success: false,
      message: 'Internal server error',
      error: error.message
    }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest) {
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
    const userId = searchParams.get('userId');
    
    if (!userId) {
      return NextResponse.json<ApiResponse>({
        success: false,
        message: 'User ID is required'
      }, { status: 400 });
    }
    
    const targetUser = await User.findById(userId);
    if (!targetUser) {
      return NextResponse.json<ApiResponse>({
        success: false,
        message: 'User not found'
      }, { status: 404 });
    }
    
    // Prevent deleting admin users
    if (targetUser.role === 'admin') {
      return NextResponse.json<ApiResponse>({
        success: false,
        message: 'Cannot delete admin users'
      }, { status: 403 });
    }
    
    // Soft delete - just deactivate the user
    await User.findByIdAndUpdate(userId, { 
      isActive: false,
      deletedAt: new Date()
    });
    
    return NextResponse.json<ApiResponse>({
      success: true,
      message: 'User deleted successfully'
    }, { status: 200 });
    
  } catch (error: any) {
    console.error('Error deleting user:', error);
    return NextResponse.json<ApiResponse>({
      success: false,
      message: 'Internal server error',
      error: error.message
    }, { status: 500 });
  }
}
