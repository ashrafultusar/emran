"use client";

import React, { useState } from "react";
import { forgotPassword } from "@/actions/auth";
import Link from "next/link";

const ForgotPasswordPage = () => {
    const [error, setError] = useState("");
    const [success, setSuccess] = useState("");
    const [loading, setLoading] = useState(false);

    const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        setError("");
        setSuccess("");
        setLoading(true);

        try {
            const formData = new FormData(e.currentTarget);
            const result = await forgotPassword(formData);

            if (result.error) {
                setError(result.error);
            } else if (result.success) {
                setSuccess(result.success);
            }
        } catch {
            setError("Something went wrong. Please try again.");
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
                        🔑 Forgot Password
                    </h2>
                    <p className="text-slate-300 mt-2">
                        Enter your email to receive a reset link
                    </p>
                </div>

                {/* Error Message */}
                {error && (
                    <div className="mb-6 bg-red-500/10 border border-red-500/30 rounded-xl px-4 py-3 text-red-300 text-sm text-center">
                        {error}
                    </div>
                )}

                {/* Success Message */}
                {success && (
                    <div className="mb-6 bg-green-500/10 border border-green-500/30 rounded-xl px-4 py-3 text-green-300 text-sm text-center">
                        ✅ {success}
                    </div>
                )}

                <form onSubmit={handleSubmit} className="space-y-6">
                    <div>
                        <label className="block text-sm font-medium text-slate-200 mb-2">
                            Email Address
                        </label>
                        <input
                            type="email"
                            name="email"
                            className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl focus:ring-2 focus:ring-blue-500 focus:outline-none text-white transition-all"
                            placeholder="example@mail.com"
                            required
                        />
                    </div>

                    <button
                        type="submit"
                        disabled={loading}
                        className="w-full bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white font-semibold py-3 rounded-xl shadow-lg shadow-blue-500/30 transition-all active:scale-[0.98]"
                    >
                        {loading ? "Sending..." : "Send Reset Link"}
                    </button>
                </form>

                <div className="mt-8 text-center">
                    <Link
                        href="/login"
                        className="text-slate-400 hover:text-white text-sm transition-all"
                    >
                        ← Back to Login
                    </Link>
                </div>
            </div>
        </div>
    );
};

export default ForgotPasswordPage;
