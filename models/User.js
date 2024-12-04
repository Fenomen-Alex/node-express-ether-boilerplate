const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
    username: { type: String, required: true, unique: true },
    email: { type: String, required: true, unique: true },
    password: { type: String, required: true },
    encryptedPrivateKey: { type: String, required: true },
    encryptionSecret: { type: String, required: true },
    publicKey: { type: String, required: true },
    iv: { type: String, required: true },
    lastKeyRotation: { type: Date, required: true },
    lastJwtRotation: { type: Date, required: true },
});

const User = mongoose.model('User', userSchema);

module.exports = User;
