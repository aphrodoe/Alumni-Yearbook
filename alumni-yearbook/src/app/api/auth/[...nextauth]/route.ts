import NextAuth from "next-auth";
import type { NextAuthOptions } from "next-auth";
import GoogleProvider from "next-auth/providers/google";
import dbConnect from "../../../../lib/mongodb";
import User from "../../../models/User";

// Define authOptions
const options: NextAuthOptions = {
  providers: [
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
    }),
  ],
  secret: process.env.NEXTAUTH_SECRET,
  callbacks: {
    async signIn({ user }) {
      const email = user.email || "";
      const isAllowedEmail = email.startsWith("b24");

      if (isAllowedEmail) {
        await dbConnect();
        try {
          const existingUser = await User.findOne({ email: user.email });
          if (!existingUser) {
            await User.create({
              email: user.email,
              name: user.name,
              hasCompletedPreferences: false,
            });
          }
        } catch (error) {
          console.error("Error saving user to MongoDB:", error);
        }
      }

      return isAllowedEmail;
    },
    async session({ session, token }) {
      if (session.user) {
        (session.user as { id: string }).id = token.sub || '';
      }
      return session;
    },
  },
  pages: {
    error: "/auth/error",
  },
};

// Only export the handler as route methods
const handler = NextAuth(options);
export { handler as GET, handler as POST };

// This keeps your imports working
export const authOptions = options;
