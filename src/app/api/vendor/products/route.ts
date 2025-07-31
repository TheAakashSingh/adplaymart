import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import { Product, Vendor } from '@/models';
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
    
    // Check if user is a verified vendor
    const vendor = await Vendor.findOne({ userId: user.userId });
    if (!vendor || vendor.verificationStatus !== 'verified' || !vendor.isActive) {
      return NextResponse.json<ApiResponse>({
        success: false,
        message: 'Verified vendor account required'
      }, { status: 403 });
    }
    
    const body = await request.json();
    const {
      name,
      description,
      category,
      price,
      discountPrice,
      stock,
      images,
      specifications,
      tags,
      shippingInfo
    } = body;
    
    // Validation
    if (!name || !description || !category || !price || stock === undefined) {
      return NextResponse.json<ApiResponse>({
        success: false,
        message: 'Name, description, category, price, and stock are required'
      }, { status: 400 });
    }
    
    if (price <= 0 || stock < 0) {
      return NextResponse.json<ApiResponse>({
        success: false,
        message: 'Price must be positive and stock cannot be negative'
      }, { status: 400 });
    }
    
    // Create product
    const product = new Product({
      vendorId: vendor._id,
      name,
      description,
      category,
      price,
      discountPrice: discountPrice || null,
      stock,
      images: images || [],
      specifications: specifications || {},
      tags: tags || [],
      shippingInfo: shippingInfo || {},
      isActive: true
    });
    
    await product.save();
    
    // Update vendor's product count
    vendor.totalProducts += 1;
    await vendor.save();
    
    return NextResponse.json<ApiResponse>({
      success: true,
      message: 'Product created successfully',
      data: { product }
    }, { status: 201 });
    
  } catch (error: any) {
    console.error('Product creation error:', error);
    return NextResponse.json<ApiResponse>({
      success: false,
      message: 'Internal server error',
      error: error.message
    }, { status: 500 });
  }
}

// GET method to fetch vendor's products
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
    
    // Check if user is a vendor
    const vendor = await Vendor.findOne({ userId: user.userId });
    if (!vendor) {
      return NextResponse.json<ApiResponse>({
        success: false,
        message: 'Vendor account required'
      }, { status: 403 });
    }
    
    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '10');
    const category = searchParams.get('category');
    const status = searchParams.get('status');
    const search = searchParams.get('search');
    
    const skip = (page - 1) * limit;
    
    // Build query
    let query: any = { vendorId: vendor._id };
    
    if (category) {
      query.category = category;
    }
    
    if (status === 'active') {
      query.isActive = true;
    } else if (status === 'inactive') {
      query.isActive = false;
    }
    
    if (search) {
      query.$or = [
        { name: { $regex: search, $options: 'i' } },
        { description: { $regex: search, $options: 'i' } },
        { tags: { $in: [new RegExp(search, 'i')] } }
      ];
    }
    
    const products = await Product.find(query)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .populate('vendorId', 'businessName');
    
    const total = await Product.countDocuments(query);
    
    return NextResponse.json<ApiResponse>({
      success: true,
      message: 'Products fetched successfully',
      data: {
        products,
        pagination: {
          page,
          limit,
          total,
          pages: Math.ceil(total / limit)
        }
      }
    }, { status: 200 });
    
  } catch (error: any) {
    console.error('Error fetching products:', error);
    return NextResponse.json<ApiResponse>({
      success: false,
      message: 'Internal server error',
      error: error.message
    }, { status: 500 });
  }
}
