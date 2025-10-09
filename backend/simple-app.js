const express = require('express');
require('dotenv').config();
const { connectToMongo } = require('./services/dbService');

// Import routes
const userRoutes = require('./routes/userRoutes');
const paymentRoutes = require('./routes/paymentRoutes');

const app = express();

// Trust first proxy
app.set('trust proxy', 1);

// Basic middleware
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Health check endpoint
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

// Connect to MongoDB
connectToMongo();

// Start server
const port = process.env.API_PORT || 3000;
app.listen(port, () => {
    console.log(`🚀 Payment Portal API listening on port ${port}`);
    console.log(`📅 Started at: ${new Date().toISOString()}`);
    console.log(`📋 Health check: http://localhost:${port}/health`);
});