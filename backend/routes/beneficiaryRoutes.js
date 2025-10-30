const express = require('express');
const { body } = require('express-validator');
const { authenticateToken } = require('../middlewares/authMiddleware');
const { requireCustomer } = require('../middlewares/roleMiddleware');
const { createAuthLimiter } = require('../middlewares/securityMiddleware');
const {
    getBeneficiaries,
    getBeneficiary,
    createBeneficiary,
    updateBeneficiary,
    deleteBeneficiary,
    getFrequentBeneficiaries,
    toggleFavorite
} = require('../controllers/beneficiaryController');

const router = express.Router();

// Apply authentication and role-based access control to all routes
router.use(authenticateToken);
router.use(requireCustomer); // Only customers can manage beneficiaries

// Apply rate limiting
router.use(createAuthLimiter());

/**
 * @route GET /v1/beneficiaries/frequent
 * @desc Get frequently used beneficiaries
 * @access Customer only
 */
router.get('/frequent', getFrequentBeneficiaries);

/**
 * @route GET /v1/beneficiaries
 * @desc Get all beneficiaries for the current user
 * @access Customer only
 */
router.get('/', getBeneficiaries);

/**
 * @route GET /v1/beneficiaries/:id
 * @desc Get a single beneficiary by ID
 * @access Customer only
 */
router.get('/:id', getBeneficiary);

/**
 * @route POST /v1/beneficiaries
 * @desc Create a new beneficiary
 * @access Customer only
 */
router.post('/',
    [
        body('name')
            .trim()
            .isLength({ min: 1, max: 100 })
            .withMessage('Name must be between 1 and 100 characters'),
        body('nickname')
            .optional()
            .trim()
            .isLength({ max: 50 })
            .withMessage('Nickname cannot exceed 50 characters'),
        body('bankName')
            .trim()
            .isLength({ min: 1, max: 100 })
            .withMessage('Bank name must be between 1 and 100 characters'),
        body('accountNumber')
            .trim()
            .isLength({ min: 1, max: 34 })
            .withMessage('Account number must be between 1 and 34 characters'),
        body('swiftCode')
            .trim()
            .matches(/^[A-Z]{6}[A-Z0-9]{2}([A-Z0-9]{3})?$/i)
            .withMessage('Invalid SWIFT code format'),
        body('provider')
            .isIn(['SWIFT', 'SEPA', 'ACH', 'WIRE', 'PAYPAL', 'WISE'])
            .withMessage('Invalid payment provider'),
        body('currency')
            .optional()
            .isIn(['USD', 'EUR', 'GBP', 'ZAR', 'JPY', 'CAD', 'AUD', 'CHF'])
            .withMessage('Invalid currency'),
        body('defaultReference')
            .optional()
            .trim()
            .isLength({ max: 140 })
            .withMessage('Default reference cannot exceed 140 characters')
    ],
    createBeneficiary
);

/**
 * @route PATCH /v1/beneficiaries/:id
 * @desc Update a beneficiary
 * @access Customer only
 */
router.patch('/:id',
    [
        body('name')
            .optional()
            .trim()
            .isLength({ min: 1, max: 100 })
            .withMessage('Name must be between 1 and 100 characters'),
        body('nickname')
            .optional()
            .trim()
            .isLength({ max: 50 })
            .withMessage('Nickname cannot exceed 50 characters'),
        body('bankName')
            .optional()
            .trim()
            .isLength({ min: 1, max: 100 })
            .withMessage('Bank name must be between 1 and 100 characters'),
        body('accountNumber')
            .optional()
            .trim()
            .isLength({ min: 1, max: 34 })
            .withMessage('Account number must be between 1 and 34 characters'),
        body('swiftCode')
            .optional()
            .trim()
            .matches(/^[A-Z]{6}[A-Z0-9]{2}([A-Z0-9]{3})?$/i)
            .withMessage('Invalid SWIFT code format'),
        body('provider')
            .optional()
            .isIn(['SWIFT', 'SEPA', 'ACH', 'WIRE', 'PAYPAL', 'WISE'])
            .withMessage('Invalid payment provider'),
        body('currency')
            .optional()
            .isIn(['USD', 'EUR', 'GBP', 'ZAR', 'JPY', 'CAD', 'AUD', 'CHF'])
            .withMessage('Invalid currency'),
        body('defaultReference')
            .optional()
            .trim()
            .isLength({ max: 140 })
            .withMessage('Default reference cannot exceed 140 characters')
    ],
    updateBeneficiary
);

/**
 * @route DELETE /v1/beneficiaries/:id
 * @desc Delete a beneficiary (soft delete)
 * @access Customer only
 */
router.delete('/:id', deleteBeneficiary);

/**
 * @route PATCH /v1/beneficiaries/:id/favorite
 * @desc Toggle favorite status
 * @access Customer only
 */
router.patch('/:id/favorite', toggleFavorite);

module.exports = router;
