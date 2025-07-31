import mongoose, { Schema } from 'mongoose';
import { IAdminSettings } from '@/types';

const AdminSettingsSchema = new Schema<IAdminSettings>({
  key: {
    type: String,
    required: [true, 'Setting key is required'],
    unique: true,
    trim: true,
    uppercase: true
  },
  value: {
    type: Schema.Types.Mixed,
    required: [true, 'Setting value is required']
  },
  description: {
    type: String,
    required: [true, 'Setting description is required'],
    maxlength: [200, 'Description cannot exceed 200 characters']
  },
  category: {
    type: String,
    enum: ['mlm', 'gaming', 'payment', 'general'],
    required: [true, 'Setting category is required']
  },
  updatedBy: {
    type: String,
    ref: 'User',
    required: [true, 'Updated by user ID is required']
  }
}, {
  timestamps: true
});

// Indexes for better query performance
AdminSettingsSchema.index({ key: 1 });
AdminSettingsSchema.index({ category: 1 });

// Static method to get setting by key
AdminSettingsSchema.statics.getSetting = function(key: string) {
  return this.findOne({ key: key.toUpperCase() });
};

// Static method to update setting
AdminSettingsSchema.statics.updateSetting = function(key: string, value: any, updatedBy: string) {
  return this.findOneAndUpdate(
    { key: key.toUpperCase() },
    { value, updatedBy },
    { new: true, upsert: false }
  );
};

// Static method to get settings by category
AdminSettingsSchema.statics.getSettingsByCategory = function(category: string) {
  return this.find({ category }).sort({ key: 1 });
};

// Static method to get all settings
AdminSettingsSchema.statics.getAllSettings = function() {
  return this.find({}).sort({ category: 1, key: 1 });
};

export default mongoose.models.AdminSettings || mongoose.model<IAdminSettings>('AdminSettings', AdminSettingsSchema);
