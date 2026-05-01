"use server";

import { connectDB } from "@/lib/db/dbConfig";
import User from "@/models/User";
import bcrypt from "bcryptjs";
import crypto from "crypto";
import { signIn } from "@/auth";
import { AuthError } from "next-auth";
import { sendPasswordResetEmail } from "@/lib/mail";

// ==================== REGISTER ====================
export async function registerUser(formData: FormData) {
    const name = formData.get("name") as string;
    const email = formData.get("email") as string;
    const password = formData.get("password") as string;
    const confirmPassword = formData.get("confirmPassword") as string;

    // Validation
    if (!name || !email || !password || !confirmPassword) {
        return { error: "All fields are required." };
    }

    // Strong password validation
    if (password.length < 8) {
        return { error: "Password must be at least 8 characters." };
    }
    if (!/[A-Z]/.test(password)) {
        return { error: "Password must contain at least one uppercase letter." };
    }
    if (!/[a-z]/.test(password)) {
        return { error: "Password must contain at least one lowercase letter." };
    }
    if (!/[0-9]/.test(password)) {
        return { error: "Password must contain at least one number." };
    }
    if (!/[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(password)) {
        return { error: "Password must contain at least one special character." };
    }

    if (password !== confirmPassword) {
        return { error: "Passwords do not match." };
    }

    try {
        await connectDB();

        // Check if user already exists
        const existingUser = await User.findOne({ email: email.toLowerCase() });
        if (existingUser) {
            return { error: "This email is already registered." };
        }

        // Hash password
        const hashedPassword = await bcrypt.hash(password, 12);

        // Create user
        await User.create({
            name,
            email: email.toLowerCase(),
            password: hashedPassword,
        });

        return { success: "Account created successfully! Please login." };
    } catch (error: any) {
        console.error("Registration error:", error);
        return { error: "Something went wrong. Please try again." };
    }
}

// ==================== LOGIN ====================
export async function loginUser(formData: FormData) {
    const email = formData.get("email") as string;
    const password = formData.get("password") as string;

    if (!email || !password) {
        return { error: "Email and password are required." };
    }

    try {
        await signIn("credentials", {
            email,
            password,
            redirect: false,
        });

        return { success: true };
    } catch (error: any) {
        if (error instanceof AuthError) {
            const code = (error as any).code || "";

            // OTP Required
            if (code.startsWith("OTP_REQUIRED_")) {
                const otpEmail = code.replace("OTP_REQUIRED_", "");
                return { otpRequired: true, email: otpEmail };
            }

            // Account Locked
            if (code.startsWith("LOCKED_")) {
                const lockTime = parseInt(code.replace("LOCKED_", ""));
                return { locked: true, lockUntil: lockTime };
            }

            // Invalid credentials
            return { error: code || "Invalid credentials." };
        }

        throw error;
    }
}

// ==================== VERIFY OTP ====================
export async function verifyOTP(email: string, otp: string) {
    if (!email || !otp) {
        return { error: "Email and OTP are required." };
    }

    try {
        await signIn("credentials", {
            email,
            otp,
            action: "verify_otp",
            redirect: false,
        });

        return { success: true };
    } catch (error: any) {
        if (error instanceof AuthError) {
            const code = (error as any).code || "";
            return { error: code || "Invalid or expired OTP." };
        }

        throw error;
    }
}

// ==================== FORGOT PASSWORD ====================
export async function forgotPassword(formData: FormData) {
    const email = (formData.get("email") as string)?.trim().toLowerCase();

    if (!email) {
        return { error: "Email is required." };
    }

    try {
        await connectDB();

        const user = await User.findOne({ email });
        if (!user) {
            // Don't reveal if email exists
            return { success: "If this email is registered, a reset link has been sent." };
        }

        // Generate secure reset token
        const resetToken = crypto.randomBytes(32).toString("hex");
        const resetTokenExpires = new Date(Date.now() + 15 * 60 * 1000); // 15 minutes

        await User.updateOne(
            { email },
            { $set: { resetToken, resetTokenExpires } }
        );

        await sendPasswordResetEmail(email, resetToken);

        return { success: "If this email is registered, a reset link has been sent." };
    } catch (error) {
        console.error("Forgot password error:", error);
        return { error: "Something went wrong. Please try again." };
    }
}

// ==================== RESET PASSWORD ====================
export async function resetPassword(token: string, newPassword: string) {
    if (!token || !newPassword) {
        return { error: "Token and new password are required." };
    }

    // Strong password validation
    if (newPassword.length < 8) {
        return { error: "Password must be at least 8 characters." };
    }
    if (!/[A-Z]/.test(newPassword)) {
        return { error: "Password must contain at least one uppercase letter." };
    }
    if (!/[a-z]/.test(newPassword)) {
        return { error: "Password must contain at least one lowercase letter." };
    }
    if (!/[0-9]/.test(newPassword)) {
        return { error: "Password must contain at least one number." };
    }
    if (!/[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(newPassword)) {
        return { error: "Password must contain at least one special character." };
    }

    try {
        await connectDB();

        const user = await User.findOne({
            resetToken: token,
            resetTokenExpires: { $gt: new Date() },
        });

        if (!user) {
            return { error: "Invalid or expired reset link." };
        }

        const hashedPassword = await bcrypt.hash(newPassword, 12);

        await User.updateOne(
            { _id: user._id },
            {
                $set: { password: hashedPassword },
                $unset: { resetToken: "", resetTokenExpires: "" },
            }
        );

        return { success: "Password reset successfully! You can now login." };
    } catch (error) {
        console.error("Reset password error:", error);
        return { error: "Something went wrong. Please try again." };
    }
}
