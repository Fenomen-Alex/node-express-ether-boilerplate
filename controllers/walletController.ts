import { ethers } from 'ethers';
import crypto from 'crypto';
import User from '../models/User';
import { Request, Response } from 'express';

// Helper functions for encryption
function generateRandomSecret(): string {
    return crypto.randomBytes(32).toString('hex');
}

function encryptPrivateKey(privateKey: string, encryptionSecret: string): { iv: string; encryptedData: string } {
    const iv = crypto.randomBytes(16);
    const cipher = crypto.createCipheriv('aes-256-cbc', Buffer.from(encryptionSecret, 'hex'), iv);
    const encrypted = Buffer.concat([cipher.update(privateKey), cipher.final()]);
    return {
        iv: iv.toString('hex'),
        encryptedData: encrypted.toString('hex'),
    };
}

function decryptPrivateKey(encryptedPrivateKey: string, encryptionSecret: string, iv: string): string {
    const decipher = crypto.createDecipheriv('aes-256-cbc', Buffer.from(encryptionSecret, 'hex'), Buffer.from(iv, 'hex'));
    const decrypted = Buffer.concat([decipher.update(Buffer.from(encryptedPrivateKey, 'hex')), decipher.final()]);
    return decrypted.toString();
}

// Check if it's time to rotate the key
function shouldRotateKey(lastKeyRotation: Date): boolean {
    const rotationInterval = 7 * 24 * 60 * 60 * 1000; // 7 days in milliseconds
    return Date.now() - lastKeyRotation.getTime() > rotationInterval;
}

// Rotate encryption key
export const rotateEncryptionKey = async (userId: string): Promise<void> => {
    const user = await User.findById(userId);
    if (!user) return;

    const currentTimestamp = new Date();
    if (shouldRotateKey(user.lastKeyRotation)) {
        const newEncryptionSecret = generateRandomSecret();
        const decryptedPrivateKey = decryptPrivateKey(user.encryptedPrivateKey, user.encryptionSecret, user.iv);
        const encryptedPrivateKey = encryptPrivateKey(decryptedPrivateKey, newEncryptionSecret);

        user.encryptionSecret = newEncryptionSecret;
        user.encryptedPrivateKey = encryptedPrivateKey.encryptedData;
        user.iv = encryptedPrivateKey.iv;
        user.lastKeyRotation = currentTimestamp;

        await user.save();
        console.log('Encryption key rotated successfully');
    }
};

// Send Ether
export const sendEther = async (req: Request, res: Response): Promise<void> => {
    const { receiverAddress, amount } = req.body;
    // @ts-ignore
    const userId = req.user.id;

    const user = await User.findById(userId);
    if (!user) {
        res.status(401).json({ error: 'User not found' });
        return;
    }

    await rotateEncryptionKey(userId);

    const decryptedPrivateKey = decryptPrivateKey(user.encryptedPrivateKey, user.encryptionSecret, user.iv);
    const provider = new ethers.JsonRpcProvider(process.env.INFURA_URL!);
    const wallet = new ethers.Wallet(decryptedPrivateKey, provider);

    try {
        const tx = {
            to: receiverAddress,
            value: ethers.parseEther(amount),
        };
        const txResponse = await wallet.sendTransaction(tx);
        await txResponse.wait();

        res.json({ message: 'Transaction successful', txHash: txResponse.hash });
    } catch (error) {
        res.status(500).json({ error: 'Transaction failed' });
    }
};
