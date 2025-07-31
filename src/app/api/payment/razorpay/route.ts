import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import { User, Transaction, Package } from '@/models';
import { authenticate } from '@/middleware/auth';
import { ApiResponse } from '@/types';
import { distributeMLMIncome } from '@/utils/mlm';

// Initialize Razorpay (you'll need to install razorpay package)
// const Razorpay = require('razorpay');
// const razorpay = new Razorpay({
//   key_id: process.env.RAZORPAY_KEY_ID,
//   key_secret: process.env.RAZORPAY_KEY_SECRET,
// });

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
    const { action, packageId, amount, currency = 'INR' } = body;
    
    if (action === 'create_order') {
      // Validation
      if (!packageId || !amount) {
        return NextResponse.json<ApiResponse>({
          success: false,
          message: 'Package ID and amount are required'
        }, { status: 400 });
      }
      
      // Get package details
      const packageData = await Package.findById(packageId);
      if (!packageData) {
        return NextResponse.json<ApiResponse>({
          success: false,
          message: 'Package not found'
        }, { status: 404 });
      }
      
      // Verify amount
      if (amount !== packageData.price) {
        return NextResponse.json<ApiResponse>({
          success: false,
          message: 'Amount mismatch'
        }, { status: 400 });
      }
      
      // For demo purposes, we'll simulate Razorpay order creation
      // In production, uncomment the Razorpay code above
      const orderId = `order_${Date.now()}${Math.random().toString(36).substr(2, 4)}`;
      
      // Create transaction record
      const transaction = new Transaction({
        userId: user.userId,
        type: 'package_purchase',
        amount: amount,
        description: `Package purchase - ${packageData.name}`,
        status: 'pending',
        paymentGateway: 'razorpay',
        gatewayOrderId: orderId,
        packageId: packageId
      });
      await transaction.save();
      
      return NextResponse.json<ApiResponse>({
        success: true,
        message: 'Payment order created successfully',
        data: {
          orderId,
          amount,
          currency,
          transactionId: transaction._id,
          // In production, return Razorpay order details
          razorpayOrderId: orderId,
          key: process.env.RAZORPAY_KEY_ID || 'demo_key'
        }
      }, { status: 200 });
      
    } else if (action === 'verify_payment') {
      const { razorpayOrderId, razorpayPaymentId, razorpaySignature, transactionId } = body;
      
      if (!razorpayOrderId || !razorpayPaymentId || !transactionId) {
        return NextResponse.json<ApiResponse>({
          success: false,
          message: 'Payment verification data is required'
        }, { status: 400 });
      }
      
      // Get transaction
      const transaction = await Transaction.findById(transactionId);
      if (!transaction) {
        return NextResponse.json<ApiResponse>({
          success: false,
          message: 'Transaction not found'
        }, { status: 404 });
      }
      
      // For demo purposes, we'll simulate successful payment
      // In production, verify the payment signature with Razorpay
      
      // Update transaction status
      transaction.status = 'completed';
      transaction.gatewayPaymentId = razorpayPaymentId;
      transaction.completedAt = new Date();
      await transaction.save();
      
      // Get user and package
      const currentUser = await User.findById(user.userId);
      const packageData = await Package.findById(transaction.packageId);
      
      if (!currentUser || !packageData) {
        return NextResponse.json<ApiResponse>({
          success: false,
          message: 'User or package not found'
        }, { status: 404 });
      }
      
      // Update user's package
      currentUser.currentPackage = packageData._id;
      currentUser.packagePurchaseDate = new Date();
      currentUser.wallets.upgrade += packageData.dailyIncome; // Add initial bonus
      await currentUser.save();
      
      // Distribute MLM income
      if (currentUser.referredBy) {
        await distributeMLMIncome(currentUser.referredBy, packageData.price, packageData._id);
      }
      
      return NextResponse.json<ApiResponse>({
        success: true,
        message: 'Payment verified and package activated successfully',
        data: {
          transaction: {
            _id: transaction._id,
            amount: transaction.amount,
            status: transaction.status,
            completedAt: transaction.completedAt
          },
          package: {
            name: packageData.name,
            price: packageData.price,
            dailyIncome: packageData.dailyIncome
          }
        }
      }, { status: 200 });
    }
    
    return NextResponse.json<ApiResponse>({
      success: false,
      message: 'Invalid action'
    }, { status: 400 });
    
  } catch (error: any) {
    console.error('Razorpay payment error:', error);
    return NextResponse.json<ApiResponse>({
      success: false,
      message: 'Internal server error',
      error: error.message
    }, { status: 500 });
  }
}

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
    const transactionId = searchParams.get('transactionId');
    
    if (!transactionId) {
      return NextResponse.json<ApiResponse>({
        success: false,
        message: 'Transaction ID is required'
      }, { status: 400 });
    }
    
    const transaction = await Transaction.findById(transactionId)
      .populate('packageId', 'name price')
      .populate('userId', 'username email');
    
    if (!transaction) {
      return NextResponse.json<ApiResponse>({
        success: false,
        message: 'Transaction not found'
      }, { status: 404 });
    }
    
    // Check if user owns this transaction
    if (transaction.userId._id.toString() !== user.userId) {
      return NextResponse.json<ApiResponse>({
        success: false,
        message: 'Unauthorized access to transaction'
      }, { status: 403 });
    }
    
    return NextResponse.json<ApiResponse>({
      success: true,
      message: 'Transaction details fetched successfully',
      data: { transaction }
    }, { status: 200 });
    
  } catch (error: any) {
    console.error('Error fetching transaction:', error);
    return NextResponse.json<ApiResponse>({
      success: false,
      message: 'Internal server error',
      error: error.message
    }, { status: 500 });
  }
}
