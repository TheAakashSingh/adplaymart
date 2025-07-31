import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import { User, Vendor } from '@/models';
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
    
    const body = await request.json();
    const {
      businessName,
      businessType,
      businessAddress,
      gstNumber,
      panNumber,
      bankDetails,
      businessDescription,
      businessCategory
    } = body;
    
    // Validation
    if (!businessName || !businessType || !businessAddress || !panNumber || !bankDetails) {
      return NextResponse.json<ApiResponse>({
        success: false,
        message: 'All required fields must be provided'
      }, { status: 400 });
    }
    
    // Check if user already has a vendor account
    const existingVendor = await Vendor.findOne({ userId: user.userId });
    if (existingVendor) {
      return NextResponse.json<ApiResponse>({
        success: false,
        message: 'You already have a vendor account'
      }, { status: 400 });
    }
    
    // Check if user has required package for vendor registration
    const currentUser = await User.findById(user.userId).populate('currentPackage');
    if (!currentUser || !currentUser.currentPackage) {
      return NextResponse.json<ApiResponse>({
        success: false,
        message: 'Active package required for vendor registration'
      }, { status: 400 });
    }
    
    // Check if package allows vendor registration
    const packageData = currentUser.currentPackage as any;
    if (packageData.price < 2000) { // Minimum Professional package required
      return NextResponse.json<ApiResponse>({
        success: false,
        message: 'Professional package or higher required for vendor registration'
      }, { status: 400 });
    }
    
    // Create vendor account
    const vendor = new Vendor({
      userId: user.userId,
      businessName,
      businessType,
      businessAddress,
      gstNumber,
      panNumber,
      bankDetails,
      businessDescription,
      businessCategory,
      verificationStatus: 'pending',
      isActive: false
    });
    
    await vendor.save();
    
    // Update user role to vendor
    await User.findByIdAndUpdate(user.userId, { role: 'vendor' });
    
    return NextResponse.json<ApiResponse>({
      success: true,
      message: 'Vendor registration submitted successfully. Your account will be verified within 24-48 hours.',
      data: {
        vendor: {
          _id: vendor._id,
          businessName: vendor.businessName,
          businessType: vendor.businessType,
          verificationStatus: vendor.verificationStatus,
          isActive: vendor.isActive,
          createdAt: vendor.createdAt
        }
      }
    }, { status: 201 });
    
  } catch (error: any) {
    console.error('Vendor registration error:', error);
    return NextResponse.json<ApiResponse>({
      success: false,
      message: 'Internal server error',
      error: error.message
    }, { status: 500 });
  }
}

// GET method to fetch vendor details
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
    
    const vendor = await Vendor.findOne({ userId: user.userId })
      .populate('userId', 'username email phone');
    
    if (!vendor) {
      return NextResponse.json<ApiResponse>({
        success: false,
        message: 'Vendor account not found'
      }, { status: 404 });
    }
    
    return NextResponse.json<ApiResponse>({
      success: true,
      message: 'Vendor details fetched successfully',
      data: { vendor }
    }, { status: 200 });
    
  } catch (error: any) {
    console.error('Error fetching vendor details:', error);
    return NextResponse.json<ApiResponse>({
      success: false,
      message: 'Internal server error',
      error: error.message
    }, { status: 500 });
  }
}
