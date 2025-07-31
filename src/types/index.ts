import { Document } from 'mongoose';

// User Types
export interface IUser extends Document {
  _id: string;
  username: string;
  email: string;
  password: string;
  phone: string;
  role: 'user' | 'vendor' | 'admin';
  isActive: boolean;
  isEmailVerified: boolean;
  profileImage?: string;
  
  // MLM Fields
  referralCode: string;
  referredBy?: string;
  sponsorId?: string;
  level: number;
  totalReferrals: number;
  directReferrals: string[];
  teamMembers: string[];
  
  // Wallet Fields
  wallets: {
    upgrade: number;
    withdrawal: number;
  };
  totalEarnings: number;
  totalWithdrawals: number;
  
  // Package & Investment
  currentPackage?: string;
  packageActivatedAt?: Date;
  investmentAmount: number;
  
  // Gaming & Activities
  gaming: {
    totalEarnings: number;
    gamesPlayed: number;
    highScore: number;
  };
  dailyAdWatched: number;
  lastAdWatchDate?: Date;
  lastGameDate?: Date;
  videoWatchRewardClaimed: boolean;
  
  createdAt: Date;
  updatedAt: Date;
}

// Product Types
export interface IProduct extends Document {
  _id: string;
  name: string;
  description: string;
  price: number;
  discountPrice?: number;
  images: string[];
  category: string;
  subcategory?: string;
  vendor: string;
  stock: number;
  isActive: boolean;
  tags: string[];
  specifications?: Record<string, any>;
  ratings: {
    average: number;
    count: number;
  };
  createdAt: Date;
  updatedAt: Date;
}

// Vendor Types
export interface IVendor extends Document {
  _id: string;
  userId: string;
  businessName: string;
  businessType: string;
  gstNumber?: string;
  panNumber?: string;
  businessAddress: {
    street: string;
    city: string;
    state: string;
    pincode: string;
    country: string;
  };
  bankDetails: {
    accountNumber: string;
    ifscCode: string;
    bankName: string;
    accountHolderName: string;
  };
  isVerified: boolean;
  verificationDocuments: string[];
  totalSales: number;
  totalOrders: number;
  rating: number;
  createdAt: Date;
  updatedAt: Date;
}

// Package Types
export interface IPackage extends Document {
  _id: string;
  name: string;
  price: number;
  description: string;
  features: string[];
  dailyIncome: number;
  validity: number; // in days
  gameReward: number;
  adReward: number;
  videoReward: number;
  levelIncomePercentage: number[];
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

// Transaction Types
export interface ITransaction extends Document {
  _id: string;
  userId: string;
  type: 'deposit' | 'withdrawal' | 'referral_bonus' | 'level_income' | 'game_reward' | 'ad_reward' | 'video_reward' | 'purchase';
  amount: number;
  status: 'pending' | 'completed' | 'failed' | 'cancelled';
  description: string;
  referenceId?: string;
  paymentMethod?: string;
  tdsAmount?: number;
  netAmount: number;
  createdAt: Date;
  updatedAt: Date;
}

// Order Types
export interface IOrder extends Document {
  _id: string;
  userId: string;
  vendorId: string;
  products: {
    productId: string;
    quantity: number;
    price: number;
    name: string;
  }[];
  totalAmount: number;
  shippingAddress: {
    name: string;
    phone: string;
    street: string;
    city: string;
    state: string;
    pincode: string;
    country: string;
  };
  paymentMethod: 'cod' | 'online' | 'wallet';
  paymentStatus: 'pending' | 'paid' | 'failed';
  orderStatus: 'placed' | 'confirmed' | 'shipped' | 'delivered' | 'cancelled';
  trackingId?: string;
  deliveredAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

// Admin Settings Types
export interface IAdminSettings extends Document {
  _id: string;
  key: string;
  value: any;
  description: string;
  category: 'mlm' | 'gaming' | 'payment' | 'general';
  updatedBy: string;
  createdAt: Date;
  updatedAt: Date;
}

// Gaming Activity Types
export interface IGamingActivity extends Document {
  _id: string;
  userId: string;
  activityType: 'video_watch' | 'ad_watch' | 'game_play';
  reward: number;
  date: Date;
  packageId?: string;
  createdAt: Date;
}

// Withdrawal Request Types
export interface IWithdrawalRequest extends Document {
  _id: string;
  userId: string;
  amount: number;
  tdsAmount: number;
  netAmount: number;
  bankDetails: {
    accountNumber: string;
    ifscCode: string;
    bankName: string;
    accountHolderName: string;
  };
  status: 'pending' | 'approved' | 'rejected' | 'processed';
  adminNotes?: string;
  processedBy?: string;
  processedAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

// API Response Types
export interface ApiResponse<T = any> {
  success: boolean;
  message: string;
  data?: T;
  error?: string;
}

// Dashboard Stats Types
export interface DashboardStats {
  totalUsers: number;
  totalVendors: number;
  totalProducts: number;
  totalOrders: number;
  totalRevenue: number;
  pendingWithdrawals: number;
  activePackages: number;
  todayEarnings: number;
}

// MLM Tree Node Type
export interface MLMTreeNode {
  userId: string;
  username: string;
  level: number;
  package: string;
  joinDate: Date;
  totalEarnings: number;
  children: MLMTreeNode[];
}
