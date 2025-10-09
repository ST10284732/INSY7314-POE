const speakeasy = require('speakeasy');
const QRCode = require('qrcode');
const crypto = require('crypto');

class MFAService {
    
    /**
     * Generate a new TOTP secret for a user
     * @param {string} username - User's username
     * @param {string} issuer - Application name
     * @returns {Object} Secret key and QR code data
     */
    static generateSecret(username, issuer = 'Payment Portal') {
        const secret = speakeasy.generateSecret({
            name: `${issuer} (${username})`,
            issuer: issuer,
            length: 32
        });

        return {
            secret: secret.base32,
            otpauthUrl: secret.otpauth_url,
            qrCodeData: secret.otpauth_url
        };
    }

    /**
     * Generate QR code image as base64 string
     * @param {string} otpauthUrl - The TOTP URL for QR generation
     * @returns {Promise<string>} Base64 encoded QR code image
     */
    static async generateQRCode(otpauthUrl) {
        try {
            const qrCode = await QRCode.toDataURL(otpauthUrl);
            return qrCode;
        } catch (error) {
            throw new Error('Failed to generate QR code: ' + error.message);
        }
    }

    /**
     * Verify a TOTP token
     * @param {string} token - 6-digit TOTP code entered by user
     * @param {string} secret - User's TOTP secret
     * @returns {boolean} True if token is valid
     */
    static verifyToken(token, secret) {
        if (!token || !secret) {
            return false;
        }

        // Remove any spaces and ensure 6 digits
        const cleanToken = token.toString().replace(/\s/g, '');
        
        if (!/^\d{6}$/.test(cleanToken)) {
            return false;
        }

        return speakeasy.totp.verify({
            secret: secret,
            encoding: 'base32',
            token: cleanToken,
            window: 2 // Allow 2 time steps (60 seconds) tolerance
        });
    }

    /**
     * Generate backup recovery codes
     * @param {number} count - Number of backup codes to generate
     * @returns {Array<string>} Array of backup codes
     */
    static generateBackupCodes(count = 8) {
        const codes = [];
        
        for (let i = 0; i < count; i++) {
            // Generate 8-character backup code
            const code = crypto.randomBytes(4).toString('hex').toUpperCase();
            codes.push(code);
        }
        
        return codes;
    }

    /**
     * Verify a backup recovery code
     * @param {string} code - Backup code entered by user
     * @param {Array<string>} userBackupCodes - User's stored backup codes
     * @returns {Object} Verification result and remaining codes
     */
    static verifyBackupCode(code, userBackupCodes) {
        if (!code || !Array.isArray(userBackupCodes)) {
            return { valid: false, remainingCodes: userBackupCodes };
        }

        const cleanCode = code.toString().toUpperCase().replace(/\s/g, '');
        const codeIndex = userBackupCodes.indexOf(cleanCode);
        
        if (codeIndex === -1) {
            return { valid: false, remainingCodes: userBackupCodes };
        }

        // Remove the used backup code
        const remainingCodes = userBackupCodes.filter(c => c !== cleanCode);
        
        return { 
            valid: true, 
            remainingCodes: remainingCodes,
            usedCode: cleanCode
        };
    }

    /**
     * Check if MFA setup is required for login
     * @param {Object} user - User document from database
     * @returns {boolean} True if MFA setup is complete
     */
    static isMFASetupComplete(user) {
        return user.mfaEnabled && 
               user.mfaSetupComplete && 
               user.mfaSecret && 
               user.mfaSecret.length > 0;
    }

    /**
     * Validate TOTP setup completion
     * @param {string} token - User's verification token
     * @param {string} secret - Generated secret
     * @returns {boolean} True if setup verification is successful
     */
    static verifySetup(token, secret) {
        return this.verifyToken(token, secret);
    }
}

module.exports = MFAService;