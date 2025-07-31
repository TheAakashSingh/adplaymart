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
    const currentUser = await User.findById(user.userId)
      .populate('currentPackage', 'name price dailyIncome')
      .select('wallets gaming currentPackage');
    
    if (!currentUser) {
      return NextResponse.json<ApiResponse>({
        success: false,
        message: 'User not found'
      }, { status: 404 });
    }
    
    // Get recent transactions
    const recentTransactions = await Transaction.find({ userId: user.userId })
      .sort({ createdAt: -1 })
      .limit(10)
      .select('type amount description status createdAt');
    
    // Get today's earnings
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);
    
    const todayEarnings = await Transaction.aggregate([
      {
        $match: {
          userId: user.userId,
          type: { $in: ['video_reward', 'ad_reward', 'gaming_reward', 'level_income', 'referral_bonus'] },
          status: 'completed',
          createdAt: { $gte: today, $lt: tomorrow }
        }
      },
      {
        $group: {
          _id: '$type',
          total: { $sum: '$amount' },
          count: { $sum: 1 }
        }
      }
    ]);
    
    // Get this month's earnings
    const thisMonth = new Date(today.getFullYear(), today.getMonth(), 1);
    const monthlyEarnings = await Transaction.aggregate([
      {
        $match: {
          userId: user.userId,
          type: { $in: ['video_reward', 'ad_reward', 'gaming_reward', 'level_income', 'referral_bonus'] },
          status: 'completed',
          createdAt: { $gte: thisMonth }
        }
      },
      {
        $group: {
          _id: null,
          total: { $sum: '$amount' }
        }
      }
    ]);
    
    // Get withdrawal settings
    const withdrawalSettings = await AdminSettings.findOne({ key: 'withdrawal_settings' });
    const settings = withdrawalSettings?.value || {
      minWithdrawal: 100,
      maxWithdrawal: 50000,
      processingFee: 10,
      tdsPercentage: 5
    };
    
    return NextResponse.json<ApiResponse>({
      success: true,
      message: 'Wallet details fetched successfully',
      data: {
        wallets: currentUser.wallets,
        currentPackage: currentUser.currentPackage,
        gaming: currentUser.gaming,
        todayEarnings,
        monthlyEarnings: monthlyEarnings[0]?.total || 0,
        recentTransactions,
        withdrawalSettings: settings
      }
    }, { status: 200 });
    
  } catch (error: any) {
    console.error('Error fetching wallet details:', error);
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
    const { action, amount, fromWallet, toWallet } = body;
    
    // Get user details
    const currentUser = await User.findById(user.userId);
    if (!currentUser) {
      return NextResponse.json<ApiResponse>({
        success: false,
        message: 'User not found'
      }, { status: 404 });
    }
    
    if (action === 'transfer') {
      // Validation
      if (!amount || amount <= 0) {
        return NextResponse.json<ApiResponse>({
          success: false,
          message: 'Valid amount is required'
        }, { status: 400 });
      }
      
      if (!fromWallet || !toWallet || !['upgrade', 'withdrawal'].includes(fromWallet) || !['upgrade', 'withdrawal'].includes(toWallet)) {
        return NextResponse.json<ApiResponse>({
          success: false,
          message: 'Valid wallet types are required'
        }, { status: 400 });
      }
      
      if (fromWallet === toWallet) {
        return NextResponse.json<ApiResponse>({
          success: false,
          message: 'Cannot transfer to the same wallet'
        }, { status: 400 });
      }
      
      // Check balance
      if (currentUser.wallets[fromWallet] < amount) {
        return NextResponse.json<ApiResponse>({
          success: false,
          message: `Insufficient balance in ${fromWallet} wallet`
        }, { status: 400 });
      }
      
      // Transfer funds
      currentUser.wallets[fromWallet] -= amount;
      currentUser.wallets[toWallet] += amount;
      await currentUser.save();
      
      // Create transaction record
      const transaction = new Transaction({
        userId: user.userId,
        type: 'wallet_transfer',
        amount: amount,
        description: `Wallet transfer from ${fromWallet} to ${toWallet}`,
        status: 'completed'
      });
      await transaction.save();
      
      return NextResponse.json<ApiResponse>({
        success: true,
        message: 'Wallet transfer completed successfully',
        data: {
          wallets: currentUser.wallets,
          transaction: {
            _id: transaction._id,
            amount: transaction.amount,
            description: transaction.description,
            createdAt: transaction.createdAt
          }
        }
      }, { status: 200 });
      
    } else if (action === 'add_funds') {
      // This would typically integrate with payment gateway
      // For demo purposes, we'll simulate adding funds
      
      if (!amount || amount <= 0) {
        return NextResponse.json<ApiResponse>({
          success: false,
          message: 'Valid amount is required'
        }, { status: 400 });
      }
      
      if (amount < 100 || amount > 50000) {
        return NextResponse.json<ApiResponse>({
          success: false,
          message: 'Amount must be between ₹100 and ₹50,000'
        }, { status: 400 });
      }
      
      // In production, this would create a payment order
      // For demo, we'll return payment details
      const orderId = `fund_${Date.now()}${Math.random().toString(36).substr(2, 4)}`;
      
      return NextResponse.json<ApiResponse>({
        success: true,
        message: 'Payment order created for adding funds',
        data: {
          orderId,
          amount,
          currency: 'INR',
          // In production, return actual payment gateway details
          paymentUrl: `/payment/add-funds?orderId=${orderId}&amount=${amount}`
        }
      }, { status: 200 });
    }
    
    return NextResponse.json<ApiResponse>({
      success: false,
      message: 'Invalid action'
    }, { status: 400 });
    
  } catch (error: any) {
    console.error('Wallet operation error:', error);
    return NextResponse.json<ApiResponse>({
      success: false,
      message: 'Internal server error',
      error: error.message
    }, { status: 500 });
  }
}
