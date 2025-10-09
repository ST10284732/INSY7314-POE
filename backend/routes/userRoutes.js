const express = require('express');
const { 
    register, 
    login, 
    logout, 
    logoutAll,
    getSession,
    registerValidation,
    loginValidation 
} = require('../controllers/userController');
const { authenticateToken } = require('../middlewares/authMiddleware');
const { createAuthLimiter } = require('../middlewares/securityMiddleware');

const router = express.Router();

// Public routes with strict rate limiting and validation
router.post('/register', createAuthLimiter(), registerValidation, register);
router.post('/login', login); // Temporarily disabled validation for login debugging

// Protected routes (authentication required)
router.post('/logout', authenticateToken, logout);
router.post('/logout-all', authenticateToken, logoutAll);
router.get('/session', authenticateToken, getSession);

// Health check for user service
router.get('/health', (req, res) => {
    res.status(200).json({
        success: true,
        message: 'User authentication service is running',
        timestamp: new Date().toISOString()
    });
});

module.exports = router;
