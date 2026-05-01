import NextAuth, { CredentialsSignin } from "next-auth";
import { authConfig } from "./auth.config";
import Credentials from "next-auth/providers/credentials";
import bcrypt from "bcryptjs";
import User from "@/models/User";
import { connectDB } from "@/lib/db/dbConfig";
import { sendOTPEmail } from "@/lib/otp";
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

        // OTP Verification Action
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
            return user;
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
          throw new CustomError(
            newAttempts >= 3
              ? `LOCKED_${lockUntil?.getTime()}`
              : "Invalid credentials."
          );
        }

        if (user.loginAttempts > 0 || user.lockUntil) {
          await User.updateOne(
            { email: user.email },
            { $set: { loginAttempts: 0, lockUntil: null } }
          );
        }

        const headersList = await headers();
        const userAgent = headersList.get("user-agent") || "Unknown Device";

        let isKnownDevice = false;
        if (user.knownDevices && Array.isArray(user.knownDevices)) {
          isKnownDevice = user.knownDevices.some(
            (device: any) => device.userAgent === userAgent
          );
        }

        if (!isKnownDevice) {
          await User.updateOne(
            { email: user.email },
            { $push: { knownDevices: { userAgent, lastLogin: new Date() } } }
          );
          try {
            await sendSecurityAlertEmail(user.email, userAgent);
          } catch (error) {
            console.error(">> [auth.ts] Failed to send security alert:", error);
          }
        } else {
          await User.updateOne(
            { email: user.email, "knownDevices.userAgent": userAgent },
            { $set: { "knownDevices.$.lastLogin": new Date() } }
          );
        }

        const otp = Math.floor(100000 + Math.random() * 900000).toString();

        await User.updateOne(
          { email: user.email },
          {
            twoFactorOTP: otp,
            twoFactorOTPExpires: new Date(Date.now() + 5 * 60 * 1000),
          }
        );

        try {
          await sendOTPEmail(user.email, otp);
        } catch (error) {
          throw new CustomError("Failed to send OTP email.");
        }

        throw new CustomError(`OTP_REQUIRED_${user.email}`);
      },
    }),
  ],
});
