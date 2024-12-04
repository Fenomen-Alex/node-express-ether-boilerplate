const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const User = require('../models/User');
const { ethers } = require('ethers');
const { generateRandomSecret, encryptPrivateKey } = require('../utils/utils');
const dotenv = require('dotenv');
dotenv.config();

// Register User
const registerUser = async (req, res) => {
    const { username, email, password } = req.body;
    const wallet = ethers.Wallet.createRandom();
    const encryptionSecret = generateRandomSecret();
    const encryptedPrivateKey = encryptPrivateKey(wallet.privateKey, encryptionSecret);
    const jwtSecret = generateRandomSecret(); // Generate random JWT secret

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
    const rotationInterval = parseInt(process.env.JWT_ROTATE_INTERVAL, 10); // Convert from hours

    // Check if it's time to rotate the JWT secret
    if (shouldRotateKey(user.lastJwtRotation, rotationInterval)) {
        const newJwtSecret = generateRandomSecret();
        user.jwtSecret = newJwtSecret;
        user.lastJwtRotation = currentTimestamp;
        await user.save();
        console.log('JWT secret rotated successfully');
    }
};

module.exports = { registerUser, loginUser, rotateJwtSecret };
