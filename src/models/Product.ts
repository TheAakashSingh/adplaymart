import mongoose, { Schema } from 'mongoose';
import { IProduct } from '@/types';

const ProductSchema = new Schema<IProduct>({
  name: {
    type: String,
    required: [true, 'Product name is required'],
    trim: true,
    maxlength: [100, 'Product name cannot exceed 100 characters']
  },
  description: {
    type: String,
    required: [true, 'Product description is required'],
    maxlength: [2000, 'Description cannot exceed 2000 characters']
  },
  price: {
    type: Number,
    required: [true, 'Product price is required'],
    min: [0, 'Price cannot be negative']
  },
  discountPrice: {
    type: Number,
    min: [0, 'Discount price cannot be negative'],
    validate: {
      validator: function(this: IProduct, value: number) {
        return !value || value < this.price;
      },
      message: 'Discount price must be less than original price'
    }
  },
  images: [{
    type: String,
    required: true
  }],
  category: {
    type: String,
    required: [true, 'Product category is required'],
    trim: true
  },
  subcategory: {
    type: String,
    trim: true
  },
  vendor: {
    type: String,
    ref: 'Vendor',
    required: [true, 'Vendor is required']
  },
  stock: {
    type: Number,
    required: [true, 'Stock quantity is required'],
    min: [0, 'Stock cannot be negative']
  },
  isActive: {
    type: Boolean,
    default: true
  },
  tags: [{
    type: String,
    trim: true
  }],
  specifications: {
    type: Schema.Types.Mixed,
    default: {}
  },
  ratings: {
    average: {
      type: Number,
      default: 0,
      min: [0, 'Rating cannot be negative'],
      max: [5, 'Rating cannot exceed 5']
    },
    count: {
      type: Number,
      default: 0,
      min: [0, 'Rating count cannot be negative']
    }
  }
}, {
  timestamps: true
});

// Indexes for better query performance
ProductSchema.index({ name: 'text', description: 'text', tags: 'text' });
ProductSchema.index({ category: 1 });
ProductSchema.index({ vendor: 1 });
ProductSchema.index({ price: 1 });
ProductSchema.index({ isActive: 1 });
ProductSchema.index({ 'ratings.average': -1 });

// Virtual for effective price (considering discount)
ProductSchema.virtual('effectivePrice').get(function() {
  return this.discountPrice || this.price;
});

// Virtual for discount percentage
ProductSchema.virtual('discountPercentage').get(function() {
  if (!this.discountPrice) return 0;
  return Math.round(((this.price - this.discountPrice) / this.price) * 100);
});

// Method to check if product is in stock
ProductSchema.methods.isInStock = function(quantity: number = 1): boolean {
  return this.stock >= quantity;
};

// Method to update stock
ProductSchema.methods.updateStock = function(quantity: number, operation: 'add' | 'subtract' = 'subtract') {
  if (operation === 'subtract') {
    this.stock = Math.max(0, this.stock - quantity);
  } else {
    this.stock += quantity;
  }
  return this.save();
};

// Static method to find products by category
ProductSchema.statics.findByCategory = function(category: string, isActive: boolean = true) {
  return this.find({ category, isActive }).populate('vendor');
};

// Static method to search products
ProductSchema.statics.searchProducts = function(searchTerm: string, filters: any = {}) {
  const query = {
    $text: { $search: searchTerm },
    isActive: true,
    ...filters
  };
  
  return this.find(query, { score: { $meta: 'textScore' } })
    .sort({ score: { $meta: 'textScore' } })
    .populate('vendor');
};

export default mongoose.models.Product || mongoose.model<IProduct>('Product', ProductSchema);
