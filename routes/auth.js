const express = require('express');
const jwt = require('jsonwebtoken');
const User = require('../models/User');

const router = express.Router();

// Signup
router.post('/signup', async (req, res) => {
    try {
        const { name, email, password, branch } = req.body;
        console.log(`Signup attempt for: ${email}`);

        // Check if user exists
        const existingUser = await User.findOne({ email });
        if (existingUser) return res.status(400).json({ message: 'User already exists' });

        const user = new User({ name, email, password, branch });
        await user.save();

        // Send AI Welcome Email (Non-blocking)
        const { sendWelcomeEmail } = require('../services/emailService');
        console.log(`[Auth] Triggering email service for ${email}...`);
        sendWelcomeEmail(user).catch(err => {
            console.error(`[Auth] Email Service Trigger Failed:`, err);
        });

        const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET, { expiresIn: '1d' });
        res.status(201).json({ token, user: { id: user._id, name, email, branch } });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// Login
router.post('/login', async (req, res) => {
    try {
        const { email, password } = req.body;
        const user = await User.findOne({ email });
        if (!user) return res.status(400).json({ message: 'Invalid credentials' });

        const isMatch = await user.comparePassword(password);
        if (!isMatch) return res.status(400).json({ message: 'Invalid credentials' });

        const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET, { expiresIn: '1d' });
        res.json({ token, user: { id: user._id, name: user.name, email, branch: user.branch } });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

module.exports = router;
