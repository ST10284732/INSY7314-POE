const mongoose = require('mongoose');

const beneficiarySchema = new mongoose.Schema({
  // User who owns this beneficiary
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true
  },
  
  // Beneficiary details
  name: {
    type: String,
    required: true,
    trim: true,
    maxlength: [100, 'Beneficiary name cannot exceed 100 characters']
  },
  
  // Nickname/alias for easy identification
  nickname: {
    type: String,
    trim: true,
    maxlength: [50, 'Nickname cannot exceed 50 characters']
  },
  
  // Bank details
  bankName: {
    type: String,
    required: true,
    trim: true,
    maxlength: [100, 'Bank name cannot exceed 100 characters']
  },
  
  accountNumber: {
    type: String,
    required: true,
    trim: true,
    maxlength: [34, 'Account number cannot exceed 34 characters']
  },
  
  swiftCode: {
    type: String,
    required: true,
    trim: true,
    uppercase: true,
    match: [/^[A-Z]{6}[A-Z0-9]{2}([A-Z0-9]{3})?$/, 'Invalid SWIFT code format']
  },
  
  // Payment provider
  provider: {
    type: String,
    required: true,
    enum: ['SWIFT', 'SEPA', 'ACH', 'WIRE', 'PAYPAL', 'WISE'],
    uppercase: true
  },
  
  // Currency preference for this beneficiary
  currency: {
    type: String,
    required: true,
    enum: ['USD', 'EUR', 'GBP', 'ZAR', 'JPY', 'CAD', 'AUD', 'CHF'],
    uppercase: true,
    default: 'ZAR'
  },
  
  // Optional reference/note
  defaultReference: {
    type: String,
    trim: true,
    maxlength: [140, 'Default reference cannot exceed 140 characters']
  },
  
  // Usage tracking
  lastUsed: {
    type: Date,
    default: null
  },
  
  usageCount: {
    type: Number,
    default: 0,
    min: 0
  },
  
  // Status
  isActive: {
    type: Boolean,
    default: true
  },
  
  // Favorite flag for quick access
  isFavorite: {
    type: Boolean,
    default: false
  },
  
  // Timestamps
  createdAt: {
    type: Date,
    default: Date.now
  },
  
  updatedAt: {
    type: Date,
    default: Date.now
  }
}, {
  timestamps: true
});

// Indexes for faster queries
beneficiarySchema.index({ userId: 1, name: 1 });
beneficiarySchema.index({ userId: 1, isFavorite: -1 });
beneficiarySchema.index({ userId: 1, lastUsed: -1 });

// Prevent duplicate beneficiaries for the same user (same account number)
beneficiarySchema.index(
  { userId: 1, accountNumber: 1 }, 
  { unique: true, sparse: true }
);

// Update timestamp before saving
beneficiarySchema.pre('save', function(next) {
  this.updatedAt = new Date();
  next();
});

// Instance method to mark as used
beneficiarySchema.methods.markAsUsed = async function() {
  this.lastUsed = new Date();
  this.usageCount += 1;
  await this.save();
};

// Static method to get user's beneficiaries with pagination
beneficiarySchema.statics.getUserBeneficiaries = function(userId, options = {}) {
  const {
    page = 1,
    limit = 20,
    sortBy = 'name',
    sortOrder = 'asc',
    favorites = false
  } = options;
  
  const skip = (page - 1) * limit;
  const query = { userId, isActive: true };
  
  if (favorites) {
    query.isFavorite = true;
  }
  
  const sortOptions = {};
  sortOptions[sortBy] = sortOrder === 'asc' ? 1 : -1;
  
  return this.find(query)
    .sort(sortOptions)
    .skip(skip)
    .limit(limit);
};

// Static method to get frequently used beneficiaries
beneficiarySchema.statics.getFrequentlyUsed = function(userId, limit = 5) {
  return this.find({ userId, isActive: true })
    .sort({ usageCount: -1, lastUsed: -1 })
    .limit(limit);
};

// Virtual for display name (nickname or name)
beneficiarySchema.virtual('displayName').get(function() {
  return this.nickname || this.name;
});

// Ensure virtuals are included in JSON
beneficiarySchema.set('toJSON', { virtuals: true });
beneficiarySchema.set('toObject', { virtuals: true });

module.exports = mongoose.model('Beneficiary', beneficiarySchema);
