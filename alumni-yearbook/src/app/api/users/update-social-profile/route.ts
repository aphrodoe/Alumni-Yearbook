import { NextResponse } from "next/server";
import connectToDatabase from "@/lib/mongodb";
import SocialProfile from "@/app/models/SocialProfile"; 
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";

export async function POST(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session || !session.user?.email) {
    return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
  }

  try {
    const { linkedinProfile } = await req.json();
    
    if (!linkedinProfile) {
      return NextResponse.json(
        { message: "LinkedIn profile URL is required" },
        { status: 400 }
      );
    }

    // Basic validation for LinkedIn URL
    if (!linkedinProfile.includes('linkedin.com')) {
      return NextResponse.json(
        { message: "Please provide a valid LinkedIn profile URL" },
        { status: 400 }
      );
    }

    await connectToDatabase();

    // Use SocialProfile model instead of UserPreference
    const socialProfile = await SocialProfile.findOne({
      email: session.user.email,
    });

    if (socialProfile) {
      // Document exists, update it
      socialProfile.linkedinProfile = linkedinProfile;
      await socialProfile.save();
    } else {
      // Document doesn't exist, create new one
      await SocialProfile.create({
        email: session.user.email,
        linkedinProfile,
      });
    }

    return NextResponse.json({
      message: "LinkedIn profile updated successfully",
      linkedinProfile,
    });
  } catch (error) {
    console.error("Error updating LinkedIn profile:", error);
    return NextResponse.json(
      { message: "Error updating LinkedIn profile", error: (error as Error).message },
      { status: 500 }
    );
  }
}