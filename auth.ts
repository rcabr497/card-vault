import NextAuth from "next-auth";
import Credentials from "next-auth/providers/credentials";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/prisma";

const REMEMBER_ME_MAX_AGE = 30 * 24 * 60 * 60; // 30 days, in seconds

export const { handlers, auth, signIn, signOut } = NextAuth({
  session: { strategy: "jwt", maxAge: REMEMBER_ME_MAX_AGE },
  pages: { signIn: "/signup" },
  providers: [
    Credentials({
      credentials: {
        email: {},
        password: {},
        remember: {},
      },
      async authorize(credentials) {
        const email = credentials?.email as string | undefined;
        const password = credentials?.password as string | undefined;
        if (!email || !password) return null;

        const user = await prisma.user.findUnique({ where: { email: email.toLowerCase() } });
        if (!user) return null;

        const valid = await bcrypt.compare(password, user.passwordHash);
        if (!valid) return null;

        return {
          id: user.id,
          name: user.name,
          email: user.email,
          remember: credentials?.remember !== "false",
        };
      },
    }),
  ],
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id;
        token.remember = user.remember ?? true;
        token.loginAt = Date.now();
      }
      return token;
    },
    // Note: this only sets fields on the session object — it deliberately
    // does NOT try to invalidate the session here (returning null from this
    // callback doesn't reliably reach middleware's req.auth, and every page
    // does `session!.user.id`, so a session that's "there but broken" 500s
    // instead of redirecting). middleware.ts is the single place that
    // actually enforces the shorter remember=false expiry, using these
    // fields, so it can redirect cleanly like any other logged-out request.
    async session({ session, token }) {
      if (session.user) session.user.id = token.id as string;
      session.remember = token.remember ?? true;
      session.loginAt = token.loginAt;
      return session;
    },
  },
});
