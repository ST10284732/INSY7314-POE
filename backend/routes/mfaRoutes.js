const express = require('express');
const bcrypt = require('bcryptjs');
const { body, validationResult } = require('express-validator');
const User = require('../models/userModel');
const MFAService = require('../services/mfaService');
const { authenticateToken } = require('../middlewares/authMiddleware');
const { createAuthLimiter } = require('../middlewares/securityMiddleware');

const router = express.Router();

// Apply authentication rate limiting to all MFA routes
router.use(createAuthLimiter());

/**
 * @route POST /v1/mfa/setup/generate
 * @desc Generate MFA secret and QR code for user
 * @access Private (requires authentication)
 */
router.post('/setup/generate', 
    authenticateToken,
    async (req, res) => {
        try {
            const userId = req.user.userId;
            
            // Get user from database
            const user = await User.findById(userId);
            if (!user) {
                return res.status(404).json({
                    success: false,
                    message: 'User not found'
                });
            }

            // Check if MFA is already enabled
            if (user.mfaEnabled && user.mfaSetupComplete) {
                return res.status(400).json({
                    success: false,
                    message: 'MFA is already enabled for this account'
                });
            }

            // Generate new MFA secret
            const mfaData = MFAService.generateSecret(user.username, 'Payment Portal');
            const qrCode = await MFAService.generateQRCode(mfaData.qrCodeData);

            // Store the secret temporarily (not confirmed until verified)
            user.mfaSecret = mfaData.secret;
            user.mfaEnabled = false; // Not enabled until verification
            user.mfaSetupComplete = false;
            await user.save();

            console.log(`[MFA] ${new Date().toISOString()} - Setup initiated for user: ${user.username}`);

            res.status(200).json({
                success: true,
                message: 'MFA setup initiated',
                data: {
                    qrCode: qrCode,
                    manualEntryKey: mfaData.secret,
                    instructions: 'Scan the QR code with your authenticator app (Google Authenticator, Authy, etc.) or enter the manual key, then verify with a 6-digit code.'
                }
            });

        } catch (error) {
            console.error(`[MFA ERROR] ${new Date().toISOString()} - Setup generation failed:`, error);
            res.status(500).json({
                success: false,
                message: 'Failed to generate MFA setup'
            });
        }
    }
);

/**
 * @route POST /v1/mfa/setup/verify
 * @desc Verify MFA setup with TOTP code
 * @access Private (requires authentication)
 */
router.post('/setup/verify',
    authenticateToken,
    [
        body('token')
            .isLength({ min: 6, max: 6 })
            .isNumeric()
            .withMessage('Token must be a 6-digit number')
    ],
    async (req, res) => {
        try {
            // Check validation errors
            const errors = validationResult(req);
            if (!errors.isEmpty()) {
                return res.status(400).json({
                    success: false,
                    message: 'Invalid input',
                    errors: errors.array()
                });
            }

            const { token } = req.body;
            const userId = req.user.userId;

            // Get user from database
            const user = await User.findById(userId);
            if (!user) {
                return res.status(404).json({
                    success: false,
                    message: 'User not found'
                });
            }

            // Check if user has a secret to verify
            if (!user.mfaSecret) {
                return res.status(400).json({
                    success: false,
                    message: 'MFA setup not initiated. Please generate setup first.'
                });
            }

            // Verify the TOTP token
            const isValid = MFAService.verifySetup(token, user.mfaSecret);
            
            if (!isValid) {
                console.log(`[MFA] ${new Date().toISOString()} - Invalid verification token for user: ${user.username}`);
                return res.status(400).json({
                    success: false,
                    message: 'Invalid verification code. Please try again.'
                });
            }

            // Generate backup codes
            const backupCodes = MFAService.generateBackupCodes(8);

            // Enable MFA for the user
            user.mfaEnabled = true;
            user.mfaSetupComplete = true;
            user.mfaBackupCodes = backupCodes;
            await user.save();

            console.log(`[MFA] ${new Date().toISOString()} - MFA enabled successfully for user: ${user.username}`);

            res.status(200).json({
                success: true,
                message: 'MFA setup completed successfully',
                data: {
                    backupCodes: backupCodes,
                    warning: 'Store these backup codes in a safe place. You can use them to access your account if you lose your authenticator device.'
                }
            });

        } catch (error) {
            console.error(`[MFA ERROR] ${new Date().toISOString()} - Setup verification failed:`, error);
            res.status(500).json({
                success: false,
                message: 'Failed to verify MFA setup'
            });
        }
    }
);

