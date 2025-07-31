import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import { Package } from '@/models';
import { verifyToken, extractTokenFromHeader } from '@/utils/auth';

// GET /api/mlm/packages - Fetch all active packages
export async function GET(request: NextRequest) {
  try {
    await connectDB();

    // Verify user authentication
    const authHeader = request.headers.get('authorization');
    const token = extractTokenFromHeader(authHeader);

    if (!token) {
      return NextResponse.json(
        { success: false, message: 'No token provided' },
        { status: 401 }
      );
    }

    const decoded = verifyToken(token);
    if (!decoded) {
      return NextResponse.json(
        { success: false, message: 'Invalid token' },
        { status: 401 }
      );
    }

    // Fetch all active packages
    const packages = await Package.findActivePackages();

    return NextResponse.json({
      success: true,
      message: 'Packages fetched successfully',
      data: {
        packages,
        count: packages.length
      }
    });

  } catch (error) {
    console.error('Error fetching packages:', error);
    return NextResponse.json(
      { success: false, message: 'Internal server error' },
      { status: 500 }
    );
  }
}

// POST /api/mlm/packages - Create a new package (Admin only)
export async function POST(request: NextRequest) {
  try {
    await connectDB();

    // Verify user authentication
    const authHeader = request.headers.get('authorization');
    const token = extractTokenFromHeader(authHeader);

    if (!token) {
      return NextResponse.json(
        { success: false, message: 'No token provided' },
        { status: 401 }
      );
    }

    const decoded = verifyToken(token);
    if (!decoded) {
      return NextResponse.json(
        { success: false, message: 'Invalid token' },
        { status: 401 }
      );
    }

    // Check if user is admin (you can implement admin check here)
    // For now, allowing all authenticated users to create packages
    
    const body = await request.json();
    const {
      name,
      price,
      description,
      features,
      dailyIncome,
      validity,
      gameReward,
      adReward,
      videoReward,
      levelIncomePercentage
    } = body;

    // Validate required fields
    if (!name || !price || !description || !dailyIncome || !validity) {
      return NextResponse.json(
        { success: false, message: 'Missing required fields' },
        { status: 400 }
      );
    }

    // Create new package
    const newPackage = new Package({
      name,
      price,
      description,
      features: features || [],
      dailyIncome,
      validity,
      gameReward: gameReward || 0,
      adReward: adReward || 0,
      videoReward: videoReward || 0,
      levelIncomePercentage: levelIncomePercentage || []
    });

    await newPackage.save();

    return NextResponse.json({
      success: true,
      message: 'Package created successfully',
      data: { package: newPackage }
    }, { status: 201 });

  } catch (error: any) {
    console.error('Error creating package:', error);
    
    if (error.code === 11000) {
      return NextResponse.json(
        { success: false, message: 'Package with this name already exists' },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { success: false, message: 'Internal server error' },
      { status: 500 }
    );
  }
}
