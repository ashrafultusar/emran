"use client";

import React, { useState, useEffect } from "react";
import { loginUser, verifyOTP } from "@/actions/auth";
import { useRouter } from "next/navigation";
import Link from "next/link";

const LoginPage = () => {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [otp, setOtp] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [otpRequired, setOtpRequired] = useState(false);
  const [otpEmail, setOtpEmail] = useState("");
  const [lockUntil, setLockUntil] = useState<number | null>(null);
  const [countdown, setCountdown] = useState(0);

  // Lockout countdown timer
  useEffect(() => {
    if (!lockUntil) return;
    const remaining = Math.ceil((lockUntil - Date.now()) / 1000);
    if (remaining <= 0) {
      setLockUntil(null);
      setCountdown(0);
      return;
    }
    setCountdown(remaining);
    const interval = setInterval(() => {
      const rem = Math.ceil((lockUntil - Date.now()) / 1000);
      if (rem <= 0) {
        setLockUntil(null);
        setCountdown(0);
        clearInterval(interval);
      } else {
        setCountdown(rem);
      }
    }, 1000);
    return () => clearInterval(interval);
  }, [lockUntil]);

  // Handle Login Submit
  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const formData = new FormData();
      formData.append("email", email);
      formData.append("password", password);

      const result = await loginUser(formData);

      if (result.error) {
        setError(result.error);
      } else if (result.locked) {
        setLockUntil(result.lockUntil!);
        setError("");
      } else if (result.otpRequired) {
        setOtpRequired(true);
        setOtpEmail(result.email!);
        setError("");
      } else if (result.success) {
        router.push("/profile");
        router.refresh();
      }
    } catch {
      setError("Something went wrong.");
    } finally {
      setLoading(false);
    }
  };

  // Handle OTP Verify
  const handleVerifyOTP = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const result = await verifyOTP(otpEmail, otp);

      if (result.error) {
        setError(result.error);
      } else if (result.success) {
        router.push("/profile");
        router.refresh();
      }
    } catch {
      setError("Something went wrong.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-900 via-blue-900 to-slate-900 px-4">
      <div className="max-w-md w-full bg-white/10 backdrop-blur-lg border border-white/20 p-8 rounded-2xl shadow-2xl">
        {/* Header */}
        <div className="text-center mb-10">
          <h2 className="text-3xl font-bold text-white tracking-tight">
            {otpRequired ? "🔐 Enter OTP" : "Welcome Back"}
          </h2>
          <p className="text-slate-300 mt-2">
            {otpRequired
              ? `A verification code has been sent to ${otpEmail}`
              : "Login your Account"}
          </p>
        </div>

        {/* Error Message */}
        {error && (
          <div className="mb-6 bg-red-500/10 border border-red-500/30 rounded-xl px-4 py-3 text-red-300 text-sm text-center">
            {error}
          </div>
        )}

        {/* Lockout Message */}
        {lockUntil && countdown > 0 && (
          <div className="mb-6 bg-yellow-500/10 border border-yellow-500/30 rounded-xl px-4 py-3 text-yellow-300 text-sm text-center">
            ⏳ Account locked. Try again in <strong>{countdown}s</strong>
          </div>
        )}

        {/* OTP Form */}
        {otpRequired ? (
          <form onSubmit={handleVerifyOTP} className="space-y-6">
            <div>
              <label className="block text-sm font-medium text-slate-200 mb-2">
                Verification Code
              </label>
              <input
                type="text"
                value={otp}
                onChange={(e) => setOtp(e.target.value)}
                className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl focus:ring-2 focus:ring-blue-500 focus:outline-none text-white text-center text-2xl tracking-[0.5em] transition-all"
                placeholder="000000"
                maxLength={6}
                required
              />
            </div>
            <button
              type="submit"
              disabled={loading}
              className="w-full bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white font-semibold py-3 rounded-xl shadow-lg shadow-blue-500/30 transition-all active:scale-[0.98]"
            >
              {loading ? "Verifying..." : "Verify OTP"}
            </button>
            <button
              type="button"
              onClick={() => {
                setOtpRequired(false);
                setOtp("");
                setError("");
              }}
              className="w-full text-slate-400 hover:text-white text-sm transition-colors"
            >
              ← Back to Login
            </button>
          </form>
        ) : (
          /* Login Form */
          <form onSubmit={handleLogin} className="space-y-6">
            {/* Email Input */}
            <div>
              <label className="block text-sm font-medium text-slate-200 mb-2">
                Email Address
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl focus:ring-2 focus:ring-blue-500 focus:outline-none text-white transition-all"
                placeholder="example@mail.com"
                required
              />
            </div>

            {/* Password Input */}
            <div>
              <label className="block text-sm font-medium text-slate-200 mb-2">
                Password
              </label>
              <div className="relative">
                <input
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full px-4 py-3 pr-12 bg-white/5 border border-white/10 rounded-xl focus:ring-2 focus:ring-blue-500 focus:outline-none text-white transition-all"
                  placeholder="••••••••"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white transition-colors"
                >
                  {showPassword ? (
                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5"><path strokeLinecap="round" strokeLinejoin="round" d="M3.98 8.223A10.477 10.477 0 0 0 1.934 12c1.292 4.338 5.31 7.5 10.066 7.5.993 0 1.953-.138 2.863-.395M6.228 6.228A10.451 10.451 0 0 1 12 4.5c4.756 0 8.773 3.162 10.065 7.498a10.522 10.522 0 0 1-4.293 5.774M6.228 6.228 3 3m3.228 3.228 3.65 3.65m7.894 7.894L21 21m-3.228-3.228-3.65-3.65m0 0a3 3 0 1 0-4.243-4.243m4.242 4.242L9.88 9.88" /></svg>
                  ) : (
                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5"><path strokeLinecap="round" strokeLinejoin="round" d="M2.036 12.322a1.012 1.012 0 0 1 0-.639C3.423 7.51 7.36 4.5 12 4.5c4.638 0 8.573 3.007 9.963 7.178.07.207.07.431 0 .639C20.577 16.49 16.64 19.5 12 19.5c-4.638 0-8.573-3.007-9.963-7.178Z" /><path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 1 1-6 0 3 3 0 0 1 6 0Z" /></svg>
                  )}
                </button>
              </div>
            </div>

            {/* Forgot Password Link */}
            <div className="text-right">
              <Link
                href="/forgot-password"
                className="text-sm text-slate-400 hover:text-white transition-colors"
              >
                Forgot Password?
              </Link>
            </div>

            {/* Login Button */}
            <button
              type="submit"
              disabled={loading || (lockUntil !== null && countdown > 0)}
              className="w-full bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white font-semibold py-3 rounded-xl shadow-lg shadow-blue-500/30 transition-all active:scale-[0.98]"
            >
              {loading ? "Signing In..." : "Sign In"}
            </button>
          </form>
        )}

        {/* Footer */}
        {!otpRequired && (
          <div className="mt-8 text-center">
            <p className="text-slate-400 text-sm">
             Don&apos;t have an account
              <Link
                href="/register"
                className="ml-1 text-white font-medium hover:underline transition-all"
              >
                Sign up 
              </Link>
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

export default LoginPage;