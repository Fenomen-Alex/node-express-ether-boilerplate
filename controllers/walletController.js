const { ethers } = require('ethers');
const { generateRandomSecret, encryptPrivateKey, decryptPrivateKey, shouldRotateKey } = require('../utils/utils');
const User = require('../models/User');

// Rotate Encryption Key and Re-encrypt Private Key
const rotateEncryptionKey = async (userId) => {
    const user = await User.findById(userId);
    if (!user) return;

    const currentTimestamp = new Date();
    const rotationInterval = 7 * 24 * 60 * 60 * 1000; // 7 days in milliseconds

    if (shouldRotateKey(user.lastKeyRotation, rotationInterval)) {
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

    await rotateEncryptionKey(userId); // Ensure key rotation is up to date

    const decryptedPrivateKey = decryptPrivateKey(user.encryptedPrivateKey, user.encryptionSecret, user.iv);
    const provider = new ethers.JsonRpcProvider(process.env.INFURA_URL);
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

module.exports = { sendEther, rotateEncryptionKey };
