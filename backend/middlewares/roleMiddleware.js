/**
 * Role-Based Access Control (RBAC) Middleware
 * 
 * This middleware ensures that only users with specific roles can access certain routes.
 * It must be used AFTER authenticateToken middleware to ensure req.user exists.
 */

/**
 * Middleware to check if user has required role(s)
 * @param {string|string[]} allowedRoles - Single role or array of allowed roles
 * @returns {Function} Express middleware function
 * 
 * Usage:
 *   router.get('/employee-only', authenticateToken, requireRole('Employee'), handler);
 *   router.get('/staff-only', authenticateToken, requireRole(['Employee', 'Admin']), handler);
 */
const requireRole = (allowedRoles) => {
    // Normalize to array for consistent handling
    const rolesArray = Array.isArray(allowedRoles) ? allowedRoles : [allowedRoles];
    
    return (req, res, next) => {
        // Ensure user is authenticated (should have been checked by authenticateToken)
        if (!req.user) {
            console.error('[RBAC] No user object found in request. authenticateToken middleware may not have run.');
            return res.status(401).json({
                success: false,
                message: 'Authentication required',
                code: 'NOT_AUTHENTICATED'
            });
        }
        
        // Check if user has a role assigned
        if (!req.user.role) {
            console.error(`[RBAC] User ${req.user.userId} has no role assigned`);
            return res.status(403).json({
                success: false,
                message: 'Access denied. No role assigned.',
                code: 'NO_ROLE'
            });
        }
        
        // Check if user's role is in the allowed roles
        if (!rolesArray.includes(req.user.role)) {
            console.log(`[RBAC] Access denied for user ${req.user.username} (${req.user.role}) to ${req.method} ${req.originalUrl}. Required: ${rolesArray.join(' or ')}`);
            return res.status(403).json({
                success: false,
                message: 'Access denied. Insufficient permissions.',
                code: 'INSUFFICIENT_PERMISSIONS',
                required: rolesArray,
                current: req.user.role
            });
        }
        
        // User has required role, proceed
        console.log(`[RBAC] Access granted for user ${req.user.username} (${req.user.role}) to ${req.method} ${req.originalUrl}`);
        next();
    };
};

/**
 * Middleware to check if user is a Customer
 */
const requireCustomer = requireRole('Customer');

/**
 * Middleware to check if user is an Employee
 */
const requireEmployee = requireRole('Employee');

/**
 * Middleware to check if user is an Admin
 */
const requireAdmin = requireRole('Admin');

/**
 * Middleware to check if user is staff (Employee or Admin)
 */
const requireStaff = requireRole(['Employee', 'Admin']);

/**
 * Middleware to check if user is NOT a customer (Employee or Admin only)
 */
const requireNonCustomer = requireRole(['Employee', 'Admin']);

module.exports = {
    requireRole,
    requireCustomer,
    requireEmployee,
    requireAdmin,
    requireStaff,
    requireNonCustomer
};
