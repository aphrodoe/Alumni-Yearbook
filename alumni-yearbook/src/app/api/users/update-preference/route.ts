import { NextResponse } from "next/server";
import dbConnect from "@/lib/mongodb";
import User from "../../../../models/User";
import { getServerSession } from "next-auth/next";
import { authOptions } from "../../auth/[...nextauth]/route";

export async function POST(request: Request) {
  try {
    await dbConnect();

    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }

    const { email } = session.user;

    await User.findOneAndUpdate(
      { email },
      { hasCompletedPreferences: true } // ✅ Update this field in the database
    );

    return NextResponse.json({ message: "Preferences updated successfully" });
  } catch (error) {
    console.error("Error updating preferences:", error);
    return NextResponse.json({ error: "Failed to update preferences" }, { status: 500 });
  }
}
