import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import { User, WithdrawalRequest, Transaction } from '@/models';
import { authenticate } from '@/middleware/auth';
import { canWithdraw, calculateTDS } from '@/utils/mlm';
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
    const { amount, bankDetails } = body;
    
    // Validation
    if (!amount || amount <= 0) {
      return NextResponse.json<ApiResponse>({
        success: false,
        message: 'Valid withdrawal amount is required'
      }, { status: 400 });
    }
    
    if (!bankDetails || !bankDetails.accountNumber || !bankDetails.ifscCode || 
        !bankDetails.bankName || !bankDetails.accountHolderName) {
      return NextResponse.json<ApiResponse>({
        success: false,
        message: 'Complete bank details are required'
      }, { status: 400 });
    }
    
    // Check if user can withdraw
    const withdrawalCheck = await canWithdraw(user.userId, amount);
    if (!withdrawalCheck.canWithdraw) {
      return NextResponse.json<ApiResponse>({
        success: false,
        message: withdrawalCheck.reason
      }, { status: 400 });
    }
    
    // Calculate TDS
    const tdsCalculation = calculateTDS(amount);
    
    // Create withdrawal request
    const withdrawalRequest = new WithdrawalRequest({
      userId: user.userId,
      amount: tdsCalculation.grossAmount,
      tdsAmount: tdsCalculation.tdsAmount,
      netAmount: tdsCalculation.netAmount,
      bankDetails,
      status: 'pending'
    });
    
    await withdrawalRequest.save();
    
    // Deduct amount from user's withdrawal wallet (hold it)
    const mongoose = require('mongoose');
    const userObjectId = new mongoose.Types.ObjectId(user.userId);
    const currentUser = await User.findById(userObjectId);
    if (currentUser) {
      if (!currentUser.wallets) {
        currentUser.wallets = { upgrade: 0, withdrawal: 0 };
      }
      currentUser.wallets.withdrawal -= amount;
      await currentUser.save();
    }
    
    // Create transaction record
    const transaction = new Transaction({
      userId: userObjectId,
      type: 'withdrawal',
      amount: tdsCalculation.grossAmount,
      status: 'pending',
      description: `Withdrawal request - ${withdrawalRequest.requestId}`,
      tdsAmount: tdsCalculation.tdsAmount,
      netAmount: tdsCalculation.netAmount,
      referenceId: withdrawalRequest._id.toString()
    });
    
    await transaction.save();
    
    return NextResponse.json<ApiResponse>({
      success: true,
      message: 'Withdrawal request submitted successfully. It will be processed within 24-48 hours.',
      data: {
        withdrawalRequest: {
          _id: withdrawalRequest._id,
          requestId: withdrawalRequest.requestId,
          amount: withdrawalRequest.amount,
          tdsAmount: withdrawalRequest.tdsAmount,
          netAmount: withdrawalRequest.netAmount,
          status: withdrawalRequest.status,
          createdAt: withdrawalRequest.createdAt
        },
        transaction
      }
    }, { status: 201 });
    
  } catch (error: any) {
    console.error('Withdrawal request error:', error);
    return NextResponse.json<ApiResponse>({
      success: false,
      message: 'Internal server error',
      error: error.message
    }, { status: 500 });
  }
}

// GET method to fetch user's withdrawal requests
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
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '10');
    const skip = (page - 1) * limit;
    
    const withdrawalRequests = await WithdrawalRequest.find({ userId: user.userId })
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .populate('processedBy', 'username');
    
    const total = await WithdrawalRequest.countDocuments({ userId: user.userId });
    
    return NextResponse.json<ApiResponse>({
      success: true,
      message: 'Withdrawal requests fetched successfully',
      data: {
        withdrawalRequests,
        pagination: {
          page,
          limit,
          total,
          pages: Math.ceil(total / limit)
        }
      }
    }, { status: 200 });
    
  } catch (error: any) {
    console.error('Error fetching withdrawal requests:', error);
    return NextResponse.json<ApiResponse>({
      success: false,
      message: 'Internal server error',
      error: error.message
    }, { status: 500 });
  }
}
