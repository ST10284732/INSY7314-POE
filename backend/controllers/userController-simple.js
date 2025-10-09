const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const User = require('../models/userModel');
require('dotenv').config();

// Helper to generate JWT
const generateJwt = (user) => {
    return jwt.sign({ 
        userId: user._id,
        username: user.username 
    }, process.env.JWT_SECRET, { expiresIn: "1h" });
};

// REGISTER
const register = async (req, res) => {
    try {
        const { firstname, lastname, idNumber, accountNumber, username, password } = req.body;

        // Check if username or account number already exists
        const exists = await User.findOne({ 
            $or: [{ username }, { accountNumber }] 
        });
        if (exists) return res.status(400).json({ message: "Username or account number already exists." });

        // Hash password
        const hashedPassword = await bcrypt.hash(password, 10);

        // Create user
        const newUser = await User.create({
            firstname,
            lastname,
            idNumber,
            accountNumber,
            username,
            password: hashedPassword
        });

        // Send back token and user info
        res.status(201).json({
            success: true,
            token: generateJwt(newUser),
            user: {
                id: newUser._id,
                firstname: newUser.firstname,
                lastname: newUser.lastname,
                username: newUser.username,
                accountNumber: newUser.accountNumber
            }
        });
    } catch (e) {
        res.status(500).json({ success: false, error: e.message });
    }
};

// LOGIN
const login = async (req, res) => {
    try {
        const { username, password, accountNumber } = req.body;

        if (!username || !password || !accountNumber) {
            return res.status(400).json({ success: false, message: "Username, password, and account number are required." });
        }

        // Find user by username AND accountNumber
        const user = await User.findOne({ username, accountNumber });
        if (!user) return res.status(400).json({ success: false, message: "Invalid credentials." });

        const isMatch = await bcrypt.compare(password, user.password);
        if (!isMatch) return res.status(400).json({ success: false, message: "Invalid credentials." });

        res.status(200).json({
            success: true,
            token: generateJwt(user),
            user: {
                id: user._id,
                firstname: user.firstname,
                lastname: user.lastname,
                username: user.username,
                accountNumber: user.accountNumber
            }
        });
    } catch (e) {
        res.status(500).json({ success: false, error: e.message });
    }
};

// LOGOUT
const logout = async (req, res) => {
    res.status(200).json({ success: true, message: "Logged out successfully." });
};

module.exports = { register, login, logout };