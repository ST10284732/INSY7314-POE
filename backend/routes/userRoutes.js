const express = require('express');
const { register, login, logout } = require('../controllers/userController.js');

const router = express.Router();

// Register and login are POST requests
router.post('/register', register);
router.post('/login', login);

// Logout is POST request
router.post('/logout', logout);

module.exports = router;
