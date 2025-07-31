import mongoose, { Schema } from 'mongoose';
import bcrypt from 'bcryptjs';
import { IUser } from '@/types';

const UserSchema = new Schema<IUser>({
  username: {
    type: String,
    required: [true, 'Username is required'],
    unique: true,
    trim: true,
    minlength: [3, 'Username must be at least 3 characters'],
    maxlength: [20, 'Username cannot exceed 20 characters']
  },
  email: {
    type: String,
    required: [true, 'Email is required'],
    unique: true,
    lowercase: true,
    match: [/^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/, 'Please enter a valid email']
  },
  password: {
    type: String,
    required: [true, 'Password is required'],
    minlength: [6, 'Password must be at least 6 characters']
  },
  phone: {
    type: String,
    required: [true, 'Phone number is required'],
    match: [/^[0-9]{10}$/, 'Please enter a valid 10-digit phone number']
  },
  role: {
    type: String,
    enum: ['user', 'vendor', 'admin'],
    default: 'user'
  },
  isActive: {
    type: Boolean,
    default: true
  },
  isEmailVerified: {
    type: Boolean,
    default: false
  },
  profileImage: {
    type: String,
    default: ''
  },
  
  // MLM Fields
  referralCode: {
    type: String,
    unique: true,
    required: true
  },
  referredBy: {
    type: String,
    ref: 'User'
  },
  sponsorId: {
    type: String,
    ref: 'User'
  },
  level: {
    type: Number,
    default: 0
  },
  totalReferrals: {
    type: Number,
    default: 0
  },
  directReferrals: [{
    type: String,
    ref: 'User'
  }],
  teamMembers: [{
    type: String,
    ref: 'User'
  }],
  
  // Wallet Fields
  wallets: {
    upgrade: {
      type: Number,
      default: 0
    },
    withdrawal: {
      type: Number,
      default: 0
    }
  },
  totalEarnings: {
    type: Number,
    default: 0
  },
  totalWithdrawals: {
    type: Number,
    default: 0
  },
  
  // Package & Investment
  currentPackage: {
    type: String,
    ref: 'Package'
  },
  packageActivatedAt: {
    type: Date
  },
  investmentAmount: {
    type: Number,
    default: 0
  },
  
  // Gaming & Activities
  gaming: {
    totalEarnings: {
      type: Number,
      default: 0
    },
    gamesPlayed: {
      type: Number,
      default: 0
    },
    highScore: {
      type: Number,
      default: 0
    }
  },
  dailyAdWatched: {
    type: Number,
    default: 0
  },
  lastAdWatchDate: {
    type: Date
  },
  lastGameDate: {
    type: Date
  },
  videoWatchRewardClaimed: {
    type: Boolean,
    default: false
  }
}, {
  timestamps: true
});

// Index for better query performance
UserSchema.index({ email: 1 });
UserSchema.index({ referralCode: 1 });
UserSchema.index({ referredBy: 1 });
UserSchema.index({ role: 1 });

// Pre-save middleware to hash password
UserSchema.pre('save', async function(next) {
  if (!this.isModified('password')) return next();
  
  try {
    const salt = await bcrypt.genSalt(12);
    this.password = await bcrypt.hash(this.password, salt);
    next();
  } catch (error: any) {
    next(error);
  }
});

// Method to compare password
UserSchema.methods.comparePassword = async function(candidatePassword: string): Promise<boolean> {
  return bcrypt.compare(candidatePassword, this.password);
};

// Method to generate referral code
UserSchema.methods.generateReferralCode = function(): string {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  let result = '';
  for (let i = 0; i < 8; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
};

// Static method to find by referral code
UserSchema.statics.findByReferralCode = function(referralCode: string) {
  return this.findOne({ referralCode });
};

export default mongoose.models.User || mongoose.model<IUser>('User', UserSchema);
