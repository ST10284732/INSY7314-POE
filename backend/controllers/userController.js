const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { body, validationResult } = require('express-validator');
const User = require('../models/userModel');
const { createSession, removeSession, logoutAllSessions, invalidateToken, getSessionInfo } = require('../middlewares/authMiddleware');
const MFAService = require('../services/mfaService');
require('dotenv').config();

// Helper to generate JWT with enhanced payload
const generateJwt = (user) => {
    const payload = {
        userId: user._id,
        username: user.username,
        accountNumber: user.accountNumber,
        role: user.role, // Include role for RBAC
        iat: Math.floor(Date.now() / 1000), // Issued at time
        sessionId: `${user._id}_${Date.now()}` // Unique session identifier
    };
    
    return jwt.sign(payload, process.env.JWT_SECRET, { 
        expiresIn: "1h",
        issuer: 'payment-portal-api',
        subject: user._id.toString()
    });
};

// Validation rules for registration
const registerValidation = [
    body('firstname')
        .trim()
        .isLength({ min: 2, max: 50 })
        .matches(/^[a-zA-Z\s]+$/)
        .withMessage('First name must be 2-50 characters and contain only letters'),
    body('lastname')
        .trim()
        .isLength({ min: 2, max: 50 })
        .matches(/^[a-zA-Z\s]+$/)
        .withMessage('Last name must be 2-50 characters and contain only letters'),
    body('idNumber')
        .trim()
        .isLength({ min: 8, max: 20 })
        .matches(/^[0-9A-Za-z]+$/)
        .withMessage('ID number must be 8-20 alphanumeric characters'),
    body('accountNumber')
        .trim()
        .matches(/^ACC\d{6,10}$/)
        .withMessage('Account number must start with ACC followed by 6-10 digits'),
    body('username')
        .trim()
        .isLength({ min: 3, max: 30 })
        .matches(/^[a-zA-Z0-9_]+$/)
        .withMessage('Username must be 3-30 characters (letters, numbers, underscore only)'),
    body('password')
        .isLength({ min: 8 })
        .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]/)
        .withMessage('Password must be at least 8 characters with uppercase, lowercase, number, and special character')
];

// Validation rules for login
const loginValidation = [
    body('username')
        .trim()
        .notEmpty()
        .withMessage('Username is required'),
    body('password')
        .notEmpty()
        .withMessage('Password is required'),
    body('accountNumber')
        .trim()
        .notEmpty()
        .matches(/^[0-9]+$/)
        .withMessage('Valid account number is required')
];

// REGISTER with enhanced security
const register = async (req, res) => {
    try {
        // Check validation results
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({
                success: false,
                message: 'Validation failed',
                errors: errors.array()
            });
        }

        const { firstname, lastname, idNumber, accountNumber, username, password } = req.body;

        // Check if username or account number already exists
        const exists = await User.findOne({ 
            $or: [{ username }, { accountNumber }, { idNumber }] 
        });
        
        if (exists) {
            const field = exists.username === username ? 'Username' : 
                         exists.accountNumber === accountNumber ? 'Account number' : 'ID number';
            return res.status(409).json({ 
                success: false,
                message: `${field} already exists. Please choose a different one.`
            });
        }

        // Hash password with higher complexity
        const saltRounds = 12;
        const hashedPassword = await bcrypt.hash(password, saltRounds);

        // Create user
        const newUser = await User.create({
            firstname: firstname.trim(),
            lastname: lastname.trim(),
            idNumber: idNumber.trim(),
            accountNumber: accountNumber.trim(),
            username: username.trim().toLowerCase(),
            password: hashedPassword
        });

        // Create session
        createSession(newUser._id);

        // Generate token
        const token = generateJwt(newUser);

        // Log successful registration
        console.log(`[AUTH] User registered: ${username} (${newUser._id}) at ${new Date().toISOString()}`);

        // Send back token and user info (never send password)
        res.status(201).json({
            success: true,
            message: 'Registration successful',
            token,
            user: {
                id: newUser._id,
                firstname: newUser.firstname,
                lastname: newUser.lastname,
                username: newUser.username,
                accountNumber: newUser.accountNumber
            },
            sessionTimeout: 15 * 60 * 1000 // 15 minutes in milliseconds
        });
    } catch (error) {
        console.error(`[ERROR] Registration failed: ${error.message}`);
        res.status(500).json({ 
            success: false,
            message: 'Registration failed. Please try again.',
            error: process.env.NODE_ENV === 'development' ? error.message : undefined
        });
    }
};

