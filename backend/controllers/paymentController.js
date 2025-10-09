const Payment = require('../models/paymentModel');
const User = require('../models/userModel');
const mongoose = require('mongoose');
const { body, validationResult } = require('express-validator');
const mongoSanitize = require('mongo-sanitize');

// Enhanced validation rules for payment creation
const paymentValidation = [
  body('amount')
    .isFloat({ min: 0.01, max: 1000000 })
    .withMessage('Amount must be between 0.01 and 1,000,000'),
  
  body('currency')
    .isIn(['USD', 'EUR', 'GBP', 'ZAR', 'JPY', 'CAD', 'AUD', 'CHF'])
    .withMessage('Currency must be one of: USD, EUR, GBP, ZAR, JPY, CAD, AUD, CHF'),
  
  body('recipientName')
    .trim()
    .isLength({ min: 2, max: 100 })
    .matches(/^[a-zA-Z\s\-'\.]+$/)
    .withMessage('Recipient name must be 2-100 characters (letters, spaces, hyphens, apostrophes, dots only)'),
  
  body('recipientBank')
    .trim()
    .isLength({ min: 2, max: 100 })
    .matches(/^[a-zA-Z0-9\s\-'\.&]+$/)
    .withMessage('Recipient bank must be 2-100 characters'),
  
  body('recipientAccount')
    .trim()
    .isLength({ min: 5, max: 35 })
    .matches(/^[a-zA-Z0-9\-]+$/)
    .withMessage('Recipient account must be 5-35 alphanumeric characters (hyphens allowed)'),
  
  body('swiftCode')
    .trim()
    .matches(/^[A-Z]{6}[A-Z0-9]{2}([A-Z0-9]{3})?$/)
    .withMessage('SWIFT code must be 8 or 11 characters (format: AAAAAABB or AAAAAAABBBBB)'),
  
  body('provider')
    .isIn(['SWIFT', 'SEPA', 'ACH', 'WIRE', 'PAYPAL', 'WISE'])
    .withMessage('Provider must be one of: SWIFT, SEPA, ACH, WIRE, PAYPAL, WISE'),
  
  body('paymentReference')
    .trim()
    .isLength({ min: 3, max: 50 })
    .matches(/^[a-zA-Z0-9\s\-_\.\/]+$/)
    .withMessage('Payment reference must be 3-50 characters (alphanumeric, spaces, hyphens, underscores, dots, slashes)')
];

// Input validation utilities
const validatePaymentInput = (paymentData) => {
  const errors = [];
  
  // Amount validation
  if (!paymentData.amount || isNaN(paymentData.amount)) {
    errors.push('Valid amount is required');
  } else if (paymentData.amount <= 0) {
    errors.push('Amount must be greater than 0');
  } else if (paymentData.amount > 1000000) {
    errors.push('Amount cannot exceed 1,000,000');
  }
  
  // Currency validation
  const validCurrencies = ['USD', 'EUR', 'GBP', 'ZAR', 'JPY', 'CAD', 'AUD', 'CHF'];
  if (!paymentData.currency || !validCurrencies.includes(paymentData.currency.toUpperCase())) {
    errors.push('Valid currency is required');
  }
  
  // Recipient validation
  if (!paymentData.recipientName || paymentData.recipientName.trim().length < 2) {
    errors.push('Recipient name must be at least 2 characters');
  }
  
  if (!paymentData.recipientBank || paymentData.recipientBank.trim().length < 2) {
    errors.push('Recipient bank is required');
  }
  
  if (!paymentData.recipientAccount || paymentData.recipientAccount.trim().length < 5) {
    errors.push('Valid recipient account number is required');
  }
  
  // SWIFT code validation
  const swiftRegex = /^[A-Z]{6}[A-Z0-9]{2}([A-Z0-9]{3})?$/;
  if (!paymentData.swiftCode || !swiftRegex.test(paymentData.swiftCode.toUpperCase())) {
    errors.push('Valid SWIFT code is required (8 or 11 characters)');
  }
  
  // Provider validation
  const validProviders = ['SWIFT', 'SEPA', 'ACH', 'WIRE', 'PAYPAL', 'WISE'];
  if (!paymentData.provider || !validProviders.includes(paymentData.provider.toUpperCase())) {
    errors.push('Valid payment provider is required');
  }
  
  // Payment reference validation
  if (!paymentData.paymentReference || paymentData.paymentReference.trim().length < 3) {
    errors.push('Payment reference must be at least 3 characters');
  }
  
  return errors;
};

// Sanitize input to prevent NoSQL injection
const sanitizeInput = (input) => {
  if (typeof input === 'string') {
    // Remove potential MongoDB operators and dangerous characters
    return input.replace(/[${}]/g, '').trim();
  }
  return input;
};

/**
 * Create a new international payment with enhanced security
 * POST /v1/payments
 */
const createPayment = async (req, res) => {
  try {
    // Check validation results from express-validator
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors: errors.array()
      });
    }

    // Get user IP and User-Agent for security tracking
    const clientIP = req.ip || req.connection.remoteAddress || 'unknown';
    const userAgent = req.get('User-Agent') || 'unknown';
    
    // Enhanced input sanitization using mongo-sanitize
    const sanitizedData = mongoSanitize(req.body);
    
    // Additional manual validation (legacy support)
    const additionalErrors = validatePaymentInput(sanitizedData);
    if (additionalErrors.length > 0) {
      return res.status(400).json({
        success: false,
        message: 'Additional validation failed',
        errors: additionalErrors
      });
    }
    
    // Verify user exists
    const user = await User.findById(req.user.userId);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }
    
    // Create payment object
    const paymentData = {
      userId: req.user.userId,
      amount: parseFloat(sanitizedData.amount),
      currency: sanitizedData.currency.toUpperCase(),
      recipientName: sanitizedData.recipientName.trim(),
      recipientBank: sanitizedData.recipientBank.trim(),
      recipientAccount: sanitizedData.recipientAccount.trim(),
      swiftCode: sanitizedData.swiftCode.toUpperCase().trim(),
      provider: sanitizedData.provider.toUpperCase(),
      paymentReference: sanitizedData.paymentReference.trim(),
      status: 'pending', // Always starts as pending
      createdIP: clientIP,
      userAgent: userAgent
    };
    
    // Create and save payment
    const payment = new Payment(paymentData);
    await payment.save();
    
    // Log successful payment creation (without sensitive data)
    console.log(`Payment created: ${payment.paymentId} for user: ${user.username}`);
    
    res.status(201).json({
      success: true,
      message: 'Payment created successfully',
      payment: {
        id: payment._id,
        paymentId: payment.paymentId,
        amount: payment.amount,
        currency: payment.currency,
        recipientName: payment.recipientName,
        recipientBank: payment.recipientBank,
        provider: payment.provider,
        status: payment.status,
        createdAt: payment.createdAt
      }
    });
    
  } catch (error) {
    console.error('Payment creation error:', error.message);
    
    // Handle duplicate payment ID (very rare)
    if (error.code === 11000 && error.keyPattern?.paymentId) {
      return res.status(500).json({
        success: false,
        message: 'Payment processing error. Please try again.'
      });
    }
    
    res.status(500).json({
      success: false,
      message: 'Internal server error during payment creation'
    });
  }
};

