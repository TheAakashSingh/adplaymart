import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import { authenticate } from '@/middleware/auth';
import { getEarningSummary } from '@/utils/mlm';
import { Transaction } from '@/models';
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
    
    const { searchParams } = new URL(request.url);
    const period = searchParams.get('period') || 'all'; // all, today, week, month
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '20');
    const skip = (page - 1) * limit;
    
    // Get earning summary
    const summary = await getEarningSummary(user.userId);
    
    // Build date filter based on period
    let dateFilter = {};
    const now = new Date();
    
    switch (period) {
      case 'today':
        const startOfDay = new Date(now);
        startOfDay.setHours(0, 0, 0, 0);
        const endOfDay = new Date(now);
        endOfDay.setHours(23, 59, 59, 999);
        dateFilter = { createdAt: { $gte: startOfDay, $lte: endOfDay } };
        break;
        
      case 'week':
        const startOfWeek = new Date(now);
        startOfWeek.setDate(now.getDate() - 7);
        dateFilter = { createdAt: { $gte: startOfWeek } };
        break;
        
      case 'month':
        const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
        dateFilter = { createdAt: { $gte: startOfMonth } };
        break;
        
      default:
        // No date filter for 'all'
        break;
    }
    
    // Get recent transactions
    const transactions = await Transaction.find({
      userId: user.userId,
      status: 'completed',
      ...dateFilter
    })
    .sort({ createdAt: -1 })
    .skip(skip)
    .limit(limit);
    
    const totalTransactions = await Transaction.countDocuments({
      userId: user.userId,
      status: 'completed',
      ...dateFilter
    });
    
    // Get period-specific earnings
    let periodEarnings = 0;
    if (period !== 'all') {
      const periodTransactions = await Transaction.find({
        userId: user.userId,
        status: 'completed',
        type: { $in: ['referral_bonus', 'level_income', 'game_reward', 'ad_reward', 'video_reward'] },
        ...dateFilter
      });
      
      periodEarnings = periodTransactions.reduce((sum, tx) => sum + tx.amount, 0);
    }
    
    // Get daily earnings for the last 7 days (for chart)
    const last7Days = [];
    for (let i = 6; i >= 0; i--) {
      const date = new Date(now);
      date.setDate(date.getDate() - i);
      date.setHours(0, 0, 0, 0);
      
      const nextDate = new Date(date);
      nextDate.setDate(nextDate.getDate() + 1);
      
      const dayEarnings = await Transaction.aggregate([
        {
          $match: {
            userId: user.userId,
            status: 'completed',
            type: { $in: ['referral_bonus', 'level_income', 'game_reward', 'ad_reward', 'video_reward'] },
            createdAt: { $gte: date, $lt: nextDate }
          }
        },
        {
          $group: {
            _id: null,
            total: { $sum: '$amount' }
          }
        }
      ]);
      
      last7Days.push({
        date: date.toISOString().split('T')[0],
        earnings: dayEarnings[0]?.total || 0
      });
    }
    
    return NextResponse.json<ApiResponse>({
      success: true,
      message: 'Earnings data fetched successfully',
      data: {
        summary,
        periodEarnings,
        transactions,
        dailyChart: last7Days,
        pagination: {
          page,
          limit,
          total: totalTransactions,
          pages: Math.ceil(totalTransactions / limit)
        }
      }
    }, { status: 200 });
    
  } catch (error: any) {
    console.error('Error fetching earnings:', error);
    return NextResponse.json<ApiResponse>({
      success: false,
      message: 'Internal server error',
      error: error.message
    }, { status: 500 });
  }
}