/**
 * @route POST /v1/mfa/login
 * @desc Complete login with MFA verification
 * @access Public (used during authentication flow)
 */
router.post('/login',
    [
        body('username')
            .notEmpty()
            .withMessage('Username is required'),
        body('password')
            .notEmpty()
            .withMessage('Password is required'),
        body('accountNumber')
            .notEmpty()
            .withMessage('Account number is required'),
        body('token')
            .optional()
            .isLength({ min: 6, max: 6 })
            .isNumeric()
            .withMessage('Token must be a 6-digit number'),
        body('backupCode')
            .optional()
            .isLength({ min: 8, max: 8 })
            .withMessage('Backup code must be 8 characters')
    ],
    async (req, res) => {
        try {
            // Check validation errors
            const errors = validationResult(req);
            if (!errors.isEmpty()) {
                return res.status(400).json({
                    success: false,
                    message: 'Invalid input',
                    errors: errors.array()
                });
            }

            const { username, password, accountNumber, token, backupCode } = req.body;

            // Find user by username AND accountNumber
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
                console.log(`[MFA] Failed login attempt: ${username} with account ${accountNumber}`);
                return res.status(401).json({
                    success: false,
                    message: 'Invalid credentials'
                });
            }

            // Verify password
            const bcrypt = require('bcryptjs');
            const isMatch = await bcrypt.compare(password, user.password);
            if (!isMatch) {
                console.log(`[MFA] Invalid password for user: ${username}`);
                return res.status(401).json({
                    success: false,
                    message: 'Invalid credentials'
                });
            }

            // Check if MFA is enabled
            if (!MFAService.isMFASetupComplete(user)) {
                // No MFA enabled, complete login normally
                const jwt = require('jsonwebtoken');
                const { createSession } = require('../middlewares/authMiddleware');
                
                createSession(user._id);
                
                const generateJwt = (user) => {
                    const payload = {
                        userId: user._id,
                        username: user.username,
                        accountNumber: user.accountNumber,
                        iat: Math.floor(Date.now() / 1000),
                        sessionId: `${user._id}_${Date.now()}`
                    };
                    
                    return jwt.sign(payload, process.env.JWT_SECRET, {
                        expiresIn: '1h'
                    });
                };

                const jwtToken = generateJwt(user);

                console.log(`[MFA] Login successful (no MFA required): ${username}`);
                
                return res.status(200).json({
                    success: true,
                    message: 'Login successful',
                    token: jwtToken,
                    user: {
                        id: user._id,
                        firstname: user.firstname,
                        lastname: user.lastname,
                        username: user.username,
                        accountNumber: user.accountNumber,
                        mfaEnabled: user.mfaEnabled || false
                    },
                    sessionTimeout: 15 * 60 * 1000
                });
            }

            // MFA is enabled, verify MFA token
            if (!token && !backupCode) {
                return res.status(200).json({
                    success: false,
                    requiresMFA: true,
                    message: 'Multi-factor authentication required',
                    username: user.username,
                    mfaChallenge: true
                });
            }

            // Verify MFA
            let verificationResult = false;
            let usedBackupCode = null;

            if (token) {
                verificationResult = MFAService.verifyToken(token, user.mfaSecret);
                console.log(`[MFA] TOTP verification for ${username}: ${verificationResult ? 'SUCCESS' : 'FAILED'}`);
                
            } else if (backupCode) {
                const backupResult = MFAService.verifyBackupCode(backupCode, user.mfaBackupCodes);
                verificationResult = backupResult.valid;
                
                if (verificationResult) {
                    user.mfaBackupCodes = backupResult.remainingCodes;
                    await user.save();
                    usedBackupCode = backupResult.usedCode;
                    console.log(`[MFA] Backup code verification for ${username}: SUCCESS`);
                } else {
                    console.log(`[MFA] Backup code verification for ${username}: FAILED`);
                }
            }

            if (!verificationResult) {
                return res.status(400).json({
                    success: false,
                    message: 'Invalid verification code'
                });
            }

            // MFA successful - complete login
            const jwt = require('jsonwebtoken');
            const { createSession } = require('../middlewares/authMiddleware');
            
            createSession(user._id);
            
            const generateJwt = (user) => {
                const payload = {
                    userId: user._id,
                    username: user.username,
                    accountNumber: user.accountNumber,
                    iat: Math.floor(Date.now() / 1000),
                    sessionId: `${user._id}_${Date.now()}`
                };
                
                return jwt.sign(payload, process.env.JWT_SECRET, {
                    expiresIn: '1h'
                });
            };

            const jwtToken = generateJwt(user);

            console.log(`[MFA] Login successful with MFA: ${username}`);

            res.status(200).json({
                success: true,
                message: 'Login successful with MFA',
                token: jwtToken,
                user: {
                    id: user._id,
                    firstname: user.firstname,
                    lastname: user.lastname,
                    username: user.username,
                    accountNumber: user.accountNumber,
                    mfaEnabled: user.mfaEnabled || false
                },
                mfaVerified: true,
                usedBackupCode: usedBackupCode,
                remainingBackupCodes: user.mfaBackupCodes.length,
                sessionTimeout: 15 * 60 * 1000
            });

        } catch (error) {
            console.error(`[MFA ERROR] Login failed:`, error);
            res.status(500).json({
                success: false,
                message: 'Login failed'
            });
        }
    }
);

