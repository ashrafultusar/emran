import NextAuth, { CredentialsSignin } from "next-auth";
import { authConfig } from "./auth.config";
import Credentials from "next-auth/providers/credentials";
import bcrypt from "bcryptjs";
import User from "@/models/User";
import { connectDB } from "@/lib/db/dbConfig";
import { sendOTPEmail } from "@/lib/otp"; // আপনার otp helper path
import { headers } from "next/headers";
import { sendSecurityAlertEmail } from "@/lib/mail";

class CustomError extends CredentialsSignin {
  constructor(code: string) {
    super();
    this.code = code;
  }
}

export const { auth, signIn, signOut, handlers } = NextAuth({
  ...authConfig,
  providers: [
    Credentials({
      async authorize(credentials) {
        if (!credentials?.email) return null;

        await connectDB();
        const user = await User.findOne({ email: credentials.email });

        if (!user) throw new CustomError("Invalid credentials.");

        // --- OTP Verification Action ---
        if (credentials.action === "verify_otp") {
          if (
            user.twoFactorOTP === credentials.otp &&
            user.twoFactorOTPExpires &&
            user.twoFactorOTPExpires.getTime() > Date.now()
          ) {
            await User.updateOne(
              { email: user.email },
              { $unset: { twoFactorOTP: "", twoFactorOTPExpires: "" } }
            );
            return user; // Session is created here!
          } else {
            throw new CustomError("Invalid or Expired OTP.");
          }
        }

        if (!credentials?.password) return null;

        if (user.lockUntil && user.lockUntil.getTime() > Date.now()) {
          throw new CustomError(`LOCKED_${user.lockUntil.getTime()}`);
        }

        const passwordsMatch = await bcrypt.compare(
          credentials.password as string,
          user.password
        );

        if (!passwordsMatch) {
          const newAttempts = (user.loginAttempts || 0) + 1;
          let lockUntil = null;
          if (newAttempts >= 3) {
            lockUntil = new Date(Date.now() + 20 * 1000);
          }
          await User.updateOne(
            { email: user.email },
            { $set: { loginAttempts: newAttempts, lockUntil: lockUntil } }
          );
          throw new CustomError(newAttempts >= 3 ? `LOCKED_${lockUntil?.getTime()}` : "Invalid credentials.");
        }

        // --- SUCCESSFUL LOGIN: Reset attempts ---
        if (user.loginAttempts > 0 || user.lockUntil) {
          await User.updateOne(
            { email: user.email },
            { $set: { loginAttempts: 0, lockUntil: null } }
          );
        }

        // --- New Device Login Detection ---
        const headersList = await headers();
        const userAgent = headersList.get("user-agent") || "Unknown Device";

        let isKnownDevice = false;
        if (user.knownDevices && Array.isArray(user.knownDevices)) {
          isKnownDevice = user.knownDevices.some((device: any) => device.userAgent === userAgent);
        }

        if (!isKnownDevice) {
          // Add to newly known devices
          await User.updateOne(
            { email: user.email },
            { $push: { knownDevices: { userAgent, lastLogin: new Date() } } }
          );

          try {
            await sendSecurityAlertEmail(user.email, userAgent);
            console.log(">> [auth.ts] Security alert email sent.");
          } catch (error) {
            console.error(">> [auth.ts] Failed to send security alert:", error);
          }
        } else {
          // Update lastLogin time
          await User.updateOne(
            { email: user.email, "knownDevices.userAgent": userAgent },
            { $set: { "knownDevices.$.lastLogin": new Date() } }
          );
        }

        // --- 2FA Logic Start ---
        // ১. OTP তৈরি (৬ ডিজিট)
        const otp = Math.floor(100000 + Math.random() * 900000).toString();

        // ২. ডাটাবেসে OTP এবং মেয়াদ (৫ মিনিট) সেভ
        await User.updateOne(
          { email: user.email },
          {
            twoFactorOTP: otp,
            twoFactorOTPExpires: new Date(Date.now() + 5 * 60 * 1000)
          }
        );
        console.log(">> [auth.ts] Saved OTP to DB");

        // ৩. ইমেইল পাঠানো
        try {
          console.log(">> [auth.ts] Calling sendOTPEmail...");
          await sendOTPEmail(user.email, otp);
          console.log(">> [auth.ts] sendOTPEmail completed successfully.");
        } catch (error) {
          console.error(">> [auth.ts] Caught error from sendOTPEmail:", error);
          throw new CustomError("Failed to send OTP email.");
        }

        // ৪. বিশেষ এরর থ্রো করা যা ফ্রন্টএন্ডে ধরা হবে
        throw new CustomError(`OTP_REQUIRED_${user.email}`);
        // --- 2FA Logic End ---
      },
    }),
  ],
});