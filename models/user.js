import mongoose from 'mongoose';
import crypto from 'crypto';

const UserSchema = new mongoose.Schema(
  {
    email: { type: String, unique: true, required: true },
    username: { type: String, required: true },
    password: { type: String, required: true },
    verified: { type: Boolean, default: false },
    verify_token: { type: String, default: '' },
    verify_expired: { type: Date, default: Date.now },
    getVerificationToken: { type: String, default: '' },
  },
  { timestamps: true }
);


const User = mongoose.models.User || mongoose.model('User', UserSchema);

export default User;
