import { NextRequest, NextResponse } from 'next/server';
import { verifyToken, extractTokenFromHeader, hasRequiredRole } from '@/utils/auth';
import connectDB from '@/lib/mongodb';
import { User } from '@/models';

export interface AuthenticatedRequest extends NextRequest {
  user?: {
    userId: string;
    email: string;
    role: string;
    username: string;
  };
}

// Middleware to authenticate user
export const authenticate = async (request: NextRequest): Promise<{ user: any; error?: string }> => {
  try {
    const authHeader = request.headers.get('authorization');
    const token = extractTokenFromHeader(authHeader);
    
    if (!token) {
      return { user: null, error: 'No token provided' };
    }
    
    const decoded = verifyToken(token);
    if (!decoded) {
      return { user: null, error: 'Invalid token' };
    }
    
    // Connect to database and fetch user
    await connectDB();
    const user = await User.findById(decoded.userId).select('-password');
    
    if (!user) {
      return { user: null, error: 'User not found' };
    }
    
    if (!user.isActive) {
      return { user: null, error: 'User account is deactivated' };
    }
    
    return {
      user: {
        userId: user._id.toString(),
        email: user.email,
        role: user.role,
        username: user.username,
        fullUser: user
      }
    };
  } catch (error) {
    console.error('Authentication error:', error);
    return { user: null, error: 'Authentication failed' };
  }
};

// Middleware to check user role
export const authorize = (allowedRoles: string[]) => {
  return async (request: NextRequest, user: any): Promise<{ authorized: boolean; error?: string }> => {
    if (!user) {
      return { authorized: false, error: 'User not authenticated' };
    }
    
    if (!hasRequiredRole(user.role, allowedRoles)) {
      return { authorized: false, error: 'Insufficient permissions' };
    }
    
    return { authorized: true };
  };
};

// Combined middleware for authentication and authorization
export const authMiddleware = (allowedRoles: string[] = []) => {
  return async (request: NextRequest) => {
    const { user, error: authError } = await authenticate(request);
    
    if (authError) {
      return NextResponse.json(
        { success: false, message: authError },
        { status: 401 }
      );
    }
    
    if (allowedRoles.length > 0) {
      const { authorized, error: authzError } = await authorize(allowedRoles)(request, user);
      
      if (!authorized) {
        return NextResponse.json(
          { success: false, message: authzError },
          { status: 403 }
        );
      }
    }
    
    // Add user to request object
    (request as AuthenticatedRequest).user = user;
    
    return null; // Continue to next middleware/handler
  };
};

// Admin only middleware
export const adminOnly = authMiddleware(['admin']);

// Vendor and Admin middleware
export const vendorOrAdmin = authMiddleware(['vendor', 'admin']);

// Authenticated user middleware (any role)
export const authenticatedUser = authMiddleware();

// Helper function to get user from request
export const getUserFromRequest = (request: AuthenticatedRequest) => {
  return request.user;
};

// Helper function to check if user is admin
export const isAdmin = (user: any): boolean => {
  return user?.role === 'admin';
};

// Helper function to check if user is vendor
export const isVendor = (user: any): boolean => {
  return user?.role === 'vendor';
};

// Helper function to check if user owns resource
export const isResourceOwner = (user: any, resourceUserId: string): boolean => {
  return user?.userId === resourceUserId || user?.role === 'admin';
};
