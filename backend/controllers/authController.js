const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { validationResult } = require('express-validator');
const mongoSanitize = require('mongo-sanitize');
const { invalidateToken } = require('../middlewares/authMiddleware.js');
const User = require('../models/userModel.js');
require('dotenv').config();

// helper method to generate our tokens, that takes in user data
const generateJwt = (user) => {
    // signs it using our secret (that it pulls from .env)
    return jwt.sign({
        userId: user._id,
        username: user.username
    }, process.env.JWT_SECRET, {
        // set an expiry of 1 hour from signing
        expiresIn: "1h",
    });
    // and returns it.
};

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

        // Sanitize input to prevent NoSQL injection
        const sanitizedData = mongoSanitize(req.body);
        const { firstname, lastname, idNumber, accountNumber, username, password } = sanitizedData;

        // Check if user already exists by username or account number
        const existingUser = await User.findOne({
            $or: [
                { username: username },
                { accountNumber: accountNumber },
                { idNumber: idNumber }
            ]
        });
        
        if (existingUser) {
            return res.status(400).json({
                success: false,
                message: "User with this username, account number, or ID already exists."
            });
        }

        // Hash the password
        const hashedPassword = await bcrypt.hash(password, 10);
        
        // Create new user with all required fields
        const newUser = await User.create({
            firstname: firstname,
            lastname: lastname,
            idNumber: idNumber,
            accountNumber: accountNumber,
            username: username,
            password: hashedPassword
        });

        res.status(201).json({
            success: true,
            message: "User created successfully",
            token: generateJwt(newUser)
        });
    } catch (e) {
        console.error('Registration error:', e);
        res.status(500).json({
            success: false,
            message: "Registration failed",
            error: e.message
        });
    }
};

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

        // Sanitize input to prevent NoSQL injection
        const sanitizedData = mongoSanitize(req.body);
        const { username, password, accountNumber } = sanitizedData;
        
        // Find user by username and account number for enhanced security
        const exists = await User.findOne({
            username: username,
            accountNumber: accountNumber
        });
        
        // if the user is not present in our collection, let them know to try again
        if (!exists) {
            return res.status(401).json({
                success: false,
                message: "Invalid credentials."
            });
        }
        
        // next, if the user DOES exist, we compare their entered password to what we have on file
        const matching = await bcrypt.compare(password, exists.password);
        // if they don't match, say no
        if (!matching) {
            return res.status(401).json({
                success: false,
                message: "Invalid credentials."
            });
        }
        
        // Check if MFA is enabled for this user
        if (exists.mfaEnabled && exists.mfaSetupComplete) {
            // Return indication that MFA is required
            return res.status(200).json({
                success: false,
                requiresMFA: true,
                username: exists.username,
                message: "MFA verification required"
            });
        }
        
        // otherwise, generate a token and log them in
        res.status(200).json({
            success: true,
            token: generateJwt(exists)
        });
    } catch (error) {
        console.error('Login error:', error);
        res.status(500).json({
            success: false,
            message: "Login failed"
        });
    }
};

const logout = async (req, res) => {
    // strip the header
    const authHeader = req.headers['authorization'];
    // grab the token (Bearer: <token>)
    const token = authHeader.split(" ")[1];
    // check if there is indeed a token, if not, yell at the user
    if (!token) return res.status(400).json({message: "You need to be logged in before you can log out bro"});
    // otherwise invalidate the token
    invalidateToken(token);
    // and log em out
    res.status(200).json({message: "Logged out successfully."});
};

module.exports = { register, login, logout };