/**
 * @route POST /v1/mfa/verify
 * @desc Verify MFA token during login
 * @access Public (used during authentication flow)
 */
router.post('/verify',
    [
        body('username')
            .notEmpty()
            .withMessage('Username is required'),
        body('token')
            .optional()
            .isLength({ min: 6, max: 6 })
            .isNumeric()
            .withMessage('Token must be a 6-digit number'),
        body('backupCode')
            .optional()
            .isLength({ min: 8, max: 8 })
            .withMessage('Backup code must be 8 characters')
    ],
    async (req, res) => {
        try {
            // Check validation errors
            const errors = validationResult(req);
            if (!errors.isEmpty()) {
                return res.status(400).json({
                    success: false,
                    message: 'Invalid input',
                    errors: errors.array()
                });
            }

            const { username, token, backupCode } = req.body;

            // Find user by username (case insensitive)
            const user = await User.findOne({ 
                username: { $regex: new RegExp(`^${username}$`, 'i') }
            });

            if (!user || !user.mfaEnabled) {
                return res.status(400).json({
                    success: false,
                    message: 'Invalid request'
                });
            }

            let verificationResult = false;
            let usedBackupCode = null;

            if (token) {
                // Verify TOTP token
                verificationResult = MFAService.verifyToken(token, user.mfaSecret);
                console.log(`[MFA] ${new Date().toISOString()} - TOTP verification for ${username}: ${verificationResult ? 'SUCCESS' : 'FAILED'}`);
                
            } else if (backupCode) {
                // Verify backup code
                const backupResult = MFAService.verifyBackupCode(backupCode, user.mfaBackupCodes);
                verificationResult = backupResult.valid;
                
                if (verificationResult) {
                    // Update user's backup codes (remove used code)
                    user.mfaBackupCodes = backupResult.remainingCodes;
                    await user.save();
                    usedBackupCode = backupResult.usedCode;
                    
                    console.log(`[MFA] ${new Date().toISOString()} - Backup code verification for ${username}: SUCCESS (${user.mfaBackupCodes.length} codes remaining)`);
                } else {
                    console.log(`[MFA] ${new Date().toISOString()} - Backup code verification for ${username}: FAILED`);
                }
            } else {
                return res.status(400).json({
                    success: false,
                    message: 'Either token or backup code is required'
                });
            }

            if (verificationResult) {
                res.status(200).json({
                    success: true,
                    message: 'MFA verification successful',
                    data: {
                        userId: user._id,
                        username: user.username,
                        usedBackupCode: usedBackupCode,
                        remainingBackupCodes: user.mfaBackupCodes.length
                    }
                });
            } else {
                res.status(400).json({
                    success: false,
                    message: 'Invalid verification code'
                });
            }

        } catch (error) {
            console.error(`[MFA ERROR] ${new Date().toISOString()} - Verification failed:`, error);
            res.status(500).json({
                success: false,
                message: 'MFA verification failed'
            });
        }
    }
);

