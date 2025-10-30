const mongoose = require('mongoose');

const transactionSchema = new mongoose.Schema({
  // User who owns this transaction
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true
  },
  
  // Transaction type
  type: {
    type: String,
    required: true,
    enum: ['deposit', 'withdrawal', 'payment', 'transfer', 'salary', 'refund'],
    lowercase: true
  },
  
  // Amount (positive for credits, negative for debits)
  amount: {
    type: Number,
    required: true
  },
  
  // Currency
  currency: {
    type: String,
    required: true,
    enum: ['USD', 'EUR', 'GBP', 'ZAR', 'JPY', 'CAD', 'AUD', 'CHF'],
    uppercase: true,
    default: 'USD'
  },
  
  // Category for budgeting
  category: {
    type: String,
    enum: ['salary', 'groceries', 'rent', 'utilities', 'entertainment', 'transport', 'healthcare', 'shopping', 'dining', 'education', 'other'],
    default: 'other',
    lowercase: true
  },
  
  // Description
  description: {
    type: String,
    required: true,
    trim: true,
    maxlength: 200
  },
  
  // Reference to payment if this is a payment transaction
  paymentId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Payment'
  },
  
  // Recipient/sender information
  relatedParty: {
    name: String,
    accountNumber: String
  },
  
  // Balance after this transaction
  balanceAfter: {
    type: Number,
    required: true
  },
  
  // Transaction status
  status: {
    type: String,
    enum: ['pending', 'completed', 'failed', 'reversed'],
    default: 'completed',
    lowercase: true
  },
  
  // Metadata
  metadata: {
    ip: String,
    userAgent: String,
    location: String
  },
  
  // Timestamps
  transactionDate: {
    type: Date,
    default: Date.now,
    index: true
  }
}, {
  timestamps: true
});

// Indexes for performance
transactionSchema.index({ userId: 1, transactionDate: -1 });
transactionSchema.index({ userId: 1, category: 1 });
transactionSchema.index({ userId: 1, type: 1 });

// Virtual for formatted amount
transactionSchema.virtual('formattedAmount').get(function() {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: this.currency || 'USD'
  }).format(Math.abs(this.amount));
});

// Method to check if transaction is a credit (money in)
transactionSchema.methods.isCredit = function() {
  return this.amount > 0;
};

// Method to check if transaction is a debit (money out)
transactionSchema.methods.isDebit = function() {
  return this.amount < 0;
};

// Static method to get user's transaction summary
transactionSchema.statics.getUserSummary = async function(userId, startDate, endDate) {
  const summary = await this.aggregate([
    {
      $match: {
        userId: mongoose.Types.ObjectId(userId),
        transactionDate: {
          $gte: startDate || new Date(0),
          $lte: endDate || new Date()
        },
        status: 'completed'
      }
    },
    {
      $group: {
        _id: '$type',
        total: { $sum: '$amount' },
        count: { $sum: 1 }
      }
    }
  ]);
  
  return summary;
};

// Static method to get spending by category
transactionSchema.statics.getSpendingByCategory = async function(userId, month, year) {
  const startDate = new Date(year, month - 1, 1);
  const endDate = new Date(year, month, 0, 23, 59, 59);
  
  const spending = await this.aggregate([
    {
      $match: {
        userId: mongoose.Types.ObjectId(userId),
        transactionDate: { $gte: startDate, $lte: endDate },
        amount: { $lt: 0 }, // Only debits
        status: 'completed'
      }
    },
    {
      $group: {
        _id: '$category',
        total: { $sum: { $abs: '$amount' } },
        count: { $sum: 1 }
      }
    },
    {
      $sort: { total: -1 }
    }
  ]);
  
  return spending;
};

module.exports = mongoose.model('Transaction', transactionSchema);
