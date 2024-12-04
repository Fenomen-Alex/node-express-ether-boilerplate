const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const User = require('../models/User');
const { ethers } = require('ethers');
const crypto = require('crypto');
const dotenv = require('dotenv');
dotenv.config();

// Generate a random encryption secret
function generateRandomSecret() {
    return crypto.randomBytes(32).toString('hex');
}

// Encrypt the private key with a random secret
function encryptPrivateKey(privateKey, encryptionSecret) {
    const iv = crypto.randomBytes(16);
    const cipher = crypto.createCipheriv('aes-256-cbc', Buffer.from(encryptionSecret, 'hex'), iv);
    const encrypted = Buffer.concat([cipher.update(privateKey), cipher.final()]);
    return { iv: iv.toString('hex'), encryptedData: encrypted.toString('hex') };
}

// Generate a random JWT secret
function generateJwtSecret() {
    return crypto.randomBytes(32).toString('hex');
}

// Register User
const registerUser = async (req, res) => {
    const { username, email, password } = req.body;
    const wallet = ethers.Wallet.createRandom();
    const encryptionSecret = generateRandomSecret();
    const encryptedPrivateKey = encryptPrivateKey(wallet.privateKey, encryptionSecret);
    const jwtSecret = generateJwtSecret();
    try {
        const user = new User({
            username,
            email,
            password: await bcrypt.hash(password, 10),
            encryptedPrivateKey: encryptedPrivateKey.encryptedData,
            encryptionSecret: encryptionSecret,
            publicKey: wallet.address,
            iv: encryptedPrivateKey.iv,
            lastKeyRotation: new Date(),
            lastJwtRotation: new Date(),
        });
        await user.save();
        res.status(201).json({ message: 'User created successfully' });
    } catch (err) {
        res.status(500).json({ error: 'User registration failed' });
    }
};

// Login User
const loginUser = async (req, res) => {
    const { email, password } = req.body;
    const user = await User.findOne({ email });
    if (!user || !(await bcrypt.compare(password, user.password))) {
        return res.status(401).json({ error: 'Invalid credentials' });
    }
    const token = jwt.sign({ id: user._id }, user.jwtSecret, { expiresIn: '1h' });
    res.json({ token });
};

// JWT Secret Rotation
const rotateJwtSecret = async (userId) => {
    const user = await User.findById(userId);
    if (!user) return;
    const currentTimestamp = new Date();
    const rotationInterval = parseInt(process.env.JWT_ROTATE_INTERVAL, 10); // JWT rotation interval in hours
    if (shouldRotateKey(user.lastJwtRotation, rotationInterval)) {
        const newJwtSecret = generateJwtSecret();
        user.jwtSecret = newJwtSecret;
        user.lastJwtRotation = currentTimestamp;
        await user.save();
        console.log('JWT secret rotated successfully');
    }
};

// Helper function to check if rotation is needed
function shouldRotateKey(lastRotation, interval) {
    const rotationInterval = interval * 60 * 60 * 1000; // Convert hours to milliseconds
    return Date.now() - new Date(lastRotation).getTime() > rotationInterval;
}

module.exports = { registerUser, loginUser, rotateJwtSecret };
