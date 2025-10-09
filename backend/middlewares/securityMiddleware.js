// Enhanced Security Middleware for Banking-Grade Protection
// Implements: Rate limiting, Input sanitization, CORS, Helmet, Session management
// Features: DDoS protection, NoSQL injection prevention, Security headers, Request monitoring

const helmet = require('helmet');
const cors = require('cors');
const rateLimit = require('express-rate-limit');
const mongoSanitize = require('mongo-sanitize');

// Rate limiting configurations for different endpoint types
const createGeneralLimiter = () => {
  return rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: process.env.NODE_ENV === 'development' ? 500 : 100, // 500 in dev, 100 in production
    message: {
      success: false,
      message: 'Too many requests from this IP, please try again later.',
      retryAfter: '15 minutes'
    },
    standardHeaders: true, // Return rate limit info in the `RateLimit-*` headers
    legacyHeaders: false, // Disable the `X-RateLimit-*` headers
  });
};

// Strict rate limiting for authentication endpoints (login/register)
const createAuthLimiter = () => {
  return rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 5, // Limit each IP to 5 authentication attempts per windowMs
    message: {
      success: false,
      message: 'Too many authentication attempts, please try again after 15 minutes.',
      retryAfter: '15 minutes'
    },
    standardHeaders: true,
    legacyHeaders: false,
    skipSuccessfulRequests: true, // Reset counter on successful authentication
  });
};

// Moderate rate limiting for payment operations
const createPaymentLimiter = () => {
  return rateLimit({
    windowMs: process.env.NODE_ENV === 'development' ? 15 * 60 * 1000 : 60 * 60 * 1000, // 15 min in dev, 1 hour in prod
    max: process.env.NODE_ENV === 'development' ? 100 : 20, // 100 in dev, 20 in production
    message: {
      success: false,
      message: 'Payment limit exceeded. Please wait before creating more payments.',
      retryAfter: process.env.NODE_ENV === 'development' ? '15 minutes' : '1 hour'
    },
    standardHeaders: true,
    legacyHeaders: false,
  });
};

// Input sanitization middleware to prevent NoSQL injection attacks
const sanitizeInput = (req, res, next) => {
  try {
    // Sanitize request body
    if (req.body) {
      req.body = mongoSanitize(req.body);
    }
    
    // Sanitize request parameters
    if (req.params) {
      req.params = mongoSanitize(req.params);
    }
    
    // Sanitize query parameters
    if (req.query) {
      req.query = mongoSanitize(req.query);
    }
    
    next();
  } catch (error) {
    console.error('Input sanitization error:', error);
    res.status(400).json({
      success: false,
      message: 'Invalid input format'
    });
  }
};

// Enhanced CORS configuration for production security
const corsOptions = {
  origin: function (origin, callback) {
    // Allow requests from frontend during development and production
    const allowedOrigins = [
      'http://localhost:3000',
      'http://localhost:3001', 
      'http://localhost:5173', // Vite default
      'http://127.0.0.1:5173',
      'http://localhost:8080'
      // Add production URLs when deployed
    ];
    
    // Allow requests with no origin (like mobile apps) in development
    if (!origin || allowedOrigins.includes(origin)) {
      return callback(null, true);
    }
    
    callback(new Error('Not allowed by CORS policy'));
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With'],
  maxAge: 86400 // 24 hours
};

// Security monitoring and logging middleware
const securityLogger = (req, res, next) => {
  const timestamp = new Date().toISOString();
  const ip = req.ip || req.connection.remoteAddress;
  const userAgent = req.get('User-Agent') || 'Unknown';
  const method = req.method;
  const url = req.originalUrl;
  
  // Log critical operations (POST, PUT, DELETE)
  if (method === 'POST' || method === 'PUT' || method === 'DELETE') {
    console.log(`[SECURITY] ${timestamp} - ${ip} - ${method} ${url} - ${userAgent}`);
  }
  
  // Log authentication attempts
  if (url.includes('/login') || url.includes('/register')) {
    console.log(`[AUTH] ${timestamp} - ${ip} - Authentication attempt: ${method} ${url}`);
  }
  
  // Log payment operations
  if (url.includes('/payments')) {
    console.log(`[PAYMENT] ${timestamp} - ${ip} - Payment operation: ${method} ${url}`);
  }
  
  next();
};

// Session timeout configuration (15 minutes)
const sessionTimeout = 15 * 60 * 1000; // 15 minutes in milliseconds

// Main security middleware configuration function
// HTTPS redirect middleware (for production)
const httpsRedirect = (req, res, next) => {
    // Only redirect in production and if not already HTTPS
    if (process.env.NODE_ENV === 'production' && !req.secure && req.get('x-forwarded-proto') !== 'https') {
        return res.redirect(301, `https://${req.get('host')}${req.url}`);
    }
    next();
};

const securityMiddlewares = (app) => {
    // Apply HTTPS redirect first (production only)
    app.use(httpsRedirect);
    
    // Apply input sanitization to all routes
    app.use(sanitizeInput);
    
    // Apply security logging to all routes
    app.use(securityLogger);
    
    // Apply general rate limiting to all routes
    app.use(createGeneralLimiter());
    
    // Enhanced Helmet configuration for banking-grade security
    app.use(helmet({
        contentSecurityPolicy: {
            directives: {
                // Enhanced CSP directives for better security
                'default-src': ["'self'"],
                'script-src': ["'self'"],
                'style-src': ["'self'", "'unsafe-inline'"], // Allow inline styles for React
                'img-src': ["'self'", "data:", "https:"],
                'connect-src': ["'self'"],
                'font-src': ["'self'"],
                'object-src': ["'none'"],
                'media-src': ["'self'"],
                'frame-src': ["'none'"],
                'frame-ancestors': ["'none'"], // Prevent embedding in iframes
                'base-uri': ["'self'"],
                'form-action': ["'self'"],
            }
        },
        // Hide server information
        hidePoweredBy: true,
        
        // Prevent clickjacking attacks
        frameguard: {
            action: 'deny'
        },
        
        // Enable HSTS (HTTP Strict Transport Security)
        hsts: {
            maxAge: 31536000, // 1 year
            includeSubDomains: true,
            preload: true
        },
        
        // Prevent MIME type sniffing
        noSniff: true,
        
        // Enable XSS protection
        xssFilter: true,
        
        // Prevent IE from opening downloads in your site's context
        ieNoOpen: true,
        
        // Don't send the Referrer header
        referrerPolicy: {
            policy: 'no-referrer'
        },
        
        // Disable DNS prefetching
        dnsPrefetchControl: {
            allow: false
        }
    }));

    // Apply CORS middleware
    app.use(cors(corsOptions));
    
    // Set additional security headers
    app.use((req, res, next) => {
        // Prevent caching of sensitive data
        res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate, private');
        res.setHeader('Pragma', 'no-cache');
        res.setHeader('Expires', '0');
        
        // Additional security headers
        res.setHeader('X-Content-Type-Options', 'nosniff');
        res.setHeader('X-Download-Options', 'noopen');
        res.setHeader('X-Permitted-Cross-Domain-Policies', 'none');
        
        next();
    });
};

module.exports = { 
    securityMiddlewares,
    createGeneralLimiter,
    createAuthLimiter,
    createPaymentLimiter,
    sanitizeInput,
    securityLogger,
    sessionTimeout
}