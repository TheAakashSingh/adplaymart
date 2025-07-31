import mongoose, { Schema } from 'mongoose';
import { ITransaction } from '@/types';

const TransactionSchema = new Schema<ITransaction>({
  userId: {
    type: String,
    ref: 'User',
    required: [true, 'User ID is required']
  },
  type: {
    type: String,
    enum: ['deposit', 'withdrawal', 'referral_bonus', 'level_income', 'game_reward', 'ad_reward', 'video_reward', 'purchase'],
    required: [true, 'Transaction type is required']
  },
  amount: {
    type: Number,
    required: [true, 'Transaction amount is required'],
    min: [0, 'Amount cannot be negative']
  },
  status: {
    type: String,
    enum: ['pending', 'completed', 'failed', 'cancelled'],
    default: 'pending'
  },
  description: {
    type: String,
    required: [true, 'Transaction description is required'],
    maxlength: [200, 'Description cannot exceed 200 characters']
  },
  referenceId: {
    type: String,
    trim: true
  },
  paymentMethod: {
    type: String,
    enum: ['bank_transfer', 'upi', 'wallet', 'razorpay', 'paytm', 'phonepe'],
    trim: true
  },
  tdsAmount: {
    type: Number,
    default: 0,
    min: [0, 'TDS amount cannot be negative']
  },
  netAmount: {
    type: Number,
    required: [true, 'Net amount is required'],
    min: [0, 'Net amount cannot be negative']
  }
}, {
  timestamps: true
});

// Indexes for better query performance
TransactionSchema.index({ userId: 1 });
TransactionSchema.index({ type: 1 });
TransactionSchema.index({ status: 1 });
TransactionSchema.index({ createdAt: -1 });
TransactionSchema.index({ userId: 1, type: 1 });
TransactionSchema.index({ userId: 1, status: 1 });

// Virtual for transaction date formatting
TransactionSchema.virtual('formattedDate').get(function() {
  return this.createdAt.toLocaleDateString('en-IN', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  });
});

// Method to check if transaction is successful
TransactionSchema.methods.isSuccessful = function(): boolean {
  return this.status === 'completed';
};

// Method to check if transaction is pending
TransactionSchema.methods.isPending = function(): boolean {
  return this.status === 'pending';
};

// Method to mark transaction as completed
TransactionSchema.methods.markCompleted = function() {
  this.status = 'completed';
  return this.save();
};

// Method to mark transaction as failed
TransactionSchema.methods.markFailed = function() {
  this.status = 'failed';
  return this.save();
};

// Static method to find user transactions
TransactionSchema.statics.findUserTransactions = function(userId: string, limit: number = 50) {
  return this.find({ userId })
    .sort({ createdAt: -1 })
    .limit(limit)
    .populate('userId', 'username email');
};

// Static method to find transactions by type
TransactionSchema.statics.findByType = function(type: string, status?: string) {
  const query: any = { type };
  if (status) query.status = status;
  
  return this.find(query)
    .sort({ createdAt: -1 })
    .populate('userId', 'username email');
};

// Static method to get user earnings summary
TransactionSchema.statics.getUserEarningsSummary = function(userId: string) {
  return this.aggregate([
    { $match: { userId, status: 'completed' } },
    {
      $group: {
        _id: '$type',
        totalAmount: { $sum: '$amount' },
        count: { $sum: 1 }
      }
    }
  ]);
};

// Static method to get daily earnings
TransactionSchema.statics.getDailyEarnings = function(userId: string, date: Date) {
  const startOfDay = new Date(date);
  startOfDay.setHours(0, 0, 0, 0);
  
  const endOfDay = new Date(date);
  endOfDay.setHours(23, 59, 59, 999);
  
  return this.find({
    userId,
    status: 'completed',
    type: { $in: ['game_reward', 'ad_reward', 'video_reward'] },
    createdAt: { $gte: startOfDay, $lte: endOfDay }
  });
};

// Pre-save middleware to calculate net amount if not provided
TransactionSchema.pre('save', function(next) {
  if (!this.netAmount) {
    this.netAmount = this.amount - (this.tdsAmount || 0);
  }
  next();
});

export default mongoose.models.Transaction || mongoose.model<ITransaction>('Transaction', TransactionSchema);
