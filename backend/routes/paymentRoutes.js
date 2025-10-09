const express = require('express');
const router = express.Router();
const {
  createPayment,
  getUserPayments,
  getPaymentById,
  getPaymentStats,
  paymentValidation
} = require('../controllers/paymentController');
const { authenticateToken } = require('../middlewares/authMiddleware');
const { createPaymentLimiter } = require('../middlewares/securityMiddleware');

// All payment routes require authentication and have payment-specific rate limiting
router.use(authenticateToken);
router.use(createPaymentLimiter());

/**
 * @route POST /v1/payments
 * @desc Create a new international payment with comprehensive validation
 * @access Private (authenticated users only)
 * @body amount - Payment amount (0.01 - 1,000,000)
 * @body currency - Currency code (USD, EUR, GBP, ZAR, JPY, CAD, AUD, CHF)
 * @body recipientName - Recipient full name
 * @body recipientBank - Recipient bank name
 * @body recipientAccount - Recipient account number
 * @body swiftCode - Bank SWIFT code (8 or 11 characters)
 * @body provider - Payment provider (SWIFT, SEPA, ACH, WIRE, PAYPAL, WISE)
 * @body paymentReference - Payment reference/description
 */
router.post('/', paymentValidation, createPayment);

/**
 * @route GET /v1/payments
 * @desc Get user's payments with pagination and filtering
 * @access Private (authenticated users only)
 * @query page - Page number (default: 1)
 * @query limit - Items per page (default: 10, max: 50)
 * @query status - Filter by status (pending, processing, completed, failed, cancelled)
 */
router.get('/', getUserPayments);

/**
 * @route GET /v1/payments/stats
 * @desc Get payment statistics for user dashboard
 * @access Private (authenticated users only)
 */
router.get('/stats', getPaymentStats);

/**
 * @route GET /v1/payments/:id
 * @desc Get single payment by ID
 * @access Private (authenticated users only)
 */
router.get('/:id', getPaymentById);

module.exports = router;