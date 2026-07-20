const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const { login, getProfile } = require('../controllers/userController');

// Public routes
router.post('/login', login);

// Protected routes
router.get('/profile', auth(), getProfile);

module.exports = router; 