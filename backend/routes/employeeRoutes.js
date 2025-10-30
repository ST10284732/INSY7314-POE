const express = require('express');
const { body } = require('express-validator');
const { authenticateToken } = require('../middlewares/authMiddleware');
const { requireEmployee } = require('../middlewares/roleMiddleware');
const { createAuthLimiter } = require('../middlewares/securityMiddleware');
const {
    getPendingPayments,
    updatePaymentStatus,
    getPaymentHistory,
    getPaymentStatistics,
    getPaymentDetails
} = require('../controllers/employeeController');

const router = express.Router();

// Apply authentication and role-based access control to all routes
// All routes require authentication AND Employee role only
router.use(authenticateToken);
router.use(requireEmployee); // Requires Employee role only

// Apply rate limiting
router.use(createAuthLimiter());

/**
 * @route GET /v1/employee/payments/pending
 * @desc Get all pending payments
 * @access Employee only
 */
router.get('/payments/pending', getPendingPayments);

/**
 * @route GET /v1/employee/payments/history
 * @desc Get payment history (approved/denied)
 * @access Employee only
 */
router.get('/payments/history', getPaymentHistory);

/**
 * @route GET /v1/employee/payments/:id
 * @desc Get single payment details
 * @access Employee only
 */
router.get('/payments/:id', getPaymentDetails);

/**
 * @route PATCH /v1/employee/payments/:id/status
 * @desc Update payment status (approve/deny)
 * @access Employee only
 */
router.patch('/payments/:id/status', 
    [
        body('status')
            .notEmpty()
            .withMessage('Status is required')
            .isIn(['completed', 'failed', 'cancelled'])
            .withMessage('Status must be completed, failed, or cancelled'),
        body('reason')
            .optional()
            .isLength({ max: 500 })
            .withMessage('Reason cannot exceed 500 characters')
    ],
    updatePaymentStatus
);

/**
 * @route GET /v1/employee/stats
 * @desc Get payment statistics for employee dashboard
 * @access Employee only
 */
router.get('/stats', getPaymentStatistics);

module.exports = router;
