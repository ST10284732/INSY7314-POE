const express = require('express');
const https = require('https');
const fs = require('fs');
const path = require('path');
require('dotenv').config();
const { connectToMongo } = require('./services/dbService');
const { securityMiddlewares, createAuthLimiter, createPaymentLimiter } = require('./middlewares/securityMiddleware');

// Import routes
const userRoutes = require('./routes/userRoutes');
const paymentRoutes = require('./routes/paymentRoutes');
const mfaRoutes = require('./routes/mfaRoutes');

const app = express();

// Trust first proxy (important for rate limiting with IP detection)
app.set('trust proxy', 1);

// Apply comprehensive security middleware (includes rate limiting, sanitization, CORS, Helmet)
securityMiddlewares(app);

// Parse JSON requests with size limit
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Specific rate limiting will be applied within individual route files

// Health check endpoint (no authentication required)
app.get('/health', (req, res) => {
    res.status(200).json({
        success: true,
        message: 'Payment Portal API is running',
        timestamp: new Date().toISOString(),
        version: '1.0.0'
    });
});

// Main application routes
app.use('/v1/user', userRoutes);
app.use('/v1/payments', paymentRoutes);
app.use('/v1/mfa', mfaRoutes);

// Global error handler
app.use((err, req, res, next) => {
    console.error(`[ERROR] ${new Date().toISOString()} - ${err.message}`);
    console.error(err.stack);
    
    // Don't leak error details in production
    if (process.env.NODE_ENV === 'production') {
        res.status(500).json({
            success: false,
            message: 'Internal server error'
        });
    } else {
        res.status(500).json({
            success: false,
            message: err.message,
            stack: err.stack
        });
    }
});

// 404 handler for undefined routes (commented out to avoid path-to-regexp issue)
// app.use('*', (req, res) => {
//     console.log(`[404] ${new Date().toISOString()} - ${req.method} ${req.originalUrl} - IP: ${req.ip}`);
//     res.status(404).json({
//         success: false,
//         message: 'API endpoint not found'
//     });
// });

// Connect to MongoDB
connectToMongo();

// SSL Configuration
let httpsOptions = {};
const sslKeyPath = path.join(__dirname, 'ssl', 'key.pem');
const sslCertPath = path.join(__dirname, 'ssl', 'cert.pem');

// Check if SSL certificates exist and are valid
let sslEnabled = false;

if (fs.existsSync(sslKeyPath) && fs.existsSync(sslCertPath)) {
    try {
        const keyData = fs.readFileSync(sslKeyPath, 'utf8');
        const certData = fs.readFileSync(sslCertPath, 'utf8');
        
        // Basic validation of PEM format
        if (keyData.includes('-----BEGIN') && certData.includes('-----BEGIN CERTIFICATE-----')) {
            httpsOptions = {
                key: keyData,
                cert: certData,
                // Enhanced TLS configuration for better security
                secureProtocol: 'TLS_method', // Use the most secure available TLS version
                ciphers: [
                    'ECDHE-RSA-AES256-GCM-SHA384',
                    'ECDHE-RSA-AES128-GCM-SHA256',
                    'ECDHE-RSA-AES256-SHA384',
                    'ECDHE-RSA-AES128-SHA256',
                    'AES256-GCM-SHA384',
                    'AES128-GCM-SHA256'
                ].join(':'),
                honorCipherOrder: true,
                // Minimum TLS version (comment out if causing issues with self-signed certs)
                secureOptions: process.env.NODE_ENV === 'production' ? 
                    require('constants').SSL_OP_NO_SSLv2 | 
                    require('constants').SSL_OP_NO_SSLv3 | 
                    require('constants').SSL_OP_NO_TLSv1 | 
                    require('constants').SSL_OP_NO_TLSv1_1 : 
                    undefined
            };
            sslEnabled = true;
            console.log('SSL certificates loaded successfully with enhanced TLS configuration');
        } else {
            console.log('SSL certificates found but invalid format - using HTTP only');
        }
    } catch (error) {
        console.error('Error loading SSL certificates:', error.message);
        console.log('Falling back to HTTP only');
    }
} else {
    console.log('SSL certificates not found - running HTTP only (development mode)');
}

// Start server with enhanced logging
const port = process.env.API_PORT || 3000;
const httpsPort = process.env.HTTPS_PORT || 3443;

// HTTP Server (for development and fallback)
const server = app.listen(port, () => {
    console.log(`Payment Portal API (HTTP) listening on localhost:${port}`);
    console.log(`Started at: ${new Date().toISOString()}`);
    console.log(`Security: Rate limiting, sanitization, and headers enabled`);
    console.log(`Environment: ${process.env.NODE_ENV || 'development'}`);
    console.log(`Health check: http://localhost:${port}/health`);
});

// HTTPS Server (if SSL certificates are available)
let httpsServer = null;
if (sslEnabled && Object.keys(httpsOptions).length > 0) {
    httpsServer = https.createServer(httpsOptions, app).listen(httpsPort, () => {
        console.log(`Payment Portal API (HTTPS) listening on localhost:${httpsPort}`);
        console.log(`Secure Health check: https://localhost:${httpsPort}/health`);
    });
}

// Add error handling for HTTP server startup
server.on('error', (error) => {
    if (error.syscall !== 'listen') {
        throw error;
    }

    const bind = typeof port === 'string' ? 'Pipe ' + port : 'Port ' + port;

    switch (error.code) {
        case 'EACCES':
            console.error(`[ERROR] HTTP ${bind} requires elevated privileges`);
            process.exit(1);
            break;
        case 'EADDRINUSE':
            console.error(`[ERROR] HTTP ${bind} is already in use`);
            process.exit(1);
            break;
        default:
            throw error;
    }
});

server.on('listening', () => {
    const addr = server.address();
    console.log(`[DEBUG] HTTP Server listening on ${addr.address}:${addr.port}`);
});

// Add error handling for HTTPS server if it exists
if (httpsServer) {
    httpsServer.on('error', (error) => {
        if (error.syscall !== 'listen') {
            console.error(`[ERROR] HTTPS Server error: ${error.message}`);
            return;
        }

        const bind = typeof httpsPort === 'string' ? 'Pipe ' + httpsPort : 'Port ' + httpsPort;

        switch (error.code) {
            case 'EACCES':
                console.error(`[ERROR] HTTPS ${bind} requires elevated privileges`);
                break;
            case 'EADDRINUSE':
                console.error(`[ERROR] HTTPS ${bind} is already in use`);
                break;
            default:
                console.error(`[ERROR] HTTPS Server error: ${error.message}`);
        }
    });

    httpsServer.on('listening', () => {
        const addr = httpsServer.address();
        console.log(`[DEBUG] HTTPS Server listening on ${addr.address}:${addr.port}`);
    });
}