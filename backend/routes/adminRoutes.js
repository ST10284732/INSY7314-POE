const express = require('express');
const { body } = require('express-validator');
const { authenticateToken } = require('../middlewares/authMiddleware');
const { requireAdmin } = require('../middlewares/roleMiddleware');
const { createAuthLimiter } = require('../middlewares/securityMiddleware');
const {
    getAllEmployees,
    getAllUsers,
    createStaff,
    deleteEmployee,
    updateEmployeeRole,
    getAdminStats
} = require('../controllers/adminController');

const router = express.Router();

// Apply authentication and role-based access control to all routes
// All routes require authentication AND Admin role
router.use(authenticateToken);
router.use(requireAdmin); // Requires Admin role only

// Apply rate limiting
router.use(createAuthLimiter());

/**
 * @route GET /v1/admin/employees
 * @desc Get all employees in the system
 * @access Admin only
 */
router.get('/employees', getAllEmployees);

/**
 * @route GET /v1/admin/users
 * @desc Get all users (customers, employees, admins)
 * @access Admin only
 */
router.get('/users', getAllUsers);

/**
 * @route POST /v1/admin/staff
 * @desc Create a new staff user (Employee or Admin)
 * @access Admin only
 */
router.post('/staff',
    [
        body('firstname')
            .trim()
            .isLength({ min: 2, max: 50 })
            .matches(/^[a-zA-Z\s\-']+$/)
            .withMessage('First name must be 2-50 characters (letters, spaces, hyphens, apostrophes only)'),
        
        body('lastname')
            .trim()
            .isLength({ min: 2, max: 50 })
            .matches(/^[a-zA-Z\s\-']+$/)
            .withMessage('Last name must be 2-50 characters (letters, spaces, hyphens, apostrophes only)'),
        
        body('idNumber')
            .trim()
            .isLength({ min: 5, max: 20 })
            .matches(/^[a-zA-Z0-9]+$/)
            .withMessage('ID number must be 5-20 alphanumeric characters'),
        
        body('accountNumber')
            .trim()
            .isLength({ min: 5, max: 20 })
            .matches(/^[a-zA-Z0-9]+$/)
            .withMessage('Account number must be 5-20 alphanumeric characters'),
        
        body('username')
            .trim()
            .isLength({ min: 3, max: 30 })
            .matches(/^[a-zA-Z0-9_]+$/)
            .withMessage('Username must be 3-30 characters (letters, numbers, underscores only)'),
        
        body('password')
            .isLength({ min: 8, max: 128 })
            .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&#])[A-Za-z\d@$!%*?&#]+$/)
            .withMessage('Password must be at least 8 characters with uppercase, lowercase, number, and special character'),
        
        body('role')
            .notEmpty()
            .isIn(['Employee', 'Admin'])
            .withMessage('Role must be Employee or Admin')
    ],
    createStaff
);

/**
 * @route DELETE /v1/admin/employees/:id
 * @desc Delete an employee
 * @access Admin only
 */
router.delete('/employees/:id', deleteEmployee);

/**
 * @route PATCH /v1/admin/employees/:id/role
 * @desc Update employee role
 * @access Admin only
 */
router.patch('/employees/:id/role',
    [
        body('role')
            .notEmpty()
            .isIn(['Customer', 'Employee', 'Admin'])
            .withMessage('Role must be Customer, Employee, or Admin')
    ],
    updateEmployeeRole
);

/**
 * @route GET /v1/admin/stats
 * @desc Get admin dashboard statistics
 * @access Admin only
 */
router.get('/stats', getAdminStats);

module.exports = router;
