const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
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
    // pull the required information from the incoming request
    const { username, password } = req.body;
    // before signing the user up, we need to check if their username is already in use
    const exists = await User.findOne({username: username})
    // if it is, say no
    if (exists) return res.status(400).json({message: "User already exists."});
    // if not, lets hash their password (by providing their password, and the number of random iterations to salt)
    const hashedPassword = await bcrypt.hash(password, 10);
    try {
        const newUser = await User.create({username: username, password: hashedPassword});
        res.status(200).json({token: generateJwt(newUser)});
    } catch (e) {
        res.status(500).json({error: e.message});
    }
};

const login = async (req, res) => {
    const { username, password, accountNumber } = req.body;
    
    // Find user by username and account number for enhanced security
    const exists = await User.findOne({
        username: username,
        accountNumber: accountNumber
    });
    
    // if the user is not present in our collection, let them know to try again
    if (!exists) return res.status(401).json({message: "Invalid credentials."});
    
    // next, if the user DOES exist, we compare their entered password to what we have on file
    const matching = await bcrypt.compare(password, exists.password);
    // if they don't match, say no
    if (!matching) return res.status(401).json({message: "Invalid credentials."});
    
    // Check if MFA is enabled for this user
    if (exists.mfaEnabled && exists.mfaSetupComplete) {
        // Return indication that MFA is required
        return res.status(200).json({
            requiresMFA: true,
            username: exists.username,
            message: "MFA verification required"
        });
    }
    
    // otherwise, generate a token and log them in
    res.status(200).json({token: generateJwt(exists)});
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
