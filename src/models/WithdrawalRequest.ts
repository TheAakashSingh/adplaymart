import mongoose, { Schema } from 'mongoose';
import { IWithdrawalRequest } from '@/types';

const WithdrawalRequestSchema = new Schema<IWithdrawalRequest>({
  userId: {
    type: String,
    ref: 'User',
    required: [true, 'User ID is required']
  },
  amount: {
    type: Number,
    required: [true, 'Withdrawal amount is required'],
    min: [100, 'Minimum withdrawal amount is ₹100']
  },
  tdsAmount: {
    type: Number,
    required: [true, 'TDS amount is required'],
    min: [0, 'TDS amount cannot be negative']
  },
  netAmount: {
    type: Number,
    required: [true, 'Net amount is required'],
    min: [0, 'Net amount cannot be negative']
  },
  bankDetails: {
    accountNumber: {
      type: String,
      required: [true, 'Account number is required'],
      trim: true
    },
    ifscCode: {
      type: String,
      required: [true, 'IFSC code is required'],
      trim: true,
      uppercase: true
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
  status: {
    type: String,
    enum: ['pending', 'approved', 'rejected', 'processed'],
    default: 'pending'
  },
  adminNotes: {
    type: String,
    maxlength: [500, 'Admin notes cannot exceed 500 characters']
  },
  processedBy: {
    type: String,
    ref: 'User'
  },
  processedAt: {
    type: Date
  }
}, {
  timestamps: true
});

// Indexes for better query performance
WithdrawalRequestSchema.index({ userId: 1 });
WithdrawalRequestSchema.index({ status: 1 });
WithdrawalRequestSchema.index({ createdAt: -1 });

// Virtual for request ID
WithdrawalRequestSchema.virtual('requestId').get(function() {
  return `WR${this._id.toString().slice(-8).toUpperCase()}`;
});

// Method to approve withdrawal
WithdrawalRequestSchema.methods.approve = function(adminId: string, notes?: string) {
  this.status = 'approved';
  this.processedBy = adminId;
  this.processedAt = new Date();
  if (notes) this.adminNotes = notes;
  return this.save();
};

// Method to reject withdrawal
WithdrawalRequestSchema.methods.reject = function(adminId: string, notes: string) {
  this.status = 'rejected';
  this.processedBy = adminId;
  this.processedAt = new Date();
  this.adminNotes = notes;
  return this.save();
};

// Method to mark as processed
WithdrawalRequestSchema.methods.markProcessed = function(adminId: string, notes?: string) {
  this.status = 'processed';
  this.processedBy = adminId;
  this.processedAt = new Date();
  if (notes) this.adminNotes = notes;
  return this.save();
};

// Static method to find pending requests
WithdrawalRequestSchema.statics.findPendingRequests = function() {
  return this.find({ status: 'pending' })
    .sort({ createdAt: 1 })
    .populate('userId', 'username email phone');
};

// Static method to find user requests
WithdrawalRequestSchema.statics.findUserRequests = function(userId: string) {
  return this.find({ userId })
    .sort({ createdAt: -1 })
    .populate('processedBy', 'username');
};

export default mongoose.models.WithdrawalRequest || mongoose.model<IWithdrawalRequest>('WithdrawalRequest', WithdrawalRequestSchema);
