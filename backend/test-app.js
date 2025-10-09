const express = require('express');
require('dotenv').config();

const app = express();

// Basic middleware
app.use(express.json());

// Simple test route
app.get('/test', (req, res) => {
    res.json({ message: 'Server is working' });
});

const port = process.env.API_PORT || 3000;
app.listen(port, () => {
    console.log(`🚀 Test server listening on port ${port}`);
});