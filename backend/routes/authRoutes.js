const express = require('express');
const { body } = require('express-validator');
const { register, login, logout } = require('../controllers/authController.js');

const router = express.Router();

// Validation rules for registration
const registerValidation = [
  body('firstname')
    .trim()
    .isLength({ min: 2, max: 50 })
    .matches(/^[a-zA-Z\s]+$/)
    .withMessage('First name must be 2-50 characters (letters and spaces only)'),
  
  body('lastname')
    .trim()
    .isLength({ min: 2, max: 50 })
    .matches(/^[a-zA-Z\s]+$/)
    .withMessage('Last name must be 2-50 characters (letters and spaces only)'),
  
  body('idNumber')
    .matches(/^\d{13}$/)
    .withMessage('ID number must be exactly 13 digits'),
  
  body('accountNumber')
    .matches(/^ACC\d{6,10}$/)
    .withMessage('Account number must start with ACC followed by 6-10 digits'),
  
  body('username')
    .trim()
    .isLength({ min: 3, max: 30 })
    .matches(/^[a-zA-Z0-9_]+$/)
    .withMessage('Username must be 3-30 characters (letters, numbers, underscores only)'),
  
  body('password')
    .isLength({ min: 8 })
    .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]+$/)
    .withMessage('Password must be at least 8 characters with uppercase, lowercase, number, and special character')
];

// Validation rules for login
const loginValidation = [
  body('username')
    .trim()
    .notEmpty()
    .matches(/^[a-zA-Z0-9_]+$/)
    .withMessage('Invalid username format'),
  
  body('password')
    .notEmpty()
    .withMessage('Password is required'),
  
  body('accountNumber')
    .matches(/^ACC\d{6,10}$/)
    .withMessage('Invalid account number format')
];

// login and register are POST requests
// this is because we require the username and password from the user
router.post('/login', loginValidation, login);
router.post('/register', registerValidation, register);
// logout is a GET request, as we are just reading the token from the request header
router.get('/logout', logout);

module.exports = router;