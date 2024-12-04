import crypto from 'crypto';

/**
 * Generate a random secret key.
 * @returns {string} Randomly generated 32-byte secret as a hex string.
 */
export function generateRandomSecret(): string {
    return crypto.randomBytes(32).toString('hex');
}

/**
 * Encrypt a private key using AES-256-CBC algorithm.
 * @param {string} privateKey - The private key to encrypt.
 * @param {string} encryptionSecret - The secret key used for encryption.
 * @returns {Object} Encrypted data and initialization vector (IV).
 */
export function encryptPrivateKey(privateKey: string, encryptionSecret: string): { iv: string; encryptedData: string } {
    const iv = crypto.randomBytes(16);
    const cipher = crypto.createCipheriv('aes-256-cbc', Buffer.from(encryptionSecret, 'hex'), iv);
    const encrypted = Buffer.concat([cipher.update(privateKey), cipher.final()]);
    return {
        iv: iv.toString('hex'),
        encryptedData: encrypted.toString('hex'),
    };
}

/**
 * Decrypt a private key using AES-256-CBC algorithm.
 * @param {string} encryptedPrivateKey - The encrypted private key.
 * @param {string} encryptionSecret - The secret key used for decryption.
 * @param {string} iv - The initialization vector (IV) used during encryption.
 * @returns {string} Decrypted private key.
 */
export function decryptPrivateKey(encryptedPrivateKey: string, encryptionSecret: string, iv: string): string {
    const decipher = crypto.createDecipheriv('aes-256-cbc', Buffer.from(encryptionSecret, 'hex'), Buffer.from(iv, 'hex'));
    const decrypted = Buffer.concat([decipher.update(Buffer.from(encryptedPrivateKey, 'hex')), decipher.final()]);
    return decrypted.toString();
}

/**
 * Helper function to check if it's time to rotate a key.
 * @param {Date} lastRotation - The timestamp of the last rotation.
 * @param {number} interval - The interval (in ms) after which the key should be rotated.
 * @returns {boolean} True if rotation is needed, false otherwise.
 */
export function shouldRotateKey(lastRotation: Date, interval: number): boolean {
    const rotationInterval = interval * 60 * 60 * 1000; // Convert hours to milliseconds
    return Date.now() - new Date(lastRotation).getTime() > rotationInterval;
}
