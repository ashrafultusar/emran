import { auth, signOut } from "@/auth";
import { redirect } from "next/navigation";
import React from "react";

const ProfilePage = async () => {
    const session = await auth();

    if (!session?.user) {
        redirect("/login");
    }

    return (
        <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-900 via-blue-900 to-slate-900 px-4">
            <div className="max-w-md w-full bg-white/10 backdrop-blur-lg border border-white/20 p-8 rounded-2xl shadow-2xl">
                {/* Avatar */}
                <div className="flex justify-center mb-6">
                    <div className="w-20 h-20 bg-blue-600/30 border-2 border-blue-400 rounded-full flex items-center justify-center">
                        <span className="text-3xl font-bold text-blue-300">
                            {session.user.name?.charAt(0).toUpperCase() || "U"}
                        </span>
                    </div>
                </div>

                {/* User Info */}
                <div className="text-center mb-8">
                    <h2 className="text-2xl font-bold text-white">
                        {session.user.name}
                    </h2>
                    <p className="text-slate-400 mt-1">{session.user.email}</p>
                </div>

                {/* User Details Card */}
                <div className="bg-white/5 border border-white/10 rounded-xl p-5 space-y-4 mb-6">
                    <div className="flex justify-between items-center">
                        <span className="text-slate-400 text-sm">Name</span>
                        <span className="text-white text-sm font-medium">
                            {session.user.name}
                        </span>
                    </div>
                    <hr className="border-white/10" />
                    <div className="flex justify-between items-center">
                        <span className="text-slate-400 text-sm">Email</span>
                        <span className="text-white text-sm font-medium">
                            {session.user.email}
                        </span>
                    </div>
                    <hr className="border-white/10" />
                    <div className="flex justify-between items-center">
                        <span className="text-slate-400 text-sm">User ID</span>
                        <span className="text-white text-xs font-mono bg-white/5 px-2 py-1 rounded">
                            {(session.user as any).id}
                        </span>
                    </div>
                    <hr className="border-white/10" />
                    <div className="flex justify-between items-center">
                        <span className="text-slate-400 text-sm">Status</span>
                        <span className="text-green-400 text-sm font-medium flex items-center gap-1">
                            <span className="w-2 h-2 bg-green-400 rounded-full inline-block animate-pulse"></span>
                            Active
                        </span>
                    </div>
                </div>

                {/* Logout Button */}
                <form
                    action={async () => {
                        "use server";
                        await signOut({ redirectTo: "/login" });
                    }}
                >
                    <button
                        type="submit"
                        className="w-full bg-red-600/80 hover:bg-red-600 text-white font-semibold py-3 rounded-xl shadow-lg transition-all active:scale-[0.98]"
                    >
                        Sign Out
                    </button>
                </form>
            </div>
        </div>
    );
};

export default ProfilePage;