const jwt = require('jsonwebtoken');
const { sessionTimeout } = require('./securityMiddleware');
require('dotenv').config();

// Enhanced token blacklist with automatic cleanup
class TokenBlacklist {
    constructor() {
        this.tokens = new Map(); // Store tokens with their invalidation timestamp
        this.cleanupInterval = setInterval(() => this.cleanup(), 60000); // Cleanup every minute
    }

    add(token) {
        this.tokens.set(token, Date.now());
        console.log(`[AUTH] Token blacklisted at ${new Date().toISOString()}`);
    }

    has(token) {
        return this.tokens.has(token);
    }

    // Remove old tokens from blacklist to prevent memory leaks
    cleanup() {
        const now = Date.now();
        const maxAge = 24 * 60 * 60 * 1000; // 24 hours
        
        for (const [token, timestamp] of this.tokens.entries()) {
            if (now - timestamp > maxAge) {
                this.tokens.delete(token);
            }
        }
    }

    // Get blacklist size for monitoring
    size() {
        return this.tokens.size;
    }
}

const tokenBlacklist = new TokenBlacklist();

// Session tracking for timeout management
const activeSessions = new Map(); // userId -> { lastActivity, loginTime }

// Update user activity timestamp
const updateUserActivity = (userId) => {
    const now = Date.now();
    if (activeSessions.has(userId)) {
        const session = activeSessions.get(userId);
        session.lastActivity = now;
        activeSessions.set(userId, session);
    }
};

// Check if session has timed out
const isSessionExpired = (userId) => {
    if (!activeSessions.has(userId)) {
        return true; // No session found
    }
    
    const session = activeSessions.get(userId);
    const now = Date.now();
    const timeSinceActivity = now - session.lastActivity;
    
    return timeSinceActivity > sessionTimeout; // 15 minutes
};

// Create new session
const createSession = (userId) => {
    const now = Date.now();
    activeSessions.set(userId, {
        loginTime: now,
        lastActivity: now
    });
    console.log(`[AUTH] Session created for user ${userId} at ${new Date().toISOString()}`);
};

// Remove session
const removeSession = (userId) => {
    if (activeSessions.has(userId)) {
        activeSessions.delete(userId);
        console.log(`[AUTH] Session removed for user ${userId} at ${new Date().toISOString()}`);
    }
};

const verifyToken = (req, res, next) => {
    // strip the header (grab the auth field from the header)
    const authHeader = req.headers["authorization"]

    // we split after the space, as standard auth headers look like the following:
    // Bearer: <token> (and we just want the token aspect)
    const token = authHeader && authHeader.split(" ")[1];

    // if no token, 401 unauthorized
    if (!token) return res.status(401).json({
        success: false,
        message: "No token provided"
    });
    
    // if a token that has been logged out, 401 unauthorized
    if (tokenBlacklist.has(token)) return res.status(401).json({
        success: false,
        message: "Token has been invalidated"
    });

    jwt.verify(token, process.env.JWT_SECRET, (err, decoded) => {
        // 403 - forbidden
        if (err) return res.status(403).json({
            success: false,
            message: "Invalid token"
        });
        
        // Check session timeout (create session if it doesn't exist for backward compatibility)
        if (decoded.userId) {
            if (isSessionExpired(decoded.userId)) {
                // Create a new session for existing valid tokens
                createSession(decoded.userId);
                console.log(`[AUTH] Created new session for existing token: ${decoded.userId}`);
            }
            updateUserActivity(decoded.userId);
        }
        
        req.user = decoded;
        req.token = token;
        next();
    });
};

// Enhanced authentication middleware with session management
const authenticateToken = (req, res, next) => {
    // strip the header (grab the auth field from the header)
    const authHeader = req.headers["authorization"];

    // we split after the space, as standard auth headers look like the following:
    // Bearer: <token> (and we just want the token aspect)
    const token = authHeader && authHeader.split(" ")[1];

    // if no token, 401 unauthorized
    if (!token) return res.status(401).json({
        success: false,
        message: "Access denied. No token provided.",
        code: 'NO_TOKEN'
    });
    
    // if a token that has been logged out, 401 unauthorized
    if (tokenBlacklist.has(token)) return res.status(401).json({
        success: false,
        message: "Token has been invalidated. Please login again.",
        code: 'INVALIDATED_TOKEN'
    });

    try {
        // Verify token and extract user data
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        
        // Check session timeout (create session if it doesn't exist for backward compatibility)
        if (decoded.userId) {
            if (isSessionExpired(decoded.userId)) {
                // Create a new session for existing valid tokens
                createSession(decoded.userId);
                console.log(`[AUTH] Created new session for existing token: ${decoded.userId}`);
            }
            updateUserActivity(decoded.userId);
        }
        
        req.user = decoded; // This should contain userId, username, etc.
        req.token = token; // Store token for logout functionality
        
        // Log authentication for security monitoring
        console.log(`[AUTH] User ${decoded.userId} authenticated for ${req.method} ${req.originalUrl}`);
        
        next();
    } catch (err) {
        console.error(`[AUTH] Token verification failed: ${err.message}`);
        return res.status(403).json({
            success: false,
            message: "Invalid token. Access denied.",
            code: 'INVALID_TOKEN'
        });
    }
};

// Enhanced token invalidation
const invalidateToken = (token) => {
    tokenBlacklist.add(token);
};

// Logout all sessions for a user
const logoutAllSessions = (userId) => {
    removeSession(userId);
    console.log(`[AUTH] All sessions logged out for user ${userId}`);
};

// Get session info for monitoring
const getSessionInfo = (userId) => {
    if (!activeSessions.has(userId)) {
        return null;
    }
    
    const session = activeSessions.get(userId);
    const now = Date.now();
    const timeRemaining = sessionTimeout - (now - session.lastActivity);
    
    return {
        loginTime: session.loginTime,
        lastActivity: session.lastActivity,
        timeRemaining: Math.max(0, timeRemaining),
        isExpired: timeRemaining <= 0
    };
};

// Cleanup function for sessions
const cleanupSessions = () => {
    const now = Date.now();
    for (const [userId, session] of activeSessions.entries()) {
        if (now - session.lastActivity > sessionTimeout) {
            removeSession(userId);
        }
    }
};

// Run session cleanup every 5 minutes
setInterval(cleanupSessions, 5 * 60 * 1000);

module.exports = { 
    verifyToken, 
    authenticateToken, 
    invalidateToken,
    createSession,
    removeSession,
    logoutAllSessions,
    getSessionInfo,
    isSessionExpired,
    updateUserActivity
};