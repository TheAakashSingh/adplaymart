import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import { Product } from '@/models';
import { ApiResponse } from '@/types';

export async function GET(request: NextRequest) {
  try {
    await connectDB();
    
    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '12');
    const category = searchParams.get('category');
    const search = searchParams.get('search');
    const sortBy = searchParams.get('sortBy') || 'createdAt';
    const sortOrder = searchParams.get('sortOrder') || 'desc';
    const minPrice = parseFloat(searchParams.get('minPrice') || '0');
    const maxPrice = parseFloat(searchParams.get('maxPrice') || '999999');
    
    const skip = (page - 1) * limit;
    
    // Build query
    let query: any = { 
      isActive: true,
      stock: { $gt: 0 }
    };
    
    if (category && category !== 'all') {
      query.category = category;
    }
    
    if (search) {
      query.$or = [
        { name: { $regex: search, $options: 'i' } },
        { description: { $regex: search, $options: 'i' } },
        { tags: { $in: [new RegExp(search, 'i')] } }
      ];
    }
    
    // Price filter
    query.$and = [
      { $or: [{ discountPrice: { $gte: minPrice, $lte: maxPrice } }, { $and: [{ discountPrice: null }, { price: { $gte: minPrice, $lte: maxPrice } }] }] }
    ];
    
    // Build sort object
    let sort: any = {};
    if (sortBy === 'price') {
      sort = { price: sortOrder === 'asc' ? 1 : -1 };
    } else if (sortBy === 'name') {
      sort = { name: sortOrder === 'asc' ? 1 : -1 };
    } else if (sortBy === 'rating') {
      sort = { 'rating.average': sortOrder === 'asc' ? 1 : -1 };
    } else if (sortBy === 'popularity') {
      sort = { totalSold: sortOrder === 'asc' ? 1 : -1 };
    } else {
      sort = { createdAt: sortOrder === 'asc' ? 1 : -1 };
    }
    
    const products = await Product.find(query)
      .sort(sort)
      .skip(skip)
      .limit(limit)
      .populate('vendorId', 'businessName businessType')
      .select('-__v');
    
    const total = await Product.countDocuments(query);
    
    // Get categories for filter
    const categories = await Product.distinct('category', { isActive: true });
    
    // Get price range
    const priceRange = await Product.aggregate([
      { $match: { isActive: true, stock: { $gt: 0 } } },
      {
        $group: {
          _id: null,
          minPrice: { $min: { $ifNull: ['$discountPrice', '$price'] } },
          maxPrice: { $max: { $ifNull: ['$discountPrice', '$price'] } }
        }
      }
    ]);
    
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
        },
        filters: {
          categories,
          priceRange: priceRange[0] || { minPrice: 0, maxPrice: 0 }
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
