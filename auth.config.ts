import type { NextAuthConfig } from "next-auth";

export const authConfig = {
  pages: {
    signIn: "/login",
  },
  callbacks: {
    authorized({ auth, request: { nextUrl } }) {
      const isLoggedIn = !!auth?.user;

      // হোম পেজে গেলে: লগইন থাকলে /profile, না থাকলে /login
      const isOnHome = nextUrl.pathname === "/";
      if (isOnHome) {
        if (isLoggedIn) {
          return Response.redirect(new URL("/profile", nextUrl));
        } else {
          return Response.redirect(new URL("/login", nextUrl));
        }
      }

      // প্রোফাইল পেজ প্রোটেকশন
      const isOnProfile = nextUrl.pathname.startsWith("/profile");

      if (isOnProfile) {
        if (isLoggedIn) return true;
        return false; // লগইন না থাকলে /login এ রিডাইরেক্ট করবে
      } else if (isLoggedIn) {
        // লগইন থাকলে login/register পেজে যেতে পারবে না
        if (
          nextUrl.pathname.startsWith("/login") ||
          nextUrl.pathname.startsWith("/register") ||
          nextUrl.pathname.startsWith("/forgot-password") ||
          nextUrl.pathname.startsWith("/reset-password")
        ) {
          return Response.redirect(new URL("/profile", nextUrl));
        }
      }
      return true;
    },
    async jwt({ token, user }) {
      if (user) token.id = user.id;
      return token;
    },
    async session({ session, token }) {
      if (token && session.user) {
        (session.user as any).id = token.id as string;
      }
      return session;
    },
  },
  providers: [],
  cookies: {
    sessionToken: {
      name: `next-auth.session-token`,
      options: {
        httpOnly: true, // XSS সুরক্ষা
        sameSite: "lax",
        path: "/",
        secure: process.env.NODE_ENV === "production",
      },
    },
  },
} satisfies NextAuthConfig;