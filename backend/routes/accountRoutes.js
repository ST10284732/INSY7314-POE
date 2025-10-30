const express = require('express');
const { body } = require('express-validator');
const { authenticateToken } = require('../middlewares/authMiddleware');
const { requireCustomer } = require('../middlewares/roleMiddleware');
const { createAuthLimiter } = require('../middlewares/securityMiddleware');
const {
    getAccountBalance,
    getTransactions,
    depositFunds,
    updateMonthlySalary,
    getSpendingByCategory,
    recalculateBalance
} = require('../controllers/accountController');

const router = express.Router();

// Apply authentication and role-based access control to all routes
router.use(authenticateToken);
router.use(requireCustomer); // Only customers can access account features

// Apply rate limiting
router.use(createAuthLimiter());

/**
 * @route GET /v1/account/balance
 * @desc Get account balance and summary
 * @access Customer only
 */
router.get('/balance', getAccountBalance);

/**
 * @route GET /v1/account/transactions
 * @desc Get transaction history with filtering
 * @access Customer only
 */
router.get('/transactions', getTransactions);

/**
 * @route POST /v1/account/deposit
 * @desc Deposit funds to account
 * @access Customer only
 */
router.post('/deposit',
    [
        body('amount')
            .isFloat({ min: 0.01, max: 1000000 })
            .withMessage('Amount must be between 0.01 and 1,000,000'),
        body('description')
            .optional()
            .trim()
            .isLength({ max: 200 })
            .withMessage('Description cannot exceed 200 characters')
    ],
    depositFunds
);

/**
 * @route PATCH /v1/account/salary
 * @desc Update monthly salary for budgeting
 * @access Customer only
 */
router.patch('/salary',
    [
        body('monthlySalary')
            .isFloat({ min: 0 })
            .withMessage('Monthly salary must be 0 or greater')
    ],
    updateMonthlySalary
);

/**
 * @route GET /v1/account/spending
 * @desc Get spending by category for a specific month
 * @access Customer only
 */
router.get('/spending', getSpendingByCategory);

/**
 * @route POST /v1/account/recalculate-balance
 * @desc Recalculate account balance based on all transactions
 * @access Customer only
 */
router.post('/recalculate-balance', recalculateBalance);

module.exports = router;