/**
 * @route POST /v1/mfa/disable
 * @desc Disable MFA for user account
 * @access Private (requires authentication + password confirmation)
 */
router.post('/disable',
    authenticateToken,
    [
        body('password')
            .notEmpty()
            .withMessage('Password confirmation is required')
    ],
    async (req, res) => {
        try {
            // Check validation errors
            const errors = validationResult(req);
            if (!errors.isEmpty()) {
                return res.status(400).json({
                    success: false,
                    message: 'Invalid input',
                    errors: errors.array()
                });
            }

            const { password } = req.body;
            const userId = req.user.userId;

            // Get user from database
            const user = await User.findById(userId);
            if (!user) {
                return res.status(404).json({
                    success: false,
                    message: 'User not found'
                });
            }

            // Verify password
            const isPasswordValid = await bcrypt.compare(password, user.password);
            if (!isPasswordValid) {
                console.log(`[MFA] ${new Date().toISOString()} - MFA disable attempt with invalid password for user: ${user.username}`);
                return res.status(400).json({
                    success: false,
                    message: 'Invalid password'
                });
            }

            // Disable MFA
            user.mfaEnabled = false;
            user.mfaSetupComplete = false;
            user.mfaSecret = null;
            user.mfaBackupCodes = [];
            await user.save();

            console.log(`[MFA] ${new Date().toISOString()} - MFA disabled for user: ${user.username}`);

            res.status(200).json({
                success: true,
                message: 'MFA disabled successfully'
            });

        } catch (error) {
            console.error(`[MFA ERROR] ${new Date().toISOString()} - Disable failed:`, error);
            res.status(500).json({
                success: false,
                message: 'Failed to disable MFA'
            });
        }
    }
);

/**
 * @route GET /v1/mfa/status
 * @desc Get MFA status for authenticated user
 * @access Private (requires authentication)
 */
router.get('/status', 
    authenticateToken,
    async (req, res) => {
        try {
            const userId = req.user.userId;
            
            // Get user from database
            const user = await User.findById(userId);
            if (!user) {
                return res.status(404).json({
                    success: false,
                    message: 'User not found'
                });
            }

            res.status(200).json({
                success: true,
                data: {
                    mfaEnabled: user.mfaEnabled || false,
                    mfaSetupComplete: user.mfaSetupComplete || false,
                    backupCodesRemaining: user.mfaBackupCodes ? user.mfaBackupCodes.length : 0
                }
            });

        } catch (error) {
            console.error(`[MFA ERROR] ${new Date().toISOString()} - Status check failed:`, error);
            res.status(500).json({
                success: false,
                message: 'Failed to get MFA status'
            });
        }
    }
);

module.exports = router;