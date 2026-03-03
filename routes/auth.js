const express = require('express');
const router = express.Router();
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const User = require('../models/User');

// Helper to generate tokens
const generateTokens = (user) => {
    const payload = { user: { id: user.id, username: user.username } };
    const accessToken = jwt.sign(payload, process.env.JWT_SECRET, { expiresIn: '1h' });
    const refreshToken = jwt.sign(payload, process.env.JWT_REFRESH_SECRET, { expiresIn: '7d' });
    return { accessToken, refreshToken };
};

// @route   POST /api/auth/register
// @desc    Register user
router.post('/register', async (req, res) => {
    const { username, password } = req.body;
    try {
        let user = await User.findOne({ username });
        if (user) {
            return res.status(400).json({ message: 'User already exists' });
        }
        user = new User({ username, password });
        await user.save();

        // Generate tokens immediately or require login? 
        // Usually login is separate, but for UX let's return tokens
        const tokens = generateTokens(user);
        res.json(tokens);
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server error');
    }
});

// @route   POST /api/auth/login
// @desc    Authenticate user & get token
router.post('/login', async (req, res) => {
    const { username, password } = req.body;
    try {
        let user = await User.findOne({ username });
        if (!user) {
            return res.status(400).json({ message: 'Invalid credentials' });
        }
        const isMatch = await user.comparePassword(password);
        if (!isMatch) {
            return res.status(400).json({ message: 'Invalid credentials' });
        }
        const tokens = generateTokens(user);
        res.json(tokens);
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server error');
    }
});

// @route   POST /api/auth/refresh
// @desc    Refresh access token
router.post('/refresh', async (req, res) => {
    const { refreshToken } = req.body;
    if (!refreshToken) return res.status(401).json({ message: 'No token provided' });

    try {
        const decoded = jwt.verify(refreshToken, process.env.JWT_REFRESH_SECRET);
        const user = await User.findById(decoded.user.id);
        if (!user) return res.status(404).json({ message: 'User not found' });

        const tokens = generateTokens(user);
        res.json(tokens);
    } catch (err) {
        res.status(403).json({ message: 'Invalid refresh token' });
    }
});

module.exports = router;
