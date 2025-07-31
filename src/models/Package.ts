import mongoose, { Schema } from 'mongoose';
import { IPackage } from '@/types';

const PackageSchema = new Schema<IPackage>({
  name: {
    type: String,
    required: [true, 'Package name is required'],
    trim: true,
    unique: true,
    maxlength: [50, 'Package name cannot exceed 50 characters']
  },
  price: {
    type: Number,
    required: [true, 'Package price is required'],
    min: [500, 'Package price must be at least ₹500'],
    max: [100000, 'Package price cannot exceed ₹1,00,000']
  },
  description: {
    type: String,
    required: [true, 'Package description is required'],
    maxlength: [500, 'Description cannot exceed 500 characters']
  },
  features: [{
    type: String,
    required: true,
    trim: true
  }],
  dailyIncome: {
    type: Number,
    required: [true, 'Daily income is required'],
    min: [0, 'Daily income cannot be negative']
  },
  validity: {
    type: Number,
    required: [true, 'Package validity is required'],
    min: [1, 'Validity must be at least 1 day'],
    max: [365, 'Validity cannot exceed 365 days']
  },
  gameReward: {
    type: Number,
    required: [true, 'Game reward is required'],
    min: [0, 'Game reward cannot be negative'],
    default: 200
  },
  adReward: {
    type: Number,
    required: [true, 'Ad reward is required'],
    min: [0, 'Ad reward cannot be negative'],
    default: 100
  },
  videoReward: {
    type: Number,
    required: [true, 'Video reward is required'],
    min: [0, 'Video reward cannot be negative'],
    default: 100
  },
  levelIncomePercentage: [{
    type: Number,
    min: [0, 'Level income percentage cannot be negative'],
    max: [50, 'Level income percentage cannot exceed 50%']
  }],
  isActive: {
    type: Boolean,
    default: true
  }
}, {
  timestamps: true
});

// Indexes for better query performance
PackageSchema.index({ price: 1 });
PackageSchema.index({ isActive: 1 });
// Note: name field already has unique index from schema definition

// Virtual for total potential earnings
PackageSchema.virtual('totalPotentialEarnings').get(function() {
  return this.dailyIncome * this.validity;
});

// Virtual for ROI percentage
PackageSchema.virtual('roiPercentage').get(function() {
  const totalEarnings = this.dailyIncome * this.validity;
  return Math.round(((totalEarnings - this.price) / this.price) * 100);
});

// Method to check if package is active
PackageSchema.methods.isPackageActive = function(): boolean {
  return this.isActive;
};

// Method to calculate level income for a specific level
PackageSchema.methods.getLevelIncomePercentage = function(level: number): number {
  if (level < 1 || level > this.levelIncomePercentage.length) {
    return 0;
  }
  return this.levelIncomePercentage[level - 1] || 0;
};

// Method to calculate total level income percentage
PackageSchema.methods.getTotalLevelIncomePercentage = function(): number {
  return this.levelIncomePercentage.reduce((total, percentage) => total + percentage, 0);
};

// Static method to find active packages
PackageSchema.statics.findActivePackages = function() {
  return this.find({ isActive: true }).sort({ price: 1 });
};

// Static method to find packages by price range
PackageSchema.statics.findByPriceRange = function(minPrice: number, maxPrice: number) {
  return this.find({
    price: { $gte: minPrice, $lte: maxPrice },
    isActive: true
  }).sort({ price: 1 });
};

// Pre-save middleware to ensure level income percentages don't exceed 100%
PackageSchema.pre('save', function(next) {
  const totalPercentage = this.levelIncomePercentage.reduce((total, percentage) => total + percentage, 0);
  
  if (totalPercentage > 100) {
    const error = new Error('Total level income percentage cannot exceed 100%');
    return next(error);
  }
  
  next();
});

export default mongoose.models.Package || mongoose.model<IPackage>('Package', PackageSchema);
