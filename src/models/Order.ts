import mongoose, { Schema } from 'mongoose';
import { IOrder } from '@/types';

const OrderSchema = new Schema<IOrder>({
  userId: {
    type: String,
    ref: 'User',
    required: [true, 'User ID is required']
  },
  vendorId: {
    type: String,
    ref: 'Vendor',
    required: [true, 'Vendor ID is required']
  },
  products: [{
    productId: {
      type: String,
      ref: 'Product',
      required: true
    },
    quantity: {
      type: Number,
      required: true,
      min: [1, 'Quantity must be at least 1']
    },
    price: {
      type: Number,
      required: true,
      min: [0, 'Price cannot be negative']
    },
    name: {
      type: String,
      required: true,
      trim: true
    }
  }],
  totalAmount: {
    type: Number,
    required: [true, 'Total amount is required'],
    min: [0, 'Total amount cannot be negative']
  },
  shippingAddress: {
    name: {
      type: String,
      required: [true, 'Recipient name is required'],
      trim: true
    },
    phone: {
      type: String,
      required: [true, 'Phone number is required'],
      match: [/^[0-9]{10}$/, 'Please enter a valid 10-digit phone number']
    },
    street: {
      type: String,
      required: [true, 'Street address is required'],
      trim: true
    },
    city: {
      type: String,
      required: [true, 'City is required'],
      trim: true
    },
    state: {
      type: String,
      required: [true, 'State is required'],
      trim: true
    },
    pincode: {
      type: String,
      required: [true, 'Pincode is required'],
      match: [/^[0-9]{6}$/, 'Please enter a valid 6-digit pincode']
    },
    country: {
      type: String,
      required: [true, 'Country is required'],
      default: 'India',
      trim: true
    }
  },
  paymentMethod: {
    type: String,
    enum: ['cod', 'online', 'wallet'],
    required: [true, 'Payment method is required']
  },
  paymentStatus: {
    type: String,
    enum: ['pending', 'paid', 'failed'],
    default: 'pending'
  },
  orderStatus: {
    type: String,
    enum: ['placed', 'confirmed', 'shipped', 'delivered', 'cancelled'],
    default: 'placed'
  },
  trackingId: {
    type: String,
    trim: true
  },
  deliveredAt: {
    type: Date
  }
}, {
  timestamps: true
});

// Indexes for better query performance
OrderSchema.index({ userId: 1 });
OrderSchema.index({ vendorId: 1 });
OrderSchema.index({ orderStatus: 1 });
OrderSchema.index({ paymentStatus: 1 });
OrderSchema.index({ createdAt: -1 });
OrderSchema.index({ userId: 1, orderStatus: 1 });

// Virtual for full shipping address
OrderSchema.virtual('fullShippingAddress').get(function() {
  const addr = this.shippingAddress;
  return `${addr.name}, ${addr.street}, ${addr.city}, ${addr.state} - ${addr.pincode}, ${addr.country}`;
});

// Virtual for order number (using _id)
OrderSchema.virtual('orderNumber').get(function() {
  return `ORD${this._id.toString().slice(-8).toUpperCase()}`;
});

// Virtual for total items count
OrderSchema.virtual('totalItems').get(function() {
  return this.products.reduce((total, product) => total + product.quantity, 0);
});

// Method to check if order can be cancelled
OrderSchema.methods.canBeCancelled = function(): boolean {
  return ['placed', 'confirmed'].includes(this.orderStatus);
};

// Method to check if order is delivered
OrderSchema.methods.isDelivered = function(): boolean {
  return this.orderStatus === 'delivered';
};

// Method to update order status
OrderSchema.methods.updateStatus = function(newStatus: string) {
  this.orderStatus = newStatus;
  if (newStatus === 'delivered') {
    this.deliveredAt = new Date();
  }
  return this.save();
};

// Method to calculate delivery time (in days)
OrderSchema.methods.getDeliveryTime = function(): number | null {
  if (!this.deliveredAt) return null;
  const diffTime = Math.abs(this.deliveredAt.getTime() - this.createdAt.getTime());
  return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
};

// Static method to find user orders
OrderSchema.statics.findUserOrders = function(userId: string, status?: string) {
  const query: any = { userId };
  if (status) query.orderStatus = status;
  
  return this.find(query)
    .sort({ createdAt: -1 })
    .populate('products.productId', 'name images')
    .populate('vendorId', 'businessName');
};

// Static method to find vendor orders
OrderSchema.statics.findVendorOrders = function(vendorId: string, status?: string) {
  const query: any = { vendorId };
  if (status) query.orderStatus = status;
  
  return this.find(query)
    .sort({ createdAt: -1 })
    .populate('userId', 'username email phone')
    .populate('products.productId', 'name images');
};

// Static method to get order statistics
OrderSchema.statics.getOrderStats = function(vendorId?: string) {
  const matchStage: any = {};
  if (vendorId) matchStage.vendorId = vendorId;
  
  return this.aggregate([
    { $match: matchStage },
    {
      $group: {
        _id: '$orderStatus',
        count: { $sum: 1 },
        totalAmount: { $sum: '$totalAmount' }
      }
    }
  ]);
};

// Pre-save middleware to generate tracking ID for shipped orders
OrderSchema.pre('save', function(next) {
  if (this.isModified('orderStatus') && this.orderStatus === 'shipped' && !this.trackingId) {
    this.trackingId = `TRK${Date.now()}${Math.random().toString(36).substr(2, 5).toUpperCase()}`;
  }
  next();
});

export default mongoose.models.Order || mongoose.model<IOrder>('Order', OrderSchema);
