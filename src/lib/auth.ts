/**
 * MoodFlix — NextAuth v4 configuration.
 *
 * - Credentials provider (email + password) stored in our Prisma DB.
 * - JWT session strategy (works without a session database table).
 * - Guests (not signed in) can still use the questionnaire — auth is only
 *   required for watchlist, watched history, and saved preferences.
 */
import type { NextAuthOptions } from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import { db } from "@/lib/db";
import { verifyPassword } from "@/lib/password";

export const authOptions: NextAuthOptions = {
  session: { strategy: "jwt" },
  providers: [
    CredentialsProvider({
      name: "Credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        const email = credentials?.email?.trim().toLowerCase();
        const password = credentials?.password ?? "";
        if (!email || !password) return null;

        const user = await db.user.findUnique({ where: { email } });
        if (!user || !user.passwordHash) return null;

        const ok = verifyPassword(password, user.passwordHash);
        if (!ok) return null;

        return { id: user.id, email: user.email, name: user.name ?? undefined };
      },
    }),
  ],
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id;
      }
      return token;
    },
    async session({ session, token }) {
      if (session.user && token.id) {
        (session.user as { id?: string }).id = token.id as string;
      }
      return session;
    },
  },
  pages: {
    // We handle auth in a client dialog, so keep NextAuth's default pages
    // available for error redirects but the app rarely uses them.
    signIn: "/",
  },
  secret: process.env.NEXTAUTH_SECRET || "moodflix-dev-secret-change-me",
};
