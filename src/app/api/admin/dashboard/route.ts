import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import { User, Product, Order, Transaction, Vendor, Package } from '@/models';
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
    
    // Get date ranges
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);
    const thisMonth = new Date(today.getFullYear(), today.getMonth(), 1);
    const lastMonth = new Date(today.getFullYear(), today.getMonth() - 1, 1);
    const thisYear = new Date(today.getFullYear(), 0, 1);
    
    // User Statistics
    const totalUsers = await User.countDocuments();
    const activeUsers = await User.countDocuments({ 
      currentPackage: { $ne: null },
      isActive: true 
    });
    const newUsersToday = await User.countDocuments({
      createdAt: { $gte: today }
    });
    const newUsersThisMonth = await User.countDocuments({
      createdAt: { $gte: thisMonth }
    });
    
    // Vendor Statistics
    const totalVendors = await Vendor.countDocuments();
    const verifiedVendors = await Vendor.countDocuments({ 
      verificationStatus: 'verified',
      isActive: true 
    });
    const pendingVendors = await Vendor.countDocuments({ 
      verificationStatus: 'pending' 
    });
    
    // Product Statistics
    const totalProducts = await Product.countDocuments();
    const activeProducts = await Product.countDocuments({ isActive: true });
    const outOfStockProducts = await Product.countDocuments({ 
      stock: 0,
      isActive: true 
    });
    
    // Order Statistics
    const totalOrders = await Order.countDocuments();
    const ordersToday = await Order.countDocuments({
      createdAt: { $gte: today }
    });
    const ordersThisMonth = await Order.countDocuments({
      createdAt: { $gte: thisMonth }
    });
    const pendingOrders = await Order.countDocuments({ 
      status: { $in: ['pending', 'confirmed'] }
    });
    
    // Revenue Statistics
    const revenueToday = await Order.aggregate([
      { $match: { createdAt: { $gte: today }, paymentStatus: 'paid' } },
      { $group: { _id: null, total: { $sum: '$total' } } }
    ]);
    
    const revenueThisMonth = await Order.aggregate([
      { $match: { createdAt: { $gte: thisMonth }, paymentStatus: 'paid' } },
      { $group: { _id: null, total: { $sum: '$total' } } }
    ]);
    
    const revenueThisYear = await Order.aggregate([
      { $match: { createdAt: { $gte: thisYear }, paymentStatus: 'paid' } },
      { $group: { _id: null, total: { $sum: '$total' } } }
    ]);
    
    // Package Statistics
    const packageStats = await Package.aggregate([
      {
        $lookup: {
          from: 'users',
          localField: '_id',
          foreignField: 'currentPackage',
          as: 'users'
        }
      },
      {
        $project: {
          name: 1,
          price: 1,
          userCount: { $size: '$users' },
          revenue: { $multiply: ['$price', { $size: '$users' }] }
        }
      }
    ]);
    
    // Transaction Statistics
    const transactionStats = await Transaction.aggregate([
      {
        $match: {
          createdAt: { $gte: thisMonth },
          status: 'completed'
        }
      },
      {
        $group: {
          _id: '$type',
          count: { $sum: 1 },
          totalAmount: { $sum: '$amount' }
        }
      }
    ]);
    
    // Gaming Statistics
    const gamingStats = await Transaction.aggregate([
      {
        $match: {
          type: { $in: ['video_reward', 'ad_reward', 'gaming_reward', 'daily_login'] },
          createdAt: { $gte: thisMonth },
          status: 'completed'
        }
      },
      {
        $group: {
          _id: '$type',
          count: { $sum: 1 },
          totalRewards: { $sum: '$amount' }
        }
      }
    ]);
    
    // MLM Statistics
    const mlmStats = await Transaction.aggregate([
      {
        $match: {
          type: { $in: ['level_income', 'referral_bonus', 'package_purchase'] },
          createdAt: { $gte: thisMonth },
          status: 'completed'
        }
      },
      {
        $group: {
          _id: '$type',
          count: { $sum: 1 },
          totalAmount: { $sum: '$amount' }
        }
      }
    ]);
    
    // Recent Activities
    const recentUsers = await User.find()
      .sort({ createdAt: -1 })
      .limit(5)
      .select('username email createdAt currentPackage');
    
    const recentOrders = await Order.find()
      .sort({ createdAt: -1 })
      .limit(5)
      .populate('userId', 'username email')
      .select('orderId total status createdAt userId');
    
    const recentTransactions = await Transaction.find()
      .sort({ createdAt: -1 })
      .limit(10)
      .populate('userId', 'username email')
      .select('type amount description status createdAt userId');
    
    // Growth Analytics
    const userGrowth = await User.aggregate([
      {
        $match: {
          createdAt: { $gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) }
        }
      },
      {
        $group: {
          _id: {
            $dateToString: { format: '%Y-%m-%d', date: '$createdAt' }
          },
          count: { $sum: 1 }
        }
      },
      { $sort: { _id: 1 } }
    ]);
    
    const revenueGrowth = await Order.aggregate([
      {
        $match: {
          createdAt: { $gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) },
          paymentStatus: 'paid'
        }
      },
      {
        $group: {
          _id: {
            $dateToString: { format: '%Y-%m-%d', date: '$createdAt' }
          },
          revenue: { $sum: '$total' },
          orders: { $sum: 1 }
        }
      },
      { $sort: { _id: 1 } }
    ]);
    
    return NextResponse.json<ApiResponse>({
      success: true,
      message: 'Admin dashboard data fetched successfully',
      data: {
        overview: {
          users: {
            total: totalUsers,
            active: activeUsers,
            newToday: newUsersToday,
            newThisMonth: newUsersThisMonth
          },
          vendors: {
            total: totalVendors,
            verified: verifiedVendors,
            pending: pendingVendors
          },
          products: {
            total: totalProducts,
            active: activeProducts,
            outOfStock: outOfStockProducts
          },
          orders: {
            total: totalOrders,
            today: ordersToday,
            thisMonth: ordersThisMonth,
            pending: pendingOrders
          },
          revenue: {
            today: revenueToday[0]?.total || 0,
            thisMonth: revenueThisMonth[0]?.total || 0,
            thisYear: revenueThisYear[0]?.total || 0
          }
        },
        analytics: {
          packages: packageStats,
          transactions: transactionStats,
          gaming: gamingStats,
          mlm: mlmStats,
          userGrowth,
          revenueGrowth
        },
        recent: {
          users: recentUsers,
          orders: recentOrders,
          transactions: recentTransactions
        }
      }
    }, { status: 200 });
    
  } catch (error: any) {
    console.error('Admin dashboard error:', error);
    return NextResponse.json<ApiResponse>({
      success: false,
      message: 'Internal server error',
      error: error.message
    }, { status: 500 });
  }
}
