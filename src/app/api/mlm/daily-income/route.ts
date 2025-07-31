import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import { User, Package, Transaction } from '@/models';
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
    
    // Get user details
    const currentUser = await User.findById(user.userId).populate('currentPackage');
    if (!currentUser) {
      return NextResponse.json<ApiResponse>({
        success: false,
        message: 'User not found'
      }, { status: 404 });
    }

    // Check if user has an active package
    if (!currentUser.currentPackage) {
      return NextResponse.json<ApiResponse>({
        success: false,
        message: 'No active investment package found. Please purchase a package first.'
      }, { status: 400 });
    }

    const package_ = currentUser.currentPackage as any;
    
    // Check if package is still valid
    const packageActivatedAt = currentUser.packageActivatedAt;
    if (!packageActivatedAt) {
      return NextResponse.json<ApiResponse>({
        success: false,
        message: 'Package activation date not found'
      }, { status: 400 });
    }

    const daysSinceActivation = Math.floor((Date.now() - packageActivatedAt.getTime()) / (1000 * 60 * 60 * 24));
    
    if (daysSinceActivation >= package_.validity) {
      return NextResponse.json<ApiResponse>({
        success: false,
        message: 'Package validity has expired. Please purchase a new package.'
      }, { status: 400 });
    }

    // Check if daily income already claimed today
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    const todayIncome = await Transaction.findOne({
      userId: user.userId,
      type: 'daily_income',
      createdAt: { $gte: today }
    });

    if (todayIncome) {
      return NextResponse.json<ApiResponse>({
        success: false,
        message: 'Daily income already claimed for today. Come back tomorrow!'
      }, { status: 400 });
    }

    // Calculate daily income
    const dailyIncomeAmount = package_.dailyIncome;
    
    // Create transaction
    const transaction = new Transaction({
      userId: user.userId,
      type: 'daily_income',
      amount: dailyIncomeAmount,
      status: 'completed',
      description: `Daily income from ${package_.name}`,
      netAmount: dailyIncomeAmount
    });

    await transaction.save();

    // Update user's wallet
    if (!currentUser.wallets) {
      currentUser.wallets = { upgrade: 0, withdrawal: 0 };
    }
    currentUser.wallets.withdrawal += dailyIncomeAmount;
    currentUser.totalEarnings += dailyIncomeAmount;
    await currentUser.save();

    return NextResponse.json<ApiResponse>({
      success: true,
      message: `Daily income of ₹${dailyIncomeAmount} credited to your withdrawal wallet!`,
      data: {
        amount: dailyIncomeAmount,
        wallets: currentUser.wallets,
        totalEarnings: currentUser.totalEarnings,
        daysRemaining: package_.validity - daysSinceActivation - 1,
        nextClaimTime: new Date(Date.now() + 24 * 60 * 60 * 1000)
      }
    }, { status: 200 });
    
  } catch (error: any) {
    console.error('Daily income error:', error);
    return NextResponse.json<ApiResponse>({
      success: false,
      message: 'Internal server error',
      error: error.message
    }, { status: 500 });
  }
}

// GET method to check daily income status
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

    let dailyIncomeStatus = {
      hasActivePackage: false,
      canClaim: false,
      dailyAmount: 0,
      daysRemaining: 0,
      nextClaimTime: null,
      packageName: '',
      totalEarned: 0
    };

    if (currentUser.currentPackage) {
      const package_ = currentUser.currentPackage as any;
      const packageActivatedAt = currentUser.packageActivatedAt;
      
      if (packageActivatedAt) {
        const daysSinceActivation = Math.floor((Date.now() - packageActivatedAt.getTime()) / (1000 * 60 * 60 * 24));
        const daysRemaining = package_.validity - daysSinceActivation;
        
        dailyIncomeStatus.hasActivePackage = true;
        dailyIncomeStatus.packageName = package_.name;
        dailyIncomeStatus.dailyAmount = package_.dailyIncome;
        dailyIncomeStatus.daysRemaining = Math.max(0, daysRemaining);
        
        if (daysRemaining > 0) {
          // Check if already claimed today
          const today = new Date();
          today.setHours(0, 0, 0, 0);
          
          const todayIncome = await Transaction.findOne({
            userId: user.userId,
            type: 'daily_income',
            createdAt: { $gte: today }
          });

          dailyIncomeStatus.canClaim = !todayIncome;
          
          if (todayIncome) {
            const tomorrow = new Date(today);
            tomorrow.setDate(tomorrow.getDate() + 1);
            dailyIncomeStatus.nextClaimTime = tomorrow;
          }
        }
        
        // Calculate total earned from this package
        const packageEarnings = await Transaction.find({
          userId: user.userId,
          type: 'daily_income',
          createdAt: { $gte: packageActivatedAt }
        });
        
        dailyIncomeStatus.totalEarned = packageEarnings.reduce((sum, tx) => sum + tx.amount, 0);
      }
    }

    return NextResponse.json<ApiResponse>({
      success: true,
      message: 'Daily income status fetched successfully',
      data: dailyIncomeStatus
    }, { status: 200 });
    
  } catch (error: any) {
    console.error('Error fetching daily income status:', error);
    return NextResponse.json<ApiResponse>({
      success: false,
      message: 'Internal server error',
      error: error.message
    }, { status: 500 });
  }
}
