import { NextResponse } from "next/server";
import connectToDatabase from "@/lib/mongodb";
import SocialProfile from "@/app/models/SocialProfile";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session || !session.user?.email) {
    return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
  }

  try {
    await connectToDatabase();

    // Find the user's social profile
    const socialProfile = await SocialProfile.findOne({
      email: session.user.email,
    });

    if (socialProfile) {
      return NextResponse.json({
        linkedinProfile: socialProfile.linkedinProfile || "",
      });
    } else {
      // User has no social profile yet
      return NextResponse.json({
        linkedinProfile: "",
      });
    }
  } catch (error) {
    console.error("Error fetching social profile:", error);
    return NextResponse.json(
      { message: "Error fetching social profile", error: (error as Error).message },
      { status: 500 }
    );
  }
}