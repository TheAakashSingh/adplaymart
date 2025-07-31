import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import { User, Package, Transaction } from '@/models';
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
    const currentUser = await User.findById(user.userId).populate('currentPackage');
    if (!currentUser) {
      return NextResponse.json<ApiResponse>({
        success: false,
        message: 'User not found'
      }, { status: 404 });
    }

    // Get all transactions for the user
    const allTransactions = await Transaction.find({ 
      userId: user.userId,
      status: 'completed'
    }).sort({ createdAt: -1 });

    // Calculate earnings by type
    const earningsByType = {
      daily_income: 0,
      level_income: 0,
      referral_bonus: 0,
      video_reward: 0,
      game_reward: 0,
      ad_reward: 0,
      welcome_bonus: 0
    };

    allTransactions.forEach(tx => {
      if (earningsByType.hasOwnProperty(tx.type)) {
        earningsByType[tx.type as keyof typeof earningsByType] += tx.amount;
      }
    });

    // Calculate monthly earnings for the last 12 months
    const monthlyEarnings = [];
    const now = new Date();
    
    for (let i = 11; i >= 0; i--) {
      const monthStart = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const monthEnd = new Date(now.getFullYear(), now.getMonth() - i + 1, 0, 23, 59, 59);
      
      const monthTransactions = allTransactions.filter(tx => 
        tx.createdAt >= monthStart && tx.createdAt <= monthEnd
      );
      
      const monthTotal = monthTransactions.reduce((sum, tx) => sum + tx.amount, 0);
      
      monthlyEarnings.push({
        month: monthStart.toLocaleDateString('en-US', { month: 'short', year: 'numeric' }),
        amount: monthTotal,
        transactions: monthTransactions.length
      });
    }

    // Calculate daily earnings for the last 30 days
    const dailyEarnings = [];
    
    for (let i = 29; i >= 0; i--) {
      const dayStart = new Date();
      dayStart.setDate(dayStart.getDate() - i);
      dayStart.setHours(0, 0, 0, 0);
      
      const dayEnd = new Date(dayStart);
      dayEnd.setHours(23, 59, 59, 999);
      
      const dayTransactions = allTransactions.filter(tx => 
        tx.createdAt >= dayStart && tx.createdAt <= dayEnd
      );
      
      const dayTotal = dayTransactions.reduce((sum, tx) => sum + tx.amount, 0);
      
      dailyEarnings.push({
        date: dayStart.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
        amount: dayTotal,
        transactions: dayTransactions.length
      });
    }

    // Calculate ROI if user has active package
    let roiData = null;
    if (currentUser.currentPackage && currentUser.packageActivatedAt) {
      const package_ = currentUser.currentPackage as any;
      const daysSinceActivation = Math.floor((Date.now() - currentUser.packageActivatedAt.getTime()) / (1000 * 60 * 60 * 24));
      
      // Get earnings since package activation
      const packageEarnings = allTransactions.filter(tx => 
        tx.createdAt >= currentUser.packageActivatedAt!
      );
      
      const totalEarnedFromPackage = packageEarnings.reduce((sum, tx) => sum + tx.amount, 0);
      const investmentAmount = currentUser.investmentAmount || package_.price;
      const roiPercentage = investmentAmount > 0 ? ((totalEarnedFromPackage / investmentAmount) * 100) : 0;
      
      roiData = {
        packageName: package_.name,
        investmentAmount,
        totalEarned: totalEarnedFromPackage,
        roiPercentage: Math.round(roiPercentage * 100) / 100,
        daysActive: daysSinceActivation,
        daysRemaining: Math.max(0, package_.validity - daysSinceActivation),
        dailyAverage: daysSinceActivation > 0 ? Math.round((totalEarnedFromPackage / daysSinceActivation) * 100) / 100 : 0,
        projectedTotal: package_.dailyIncome * package_.validity,
        projectedROI: Math.round(((package_.dailyIncome * package_.validity - package_.price) / package_.price) * 100)
      };
    }

    // Get referral earnings
    const referralData = {
      totalReferrals: currentUser.totalReferrals,
      directReferrals: currentUser.directReferrals.length,
      referralEarnings: earningsByType.referral_bonus + earningsByType.level_income,
      averagePerReferral: currentUser.totalReferrals > 0 ? 
        Math.round(((earningsByType.referral_bonus + earningsByType.level_income) / currentUser.totalReferrals) * 100) / 100 : 0
    };

    // Calculate today's earnings
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const todayTransactions = allTransactions.filter(tx => tx.createdAt >= today);
    const todayEarnings = todayTransactions.reduce((sum, tx) => sum + tx.amount, 0);

    // Calculate this month's earnings
    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
    const thisMonthTransactions = allTransactions.filter(tx => tx.createdAt >= monthStart);
    const thisMonthEarnings = thisMonthTransactions.reduce((sum, tx) => sum + tx.amount, 0);

    const report = {
      summary: {
        totalEarnings: currentUser.totalEarnings,
        todayEarnings,
        thisMonthEarnings,
        totalTransactions: allTransactions.length,
        walletBalance: {
          upgrade: currentUser.wallets?.upgrade || 0,
          withdrawal: currentUser.wallets?.withdrawal || 0,
          total: (currentUser.wallets?.upgrade || 0) + (currentUser.wallets?.withdrawal || 0)
        }
      },
      earningsByType,
      monthlyEarnings,
      dailyEarnings,
      roiData,
      referralData,
      recentTransactions: allTransactions.slice(0, 10).map(tx => ({
        type: tx.type,
        amount: tx.amount,
        description: tx.description,
        date: tx.createdAt,
        status: tx.status
      }))
    };

    return NextResponse.json<ApiResponse>({
      success: true,
      message: 'Earnings report generated successfully',
      data: report
    }, { status: 200 });
    
  } catch (error: any) {
    console.error('Error generating earnings report:', error);
    return NextResponse.json<ApiResponse>({
      success: false,
      message: 'Internal server error',
      error: error.message
    }, { status: 500 });
  }
}
