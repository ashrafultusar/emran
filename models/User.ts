import mongoose, { Schema, Document } from "mongoose";

export interface IUser extends Document {
    name: string;
    email: string;
    password: string;
    loginAttempts: number;
    lockUntil: Date | null;
    twoFactorOTP: string | null;
    twoFactorOTPExpires: Date | null;
    resetToken: string | null;
    resetTokenExpires: Date | null;
    knownDevices: { userAgent: string; lastLogin: Date }[];
    createdAt: Date;
}

const UserSchema: Schema = new Schema(
    {
        name: {
            type: String,
            required: [true, "Name is required"],
            trim: true,
        },
        email: {
            type: String,
            required: [true, "Email is required"],
            unique: true,
            lowercase: true,
            trim: true,
        },
        password: {
            type: String,
            required: [true, "Password is required"],
            minlength: 8,
        },
        loginAttempts: {
            type: Number,
            default: 0,
        },
        lockUntil: {
            type: Date,
            default: null,
        },
        twoFactorOTP: {
            type: String,
            default: null,
        },
        twoFactorOTPExpires: {
            type: Date,
            default: null,
        },
        resetToken: {
            type: String,
            default: null,
        },
        resetTokenExpires: {
            type: Date,
            default: null,
        },
        knownDevices: [
            {
                userAgent: { type: String },
                lastLogin: { type: Date, default: Date.now },
            },
        ],
    },
    {
        timestamps: true,
    }
);

const User = mongoose.models.User || mongoose.model<IUser>("User", UserSchema);

export default User;