// LOGIN with enhanced security
const login = async (req, res) => {
    try {
        // Check validation results
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({
                success: false,
                message: 'Validation failed',
                errors: errors.array()
            });
        }

        const { username, password, accountNumber } = req.body;

        // Find user by username AND accountNumber (try both original case and lowercase)
        let user = await User.findOne({ 
            username: username.trim(), 
            accountNumber: accountNumber.trim() 
        });
        
        // If not found, try lowercase version for compatibility
        if (!user) {
            user = await User.findOne({ 
                username: username.trim().toLowerCase(), 
                accountNumber: accountNumber.trim() 
            });
        }

        if (!user) {
            console.log(`[AUTH] Failed login attempt: ${username} with account ${accountNumber} at ${new Date().toISOString()}`);
            return res.status(401).json({ 
                success: false,
                message: "Invalid credentials. Please check your username, account number, and password."
            });
        }

        // Verify password
        const isMatch = await bcrypt.compare(password, user.password);
        if (!isMatch) {
            console.log(`[AUTH] Failed password verification for user: ${username} at ${new Date().toISOString()}`);
            return res.status(401).json({ 
                success: false,
                message: "Invalid credentials. Please check your username, account number, and password."
            });
        }

        // Check if MFA is enabled and required
        if (MFAService.isMFASetupComplete(user)) {
            console.log(`[AUTH] MFA required for user: ${username} at ${new Date().toISOString()}`);
            
            // Return MFA challenge (don't create session or token yet)
            return res.status(200).json({
                success: false, // Not fully authenticated yet
                requiresMFA: true,
                message: 'Multi-factor authentication required',
                username: user.username,
                mfaChallenge: true
            });
        }

        // Create new session (if no MFA or MFA already verified)
        createSession(user._id);

        // Generate new token
        const token = generateJwt(user);

        // Log successful login
        console.log(`[AUTH] Successful login: ${username} (${user._id}) at ${new Date().toISOString()}`);

        res.status(200).json({
            success: true,
            message: 'Login successful',
            token,
            user: {
                id: user._id,
                firstname: user.firstname,
                lastname: user.lastname,
                username: user.username,
                accountNumber: user.accountNumber,
                mfaEnabled: user.mfaEnabled || false
            },
            sessionTimeout: 15 * 60 * 1000 // 15 minutes in milliseconds
        });
    } catch (error) {
        console.error(`[ERROR] Login failed: ${error.message}`);
        res.status(500).json({ 
            success: false,
            message: 'Login failed. Please try again.',
            error: process.env.NODE_ENV === 'development' ? error.message : undefined
        });
    }
};

// Enhanced LOGOUT with token invalidation
const logout = async (req, res) => {
    try {
        const token = req.token;
        const userId = req.user?.userId;

        if (token) {
            // Invalidate the current token
            invalidateToken(token);
        }

        if (userId) {
            // Remove the user's session
            removeSession(userId);
            console.log(`[AUTH] User logged out: ${userId} at ${new Date().toISOString()}`);
        }

        res.status(200).json({ 
            success: true,
            message: "Logged out successfully. Please login again to access your account."
        });
    } catch (error) {
        console.error(`[ERROR] Logout failed: ${error.message}`);
        res.status(500).json({ 
            success: false,
            message: 'Logout failed. Please try again.'
        });
    }
};

// LOGOUT ALL SESSIONS
const logoutAll = async (req, res) => {
    try {
        const userId = req.user?.userId;

        if (userId) {
            // Logout all sessions for this user
            logoutAllSessions(userId);
            console.log(`[AUTH] All sessions logged out for user: ${userId} at ${new Date().toISOString()}`);
        }

        res.status(200).json({ 
            success: true,
            message: "All sessions logged out successfully. Please login again to access your account."
        });
    } catch (error) {
        console.error(`[ERROR] Logout all failed: ${error.message}`);
        res.status(500).json({ 
            success: false,
            message: 'Logout failed. Please try again.'
        });
    }
};

// GET SESSION INFO
const getSession = async (req, res) => {
    try {
        const userId = req.user?.userId;
        
        if (!userId) {
            return res.status(401).json({
                success: false,
                message: 'No active session'
            });
        }

        const sessionInfo = getSessionInfo(userId);
        
        if (!sessionInfo) {
            return res.status(401).json({
                success: false,
                message: 'No active session found'
            });
        }

        res.status(200).json({
            success: true,
            session: {
                timeRemaining: sessionInfo.timeRemaining,
                loginTime: new Date(sessionInfo.loginTime).toISOString(),
                lastActivity: new Date(sessionInfo.lastActivity).toISOString(),
                isExpired: sessionInfo.isExpired
            }
        });
    } catch (error) {
        console.error(`[ERROR] Get session failed: ${error.message}`);
        res.status(500).json({ 
            success: false,
            message: 'Failed to get session information'
        });
    }
};

module.exports = { 
    register, 
    login, 
    logout, 
    logoutAll,
    getSession,
    registerValidation,
    loginValidation
};
