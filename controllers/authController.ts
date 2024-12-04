import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import User from '../models/User';
import {ethers} from 'ethers';
import {Request, Response} from 'express';
import dotenv from 'dotenv';
import {encryptPrivateKey, generateRandomSecret} from "../utils/utils";

dotenv.config();

// Register User
export const registerUser = async (req: Request, res: Response): Promise<void> => {
    const { username, email, password } = req.body;
    const wallet = ethers.Wallet.createRandom();
    const encryptionSecret = generateRandomSecret();
    const encryptedPrivateKey = encryptPrivateKey(wallet.privateKey, encryptionSecret);
    const jwtSecret = generateRandomSecret();

    try {
        const user = new User({
            username,
            email,
            password: await bcrypt.hash(password, 10),
            encryptedPrivateKey: encryptedPrivateKey.encryptedData,
            encryptionSecret,
            publicKey: wallet.address,
            iv: encryptedPrivateKey.iv,
            lastKeyRotation: new Date(),
            lastJwtRotation: new Date(),
            jwtSecret,
        });

        await user.save();
        res.status(201).json({ message: 'User created successfully' });
    } catch (err) {
        res.status(500).json({ error: 'User registration failed' });
    }
};

// Login User
export const loginUser = async (req: Request, res: Response): Promise<void> => {
    const { email, password } = req.body;
    const user = await User.findOne({ email });

    if (!user || !(await bcrypt.compare(password, user.password))) {
        res.status(401).json({ error: 'Invalid credentials' });
        return;
    }

    const token = jwt.sign({ id: user._id }, user.jwtSecret, { expiresIn: '1h' });
    res.json({ token });
};

// JWT Secret Rotation
export const rotateJwtSecret = async (userId: string): Promise<void> => {
    const user = await User.findById(userId);
    if (!user) return;

    const currentTimestamp = new Date();
    const rotationInterval = parseInt(process.env.JWT_ROTATE_INTERVAL!, 10);

    if (shouldRotateKey(user.lastJwtRotation, rotationInterval)) {
        user.jwtSecret = generateRandomSecret();
        user.lastJwtRotation = currentTimestamp;
        await user.save();
        console.log('JWT secret rotated successfully');
    }
};

// Helper function to check if rotation is needed
function shouldRotateKey(lastRotation: Date, interval: number): boolean {
    const rotationInterval = interval * 60 * 60 * 1000; // Convert hours to milliseconds
    return Date.now() - new Date(lastRotation).getTime() > rotationInterval;
}
