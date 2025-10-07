const express = require('express');
const { register, login, logout } = require('../controllers/authController.js');

const router = express.Router();
// login and register are POST requests
// this is because we require the username and password from the user
router.post('/login', login);
router.post('/register', register);
// logout is a GET request, as we are just reading the token from the request header
router.get('/logout', logout);

module.exports = router;