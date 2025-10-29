const mongoose = require('mongoose');

// Define the blueprint of a user
const userSchema = new mongoose.Schema({
    firstname: { type: String, required: true },
    lastname: { type: String, required: true },
    idNumber: { type: String, required: true, unique: true },
    accountNumber: { type: String, required: true, unique: true },
    username: { type: String, required: true, unique: true },
    password: { type: String, required: true },
    
    // Role-based access control (RBAC)
    role: { 
        type: String, 
        enum: ['Customer', 'Employee', 'Admin'],
        default: 'Customer',
        required: true 
    },
    
    // Account balance and financial information
    balance: {
        type: Number,
        default: 0,
        min: 0 // Prevent negative balance
    },
    currency: {
        type: String,
        enum: ['USD', 'EUR', 'GBP', 'ZAR', 'JPY', 'CAD', 'AUD', 'CHF'],
        default: 'USD',
        uppercase: true
    },
    
    // Monthly salary for budgeting (optional)
    monthlySalary: {
        type: Number,
        default: 0,
        min: 0
    },
    
    // Account type
    accountType: {
        type: String,
        enum: ['checking', 'savings'],
        default: 'checking',
        lowercase: true
    },
    
    // Multi-Factor Authentication fields
    mfaEnabled: { type: Boolean, default: false },
    mfaSecret: { type: String, default: null }, // TOTP secret key
    mfaBackupCodes: [{ type: String }], // Backup recovery codes
    mfaSetupComplete: { type: Boolean, default: false }
}, { collection: 'customer' }); 

// Link it to the database
const User = mongoose.model('User', userSchema);

// Expose it to the rest of the app
module.exports = User;
