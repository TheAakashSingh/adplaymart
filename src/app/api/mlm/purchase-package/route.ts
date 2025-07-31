import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import { User, Package, Transaction } from '@/models';
import { authenticate } from '@/middleware/auth';
import { calculateLevelIncome, distributeLevelIncome } from '@/utils/mlm';
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
    const { packageId, paymentMethod } = body;
    
    // Validation
    if (!packageId) {
      return NextResponse.json<ApiResponse>({
        success: false,
        message: 'Package ID is required'
      }, { status: 400 });
    }
    
    // Get package details - try by ID first, then by name
    let package_;
    try {
      // Try to find by MongoDB ObjectId first
      package_ = await Package.findById(packageId);
    } catch (error) {
      // If ObjectId cast fails, try to find by name
      package_ = await Package.findOne({ name: packageId });
    }

    // If still not found, try finding by a custom identifier
    if (!package_) {
      // Map common package identifiers to names
      const packageNameMap: { [key: string]: string } = {
        'starter': 'Starter Package',
        'basic': 'Basic Package',
        'growth': 'Growth Package',
        'premium': 'Premium Package',
        'vip': 'VIP Package',
        'elite': 'Elite Package',
        'diamond': 'Diamond Package',
        'platinum': 'Platinum Package'
      };

      const packageName = packageNameMap[packageId.toLowerCase()];
      if (packageName) {
        package_ = await Package.findOne({ name: packageName });
      }
    }

    if (!package_ || !package_.isActive) {
      return NextResponse.json<ApiResponse>({
        success: false,
        message: 'Package not found or inactive'
      }, { status: 404 });
    }
    
    // Get user details
    const currentUser = await User.findById(user.userId);
    if (!currentUser) {
      return NextResponse.json<ApiResponse>({
        success: false,
        message: 'User not found'
      }, { status: 404 });
    }
    
    // Check if user has sufficient balance (if paying from wallet)
    if (paymentMethod === 'wallet') {
      if ((currentUser.wallets?.upgrade || 0) < package_.price) {
        return NextResponse.json<ApiResponse>({
          success: false,
          message: 'Insufficient balance in upgrade wallet'
        }, { status: 400 });
      }
    }
    
    // Create purchase transaction
    const purchaseTransaction = new Transaction({
      userId: currentUser._id,
      type: 'purchase',
      amount: package_.price,
      status: paymentMethod === 'wallet' ? 'completed' : 'pending',
      description: `Package purchase: ${package_.name}`,
      paymentMethod,
      netAmount: package_.price
    });
    
    await purchaseTransaction.save();
    
    // If paying from wallet, deduct amount and activate package immediately
    if (paymentMethod === 'wallet') {
      if (!currentUser.wallets) {
        currentUser.wallets = { upgrade: 0, withdrawal: 0 };
      }
      currentUser.wallets.upgrade -= package_.price;
      currentUser.currentPackage = package_._id;
      currentUser.packageActivatedAt = new Date();
      currentUser.investmentAmount += package_.price;
      await currentUser.save();
      
      // Calculate and distribute level income
      try {
        const levelIncomes = await calculateLevelIncome(
          currentUser._id.toString(),
          package_.price,
          package_._id.toString()
        );
        
        if (levelIncomes.length > 0) {
          await distributeLevelIncome(levelIncomes);
        }
      } catch (levelIncomeError) {
        console.error('Error distributing level income:', levelIncomeError);
        // Don't fail the purchase if level income distribution fails
      }
      
      return NextResponse.json<ApiResponse>({
        success: true,
        message: 'Package purchased successfully!',
        data: {
          transaction: purchaseTransaction,
          package: package_,
          user: {
            wallets: currentUser.wallets,
            currentPackage: currentUser.currentPackage,
            packageActivatedAt: currentUser.packageActivatedAt
          }
        }
      }, { status: 200 });
    }
    
    // For online payment, return payment details
    return NextResponse.json<ApiResponse>({
      success: true,
      message: 'Package purchase initiated. Complete payment to activate.',
      data: {
        transaction: purchaseTransaction,
        package: package_,
        paymentRequired: true
      }
    }, { status: 200 });
    
  } catch (error: any) {
    console.error('Package purchase error:', error);
    return NextResponse.json<ApiResponse>({
      success: false,
      message: 'Internal server error',
      error: error.message
    }, { status: 500 });
  }
}

// GET method to fetch available packages
export async function GET(request: NextRequest) {
  try {
    await connectDB();
    
    const packages = await Package.find({ isActive: true }).sort({ price: 1 });
    
    return NextResponse.json<ApiResponse>({
      success: true,
      message: 'Packages fetched successfully',
      data: { packages }
    }, { status: 200 });
    
  } catch (error: any) {
    console.error('Error fetching packages:', error);
    return NextResponse.json<ApiResponse>({
      success: false,
      message: 'Internal server error',
      error: error.message
    }, { status: 500 });
  }
}
