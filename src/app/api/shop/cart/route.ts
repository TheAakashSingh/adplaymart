import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import { Product } from '@/models';
import { authenticate } from '@/middleware/auth';
import { ApiResponse } from '@/types';

// In-memory cart storage (in production, use Redis or database)
const userCarts = new Map<string, any[]>();

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
    const { productId, quantity = 1, action = 'add' } = body;
    
    // Validation
    if (!productId) {
      return NextResponse.json<ApiResponse>({
        success: false,
        message: 'Product ID is required'
      }, { status: 400 });
    }
    
    // Get product details
    const product = await Product.findById(productId).populate('vendorId', 'businessName');
    if (!product || !product.isActive) {
      return NextResponse.json<ApiResponse>({
        success: false,
        message: 'Product not found or inactive'
      }, { status: 404 });
    }
    
    // Check stock availability
    if (quantity > product.stock) {
      return NextResponse.json<ApiResponse>({
        success: false,
        message: `Only ${product.stock} items available in stock`
      }, { status: 400 });
    }
    
    // Get user's cart
    let cart = userCarts.get(user.userId) || [];
    
    // Find existing item in cart
    const existingItemIndex = cart.findIndex(item => item.productId === productId);
    
    if (action === 'add') {
      if (existingItemIndex >= 0) {
        // Update quantity
        const newQuantity = cart[existingItemIndex].quantity + quantity;
        if (newQuantity > product.stock) {
          return NextResponse.json<ApiResponse>({
            success: false,
            message: `Cannot add more items. Only ${product.stock} available in stock`
          }, { status: 400 });
        }
        cart[existingItemIndex].quantity = newQuantity;
      } else {
        // Add new item
        cart.push({
          productId,
          quantity,
          price: product.discountPrice || product.price,
          originalPrice: product.price,
          name: product.name,
          image: product.images[0] || null,
          vendorId: product.vendorId._id,
          vendorName: product.vendorId.businessName
        });
      }
    } else if (action === 'remove') {
      if (existingItemIndex >= 0) {
        cart.splice(existingItemIndex, 1);
      }
    } else if (action === 'update') {
      if (existingItemIndex >= 0) {
        if (quantity <= 0) {
          cart.splice(existingItemIndex, 1);
        } else if (quantity > product.stock) {
          return NextResponse.json<ApiResponse>({
            success: false,
            message: `Only ${product.stock} items available in stock`
          }, { status: 400 });
        } else {
          cart[existingItemIndex].quantity = quantity;
        }
      }
    }
    
    // Update cart
    userCarts.set(user.userId, cart);
    
    // Calculate totals
    const subtotal = cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);
    const totalItems = cart.reduce((sum, item) => sum + item.quantity, 0);
    
    return NextResponse.json<ApiResponse>({
      success: true,
      message: 'Cart updated successfully',
      data: {
        cart,
        summary: {
          totalItems,
          subtotal,
          shipping: 0, // Calculate based on shipping rules
          total: subtotal
        }
      }
    }, { status: 200 });
    
  } catch (error: any) {
    console.error('Cart update error:', error);
    return NextResponse.json<ApiResponse>({
      success: false,
      message: 'Internal server error',
      error: error.message
    }, { status: 500 });
  }
}

// GET method to fetch user's cart
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
    
    // Get user's cart
    const cart = userCarts.get(user.userId) || [];
    
    // Calculate totals
    const subtotal = cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);
    const totalItems = cart.reduce((sum, item) => sum + item.quantity, 0);
    
    return NextResponse.json<ApiResponse>({
      success: true,
      message: 'Cart fetched successfully',
      data: {
        cart,
        summary: {
          totalItems,
          subtotal,
          shipping: 0,
          total: subtotal
        }
      }
    }, { status: 200 });
    
  } catch (error: any) {
    console.error('Error fetching cart:', error);
    return NextResponse.json<ApiResponse>({
      success: false,
      message: 'Internal server error',
      error: error.message
    }, { status: 500 });
  }
}

// DELETE method to clear cart
export async function DELETE(request: NextRequest) {
  try {
    // Authenticate user
    const { user, error } = await authenticate(request);
    if (error) {
      return NextResponse.json<ApiResponse>({
        success: false,
        message: error
      }, { status: 401 });
    }

    // Clear user's cart
    userCarts.delete(user.userId);
    
    return NextResponse.json<ApiResponse>({
      success: true,
      message: 'Cart cleared successfully',
      data: { cart: [], summary: { totalItems: 0, subtotal: 0, shipping: 0, total: 0 } }
    }, { status: 200 });
    
  } catch (error: any) {
    console.error('Error clearing cart:', error);
    return NextResponse.json<ApiResponse>({
      success: false,
      message: 'Internal server error',
      error: error.message
    }, { status: 500 });
  }
}
