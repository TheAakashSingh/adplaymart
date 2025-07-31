import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import { authenticate } from '@/middleware/auth';
import { getMLMTree, getTeamStats } from '@/utils/mlm';
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
    const depth = parseInt(searchParams.get('depth') || '3');
    const includeStats = searchParams.get('includeStats') === 'true';
    
    // Get MLM tree
    const tree = await getMLMTree(user.userId, depth);
    
    let stats = null;
    if (includeStats) {
      stats = await getTeamStats(user.userId);
    }
    
    return NextResponse.json<ApiResponse>({
      success: true,
      message: 'MLM tree fetched successfully',
      data: {
        tree,
        stats
      }
    }, { status: 200 });
    
  } catch (error: any) {
    console.error('Error fetching MLM tree:', error);
    return NextResponse.json<ApiResponse>({
      success: false,
      message: 'Internal server error',
      error: error.message
    }, { status: 500 });
  }
}
