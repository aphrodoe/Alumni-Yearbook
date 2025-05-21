import type { NextAuthOptions } from "next-auth";
import GoogleProvider from "next-auth/providers/google";
import dbConnect from "../lib/mongodb";
import User from "../app/models/User";

export const authOptions: NextAuthOptions = {
  providers: [
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID as string,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET as string,
    }),
  ],
  secret: process.env.NEXTAUTH_SECRET,
  callbacks: {
    async signIn({ user }) {
      // List of emails that are always allowed access (exceptions)
      const allowedExceptions = [
        "b24cs1027@iitj.ac.in",
        "b23es1020@iitj.ac.in",
        "b24cs1005@iitj.ac.in",
        "b24mt1038@iitj.ac.in",
      ];

      // If the email is in our exception list, allow them in regardless
      if (user.email && allowedExceptions.includes(user.email.toLowerCase())) {
        // Continue with sign in process for these exception emails
        await handleUserCreation(user);
        return true;
      }

      // Block emails starting with these prefixes
      const blockedPrefixes = ["b22", "b23", "b24", "b25", "m24", "m25"];

      // Check if user email starts with any of the blocked prefixes
      if (
        user.email &&
        blockedPrefixes.some((prefix) =>
          user.email?.toLowerCase().startsWith(prefix)
        )
      ) {
        // Return false to block sign-in
        return false;
      }

      // For all other users, continue with sign in
      await handleUserCreation(user);
      return true;
    },
    async session({ session, token }) {
      if (session.user) {
        (session.user as { id: string }).id = token.sub || "";
      }
      return session;
    },
  },
  pages: {
    error: "/auth/error",
  },
};

// Helper function to handle user creation/verification
async function handleUserCreation(user: any) {
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
