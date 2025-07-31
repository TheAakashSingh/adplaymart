import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import { Order, Product, User, Transaction } from '@/models';
import { authenticate } from '@/middleware/auth';
import { ApiResponse } from '@/types';

// Import cart storage (in production, use proper storage)
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
    const { shippingAddress, paymentMethod = 'wallet' } = body;
    
    // Validation
    if (!shippingAddress || !shippingAddress.fullName || !shippingAddress.address || !shippingAddress.city || !shippingAddress.pincode || !shippingAddress.phone) {
      return NextResponse.json<ApiResponse>({
        success: false,
        message: 'Complete shipping address is required'
      }, { status: 400 });
    }
    
    // Get user's cart
    const cart = userCarts.get(user.userId) || [];
    if (cart.length === 0) {
      return NextResponse.json<ApiResponse>({
        success: false,
        message: 'Cart is empty'
      }, { status: 400 });
    }
    
    // Get user details
    const currentUser = await User.findById(user.userId);
    if (!currentUser) {
      return NextResponse.json<ApiResponse>({
        success: false,
        message: 'User not found'
      }, { status: 404 });
    }
    
    // Calculate order totals
    let subtotal = 0;
    const orderItems = [];
    
    // Validate cart items and calculate totals
    for (const cartItem of cart) {
      const product = await Product.findById(cartItem.productId);
      if (!product || !product.isActive) {
        return NextResponse.json<ApiResponse>({
          success: false,
          message: `Product ${cartItem.name} is no longer available`
        }, { status: 400 });
      }
      
      if (cartItem.quantity > product.stock) {
        return NextResponse.json<ApiResponse>({
          success: false,
          message: `Insufficient stock for ${product.name}. Only ${product.stock} available`
        }, { status: 400 });
      }
      
      const itemPrice = product.discountPrice || product.price;
      const itemTotal = itemPrice * cartItem.quantity;
      subtotal += itemTotal;
      
      orderItems.push({
        productId: product._id,
        vendorId: product.vendorId,
        name: product.name,
        price: itemPrice,
        quantity: cartItem.quantity,
        total: itemTotal,
        image: product.images[0] || null
      });
    }
    
    const shippingCost = 0; // Calculate based on shipping rules
    const tax = subtotal * 0.18; // 18% GST
    const total = subtotal + shippingCost + tax;
    
    // Check wallet balance for wallet payment
    if (paymentMethod === 'wallet') {
      if (currentUser.wallets.upgrade < total) {
        return NextResponse.json<ApiResponse>({
          success: false,
          message: `Insufficient wallet balance. Required: ₹${total}, Available: ₹${currentUser.wallets.upgrade}`
        }, { status: 400 });
      }
    }
    
    // Generate order ID
    const orderId = `ORD${Date.now()}${Math.random().toString(36).substr(2, 4).toUpperCase()}`;
    
    // Create order
    const order = new Order({
      orderId,
      userId: user.userId,
      items: orderItems,
      shippingAddress,
      paymentMethod,
      subtotal,
      shippingCost,
      tax,
      total,
      status: 'pending',
      paymentStatus: paymentMethod === 'wallet' ? 'paid' : 'pending'
    });
    
    await order.save();
    
    // Process payment if wallet
    if (paymentMethod === 'wallet') {
      // Deduct from user's wallet
      currentUser.wallets.upgrade -= total;
      await currentUser.save();
      
      // Create transaction record
      const transaction = new Transaction({
        userId: user.userId,
        type: 'purchase',
        amount: total,
        description: `Order payment - ${orderId}`,
        status: 'completed',
        orderId: order._id
      });
      await transaction.save();
      
      // Update order status
      order.status = 'confirmed';
      order.paymentStatus = 'paid';
      await order.save();
    }
    
    // Update product stock
    for (const item of orderItems) {
      await Product.findByIdAndUpdate(item.productId, {
        $inc: { stock: -item.quantity, totalSold: item.quantity }
      });
    }
    
    // Clear user's cart
    userCarts.delete(user.userId);
    
    return NextResponse.json<ApiResponse>({
      success: true,
      message: 'Order placed successfully',
      data: {
        order: {
          _id: order._id,
          orderId: order.orderId,
          total: order.total,
          status: order.status,
          paymentStatus: order.paymentStatus,
          createdAt: order.createdAt
        }
      }
    }, { status: 201 });
    
  } catch (error: any) {
    console.error('Order creation error:', error);
    return NextResponse.json<ApiResponse>({
      success: false,
      message: 'Internal server error',
      error: error.message
    }, { status: 500 });
  }
}

// GET method to fetch user's orders
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
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '10');
    const status = searchParams.get('status');
    
    const skip = (page - 1) * limit;
    
    // Build query
    let query: any = { userId: user.userId };
    if (status) {
      query.status = status;
    }
    
    const orders = await Order.find(query)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .populate('items.productId', 'name images')
      .populate('items.vendorId', 'businessName');
    
    const total = await Order.countDocuments(query);
    
    return NextResponse.json<ApiResponse>({
      success: true,
      message: 'Orders fetched successfully',
      data: {
        orders,
        pagination: {
          page,
          limit,
          total,
          pages: Math.ceil(total / limit)
        }
      }
    }, { status: 200 });
    
  } catch (error: any) {
    console.error('Error fetching orders:', error);
    return NextResponse.json<ApiResponse>({
      success: false,
      message: 'Internal server error',
      error: error.message
    }, { status: 500 });
  }
}
