import mongoose, { Document, Schema } from 'mongoose';

interface IUser extends Document {
    username: string;
    email: string;
    password: string;
    encryptedPrivateKey: string;
    encryptionSecret: string;
    publicKey: string;
    iv: string;
    lastKeyRotation: Date;
    lastJwtRotation: Date;
    jwtSecret: string;
}

const userSchema = new Schema<IUser>({
    username: { type: String, required: true, unique: true },
    email: { type: String, required: true, unique: true },
    password: { type: String, required: true },
    encryptedPrivateKey: { type: String, required: true },
    encryptionSecret: { type: String, required: true },
    publicKey: { type: String, required: true },
    iv: { type: String, required: true },
    lastKeyRotation: { type: Date, required: true },
    lastJwtRotation: { type: Date, required: true },
    jwtSecret: { type: String, required: true },
});

const User = mongoose.model<IUser>('User', userSchema);

export default User;
