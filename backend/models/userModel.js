const mongoose = require('mongoose');

// Define the blueprint of a user
const userSchema = new mongoose.Schema({
    firstname: { type: String, required: true },
    lastname: { type: String, required: true },
    idNumber: { type: String, required: true, unique: true },
    accountNumber: { type: String, required: true, unique: true },
    username: { type: String, required: true, unique: true },
    password: { type: String, required: true },
    
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
