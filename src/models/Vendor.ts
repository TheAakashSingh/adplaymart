import mongoose, { Schema } from 'mongoose';
import { IVendor } from '@/types';

const VendorSchema = new Schema<IVendor>({
  userId: {
    type: String,
    ref: 'User',
    required: [true, 'User ID is required'],
    unique: true
  },
  businessName: {
    type: String,
    required: [true, 'Business name is required'],
    trim: true,
    maxlength: [100, 'Business name cannot exceed 100 characters']
  },
  businessType: {
    type: String,
    required: [true, 'Business type is required'],
    enum: ['individual', 'partnership', 'private_limited', 'public_limited', 'llp'],
    trim: true
  },
  gstNumber: {
    type: String,
    trim: true,
    uppercase: true,
    match: [/^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z]{1}[1-9A-Z]{1}Z[0-9A-Z]{1}$/, 'Please enter a valid GST number']
  },
  panNumber: {
    type: String,
    trim: true,
    uppercase: true,
    match: [/^[A-Z]{5}[0-9]{4}[A-Z]{1}$/, 'Please enter a valid PAN number']
  },
  businessAddress: {
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
  bankDetails: {
    accountNumber: {
      type: String,
      required: [true, 'Account number is required'],
      trim: true,
      minlength: [9, 'Account number must be at least 9 digits'],
      maxlength: [18, 'Account number cannot exceed 18 digits']
    },
    ifscCode: {
      type: String,
      required: [true, 'IFSC code is required'],
      trim: true,
      uppercase: true,
      match: [/^[A-Z]{4}0[A-Z0-9]{6}$/, 'Please enter a valid IFSC code']
    },
    bankName: {
      type: String,
      required: [true, 'Bank name is required'],
      trim: true
    },
    accountHolderName: {
      type: String,
      required: [true, 'Account holder name is required'],
      trim: true
    }
  },
  isVerified: {
    type: Boolean,
    default: false
  },
  verificationDocuments: [{
    type: String,
    required: true
  }],
  totalSales: {
    type: Number,
    default: 0,
    min: [0, 'Total sales cannot be negative']
  },
  totalOrders: {
    type: Number,
    default: 0,
    min: [0, 'Total orders cannot be negative']
  },
  rating: {
    type: Number,
    default: 0,
    min: [0, 'Rating cannot be negative'],
    max: [5, 'Rating cannot exceed 5']
  }
}, {
  timestamps: true
});

// Indexes for better query performance
VendorSchema.index({ userId: 1 });
VendorSchema.index({ isVerified: 1 });
VendorSchema.index({ businessName: 'text' });
VendorSchema.index({ rating: -1 });

// Virtual for full business address
VendorSchema.virtual('fullAddress').get(function() {
  const addr = this.businessAddress;
  return `${addr.street}, ${addr.city}, ${addr.state} - ${addr.pincode}, ${addr.country}`;
});

// Virtual for average order value
VendorSchema.virtual('averageOrderValue').get(function() {
  return this.totalOrders > 0 ? this.totalSales / this.totalOrders : 0;
});

// Method to check if vendor is verified
VendorSchema.methods.isVendorVerified = function(): boolean {
  return this.isVerified;
};

// Method to update sales statistics
VendorSchema.methods.updateSalesStats = function(orderAmount: number) {
  this.totalSales += orderAmount;
  this.totalOrders += 1;
  return this.save();
};

// Method to calculate commission (example: 5% of sales)
VendorSchema.methods.calculateCommission = function(rate: number = 0.05): number {
  return this.totalSales * rate;
};

// Static method to find verified vendors
VendorSchema.statics.findVerifiedVendors = function() {
  return this.find({ isVerified: true })
    .populate('userId', 'username email phone')
    .sort({ rating: -1 });
};

// Static method to find vendors by location
VendorSchema.statics.findByLocation = function(city: string, state?: string) {
  const query: any = { 'businessAddress.city': new RegExp(city, 'i') };
  if (state) {
    query['businessAddress.state'] = new RegExp(state, 'i');
  }
  
  return this.find(query)
    .populate('userId', 'username email')
    .sort({ rating: -1 });
};

// Static method to get top vendors by sales
VendorSchema.statics.getTopVendors = function(limit: number = 10) {
  return this.find({ isVerified: true })
    .sort({ totalSales: -1 })
    .limit(limit)
    .populate('userId', 'username email');
};

export default mongoose.models.Vendor || mongoose.model<IVendor>('Vendor', VendorSchema);
