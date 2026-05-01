import type { NextAuthConfig } from "next-auth";

export const authConfig: NextAuthConfig = {
  pages: {
    signIn: "/login",
  },
  providers: [],
  callbacks: {
    authorized({ auth, request: { nextUrl } }) {
      const isLoggedIn = !!auth?.user;
      const { pathname } = nextUrl;

      if (pathname === "/") {
        return isLoggedIn 
          ? Response.redirect(new URL("/profile", nextUrl))
          : Response.redirect(new URL("/login", nextUrl));
      }

      if (pathname.startsWith("/profile")) {
        return isLoggedIn ? true : Response.redirect(new URL("/login", nextUrl));
      }

      if (
        isLoggedIn &&
        (pathname.startsWith("/login") ||
         pathname.startsWith("/register") ||
         pathname.startsWith("/forgot-password") ||
         pathname.startsWith("/reset-password"))
      ) {
        return Response.redirect(new URL("/profile", nextUrl));
      }
      return true;
    },
    jwt({ token, user }) {
      if (user) token.id = user.id;
      return token;
    },
    session({ session, token }) {
      if (token && session.user) {
        (session.user as any).id = token.id as string;
      }
      return session;
    },
  },
};