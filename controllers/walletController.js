const { ethers } = require('ethers');
const crypto = require('crypto');
const User = require('../models/User');

// Generate random encryption secret
function generateRandomSecret() {
    return crypto.randomBytes(32).toString('hex');
}

// Encrypt private key with new secret
function encryptPrivateKey(privateKey, encryptionSecret) {
    const iv = crypto.randomBytes(16);
    const cipher = crypto.createCipheriv('aes-256-cbc', Buffer.from(encryptionSecret, 'hex'), iv);
    const encrypted = Buffer.concat([cipher.update(privateKey), cipher.final()]);
    return { iv: iv.toString('hex'), encryptedData: encrypted.toString('hex') };
}

// Decrypt private key
function decryptPrivateKey(encryptedPrivateKey, encryptionSecret, iv) {
    const decipher = crypto.createDecipheriv('aes-256-cbc', Buffer.from(encryptionSecret, 'hex'), Buffer.from(iv, 'hex'));
    const decrypted = Buffer.concat([decipher.update(Buffer.from(encryptedPrivateKey, 'hex')), decipher.final()]);
    return decrypted.toString();
}

// Check if it's time to rotate encryption keys
function shouldRotateKey(lastKeyRotation) {
    const rotationInterval = 7 * 24 * 60 * 60 * 1000; // 7 days in ms
    return Date.now() - lastKeyRotation > rotationInterval;
}

// Rotate encryption key and re-encrypt private key
const rotateEncryptionKey = async (userId) => {
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
const sendEther = async (req, res) => {
    const { receiverAddress, amount } = req.body;
    const userId = req.user.id;

    const user = await User.findById(userId);
    await rotateEncryptionKey(userId);

    const decryptedPrivateKey = decryptPrivateKey(user.encryptedPrivateKey, user.encryptionSecret, user.iv);
    const provider = new ethers.JsonRpcProvider(process.env.INFURA_URL);
    const wallet = new ethers.Wallet(decryptedPrivateKey, provider);

    try {
        const tx = { to: receiverAddress, value: ethers.parseEther(amount) };
        const txResponse = await wallet.sendTransaction(tx);
        await txResponse.wait();

        res.json({ message: 'Transaction successful', txHash: txResponse.hash });
    } catch (error) {
        res.status(500).json({ error: 'Transaction failed' });
    }
};

module.exports = { sendEther, rotateEncryptionKey };