/**
 * Get user's payments with pagination
 * GET /v1/payments
 */
const getUserPayments = async (req, res) => {
  try {
    const page = Math.max(1, parseInt(req.query.page) || 1);
    const limit = Math.min(50, Math.max(1, parseInt(req.query.limit) || 10));
    const status = sanitizeInput(req.query.status);
    
    // Build query
    const query = { userId: req.user.userId };
    if (status && ['pending', 'processing', 'completed', 'failed', 'cancelled'].includes(status.toLowerCase())) {
      query.status = status.toLowerCase();
    }
    
    // Get payments with pagination
    const skip = (page - 1) * limit;
    const payments = await Payment.find(query)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .select('-createdIP -userAgent'); // Exclude sensitive fields
    
    // Get total count for pagination
    const totalPayments = await Payment.countDocuments(query);
    const totalPages = Math.ceil(totalPayments / limit);
    
    res.status(200).json({
      success: true,
      message: 'Payments retrieved successfully',
      data: {
        payments: payments,
        pagination: {
          currentPage: page,
          totalPages: totalPages,
          totalPayments: totalPayments,
          hasNextPage: page < totalPages,
          hasPrevPage: page > 1
        }
      }
    });
    
  } catch (error) {
    console.error('Get payments error:', error.message);
    res.status(500).json({
      success: false,
      message: 'Internal server error while retrieving payments'
    });
  }
};

/**
 * Get single payment by ID
 * GET /v1/payments/:id
 */
const getPaymentById = async (req, res) => {
  try {
    const paymentId = sanitizeInput(req.params.id);
    
    // Validate ObjectId format
    if (!mongoose.Types.ObjectId.isValid(paymentId)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid payment ID format'
      });
    }
    
    // Find payment and verify ownership
    const payment = await Payment.findOne({
      _id: paymentId,
      userId: req.user.userId
    }).select('-createdIP -userAgent');
    
    if (!payment) {
      return res.status(404).json({
        success: false,
        message: 'Payment not found'
      });
    }
    
    res.status(200).json({
      success: true,
      message: 'Payment retrieved successfully',
      payment: payment
    });
    
  } catch (error) {
    console.error('Get payment by ID error:', error.message);
    res.status(500).json({
      success: false,
      message: 'Internal server error while retrieving payment'
    });
  }
};

/**
 * Get payment statistics for user dashboard
 * GET /v1/payments/stats
 */
const getPaymentStats = async (req, res) => {
  try {
    const userId = req.user.userId;
    
    // Aggregate payment statistics  
    const stats = await Payment.aggregate([
      { $match: { userId: new mongoose.Types.ObjectId(userId) } },
      {
        $group: {
          _id: null,
          totalPayments: { $sum: 1 },
          totalAmount: { $sum: '$amount' },
          pendingPayments: {
            $sum: { $cond: [{ $eq: ['$status', 'pending'] }, 1, 0] }
          },
          completedPayments: {
            $sum: { $cond: [{ $eq: ['$status', 'completed'] }, 1, 0] }
          },
          failedPayments: {
            $sum: { $cond: [{ $eq: ['$status', 'failed'] }, 1, 0] }
          }
        }
      }
    ]);
    
    const result = stats[0] || {
      totalPayments: 0,
      totalAmount: 0,
      pendingPayments: 0,
      completedPayments: 0,
      failedPayments: 0
    };
    
    res.status(200).json({
      success: true,
      message: 'Payment statistics retrieved successfully',
      stats: result
    });
    
  } catch (error) {
    console.error('Get payment stats error:', error.message);
    res.status(500).json({
      success: false,
      message: 'Internal server error while retrieving statistics'
    });
  }
};

module.exports = {
  createPayment,
  getUserPayments,
  getPaymentById,
  getPaymentStats,
  paymentValidation
};