const mongoose = require('mongoose');

const paymentSchema = new mongoose.Schema({
  // User who created the payment
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  
  // Payment details
  amount: {
    type: Number,
    required: true,
    min: [0.01, 'Amount must be greater than 0'],
    max: [1000000, 'Amount cannot exceed 1,000,000']
  },
  
  currency: {
    type: String,
    required: true,
    enum: ['USD', 'EUR', 'GBP', 'ZAR', 'JPY', 'CAD', 'AUD', 'CHF'],
    uppercase: true
  },
  
  // Recipient details
  recipientName: {
    type: String,
    required: true,
    trim: true,
    maxlength: [100, 'Recipient name cannot exceed 100 characters']
  },
  
  recipientBank: {
    type: String,
    required: true,
    trim: true,
    maxlength: [100, 'Bank name cannot exceed 100 characters']
  },
  
  recipientAccount: {
    type: String,
    required: true,
    trim: true,
    maxlength: [34, 'Account number cannot exceed 34 characters'] // IBAN max length
  },
  
  // SWIFT code for international transfers
  swiftCode: {
    type: String,
    required: true,
    trim: true,
    uppercase: true,
    match: [/^[A-Z]{6}[A-Z0-9]{2}([A-Z0-9]{3})?$/, 'Invalid SWIFT code format']
  },
  
  // Payment provider (bank, service)
  provider: {
    type: String,
    required: true,
    enum: ['SWIFT', 'SEPA', 'ACH', 'WIRE', 'PAYPAL', 'WISE'],
    uppercase: true
  },
  
  // Payment purpose/reference
  paymentReference: {
    type: String,
    required: true,
    trim: true,
    maxlength: [140, 'Payment reference cannot exceed 140 characters']
  },
  
  // Payment status - starts as pending for Part 2
  status: {
    type: String,
    required: true,
    enum: ['pending', 'processing', 'completed', 'failed', 'cancelled'],
    default: 'pending',
    lowercase: true
  },
  
  // Additional metadata
  paymentId: {
    type: String,
    unique: true
  },
  
  // Timestamps
  createdAt: {
    type: Date,
    default: Date.now
  },
  
  updatedAt: {
    type: Date,
    default: Date.now
  },
  
  // Security tracking
  createdIP: {
    type: String,
    required: true
  },
  
  userAgent: {
    type: String,
    required: true
  },
  
  // Status history for audit trail
  statusHistory: [{
    from: String,
    to: String,
    updatedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    updatedByUsername: String,
    reason: String,
    timestamp: {
      type: Date,
      default: Date.now
    }
  }]
}, {
  timestamps: true // Automatically manage createdAt and updatedAt
});

// Index for faster queries
paymentSchema.index({ userId: 1, createdAt: -1 });
paymentSchema.index({ status: 1 });

// Generate unique payment ID before saving
paymentSchema.pre('save', async function(next) {
  if (this.isNew) {
    // Generate payment ID: PAY + timestamp + random
    const timestamp = Date.now().toString(36).toUpperCase();
    const random = Math.random().toString(36).substring(2, 8).toUpperCase();
    this.paymentId = `PAY${timestamp}${random}`;
  }
  this.updatedAt = new Date();
  next();
});

// Virtual for formatted amount
paymentSchema.virtual('formattedAmount').get(function() {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: this.currency || 'USD'
  }).format(this.amount);
});

// Instance method to check if payment can be cancelled
paymentSchema.methods.canBeCancelled = function() {
  return ['pending', 'processing'].includes(this.status);
};

// Static method to get user payments with pagination
paymentSchema.statics.getUserPayments = function(userId, page = 1, limit = 10) {
  const skip = (page - 1) * limit;
  return this.find({ userId })
    .sort({ createdAt: -1 })
    .skip(skip)
    .limit(limit)
    .populate('userId', 'username firstname lastname');
};

// Security: Remove sensitive data when converting to JSON
paymentSchema.methods.toJSON = function() {
  const payment = this.toObject();
  delete payment.createdIP;
  delete payment.userAgent;
  return payment;
};

module.exports = mongoose.model('Payment', paymentSchema);