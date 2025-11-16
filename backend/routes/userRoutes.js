const express = require('express');
const jwt = require('jsonwebtoken');
const { OAuth2Client } = require('google-auth-library');
const User = require('../models/User');
const auth = require('../middleware/auth'); // make sure you have this

const router = express.Router();
const client = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);

//get all user
router.get('/', async (req, res) => {
    try {
        const users = await User.find({}, { password: 0 });
        res.json(users);
    } catch (err) {
        res.status(500).json({ message: 'Server error' });
    }
});

//google login
router.post('/google', async (req, res) => {
    try {
        const { token } = req.body;
        if (!token) return res.status(400).json({ message: 'No token provided' });

        //verify Google token
        const ticket = await client.verifyIdToken({
            idToken: token,
            audience: process.env.GOOGLE_CLIENT_ID,
        });
        const payload = ticket.getPayload();

        const { sub, email } = payload;

        //find user by googleId/email
        let user = await User.findOne({ googleId: sub });
        if (!user) {
            user = await User.findOne({ email });
        }

        //create user if new
        if (!user) {
            user = await User.create({
                googleId: sub,
                email,
                username: email.split("@")[0].replace(/[^a-zA-Z0-9_]/g, ""),
            });
        }

        //generate JWT
        const jwtToken = jwt.sign(
            { id: user._id, email: user.email, username: user.username },
            process.env.JWT_SECRET,
            { expiresIn: '1h' }
        );

        res.json({
            token: jwtToken,
            user: {
                id: user._id,
                email: user.email,
                username: user.username,
            },
        });
    } catch (err) {
        console.error('Google login error:', err);
        res.status(500).json({ message: 'Server error' });
    }
});

//update username
router.put('/username', auth, async (req, res) => {
    try {
        const { newUsername } = req.body;
        if (!newUsername) {
            return res.status(400).json({ message: 'New username is required' });
        }

        //ensure unique username
        const existing = await User.findOne({ username: newUsername });
        if (existing) {
            return res.status(400).json({ message: 'Username already taken' });
        }

        const user = await User.findByIdAndUpdate(
            req.user.id,
            { username: newUsername },
            { new: true }
        );

        if (!user) return res.status(404).json({ message: "User not found" });

        //generate fresh JWT with updated username
        const newToken = jwt.sign(
            { id: user._id, email: user.email, username: user.username },
            process.env.JWT_SECRET,
            { expiresIn: "1h" }
        );

        res.json({
            message: "Username updated",
            token: newToken,
            user: {
                id: user._id,
                email: user.email,
                username: user.username,
            },
        });
    } catch (err) {
        console.error("Update username error:", err);
        res.status(500).json({ message: "Server error" });
    }
});


module.exports = router;
