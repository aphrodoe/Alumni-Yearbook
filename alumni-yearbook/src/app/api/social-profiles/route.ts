import { NextRequest, NextResponse } from "next/server";
import connectDB from "@/lib/mongodb";
import SocialProfile from "@/app/models/SocialProfile";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";

export async function POST(req: NextRequest) {
  try {
    await connectDB();
    const session = await getServerSession(authOptions);

    if (!session || !session.user?.email) {
      return NextResponse.json(
        { error: "Authentication required" },
        { status: 401 }
      );
    }

    const { linkedinProfile } = await req.json();
    const email = session.user.email;

    const socialProfile = await SocialProfile.findOneAndUpdate(
      { email },
      { email, linkedinProfile },
      { upsert: true, new: true }
    );

    return NextResponse.json(
      { message: "Social profile saved successfully", socialProfile },
      { status: 200 }
    );
  } catch (error) {
    console.error("Error saving social profile:", error);
    return NextResponse.json(
      { error: "Failed to save social profile" },
      { status: 500 }
    );
  }
}

export async function GET(req: NextRequest) {
  try {
    await connectDB();
    const session = await getServerSession(authOptions);

    if (!session || !session.user?.email) {
      return NextResponse.json(
        { error: "Authentication required" },
        { status: 401 }
      );
    }

    const email = session.user.email;
    const socialProfile = await SocialProfile.findOne({ email });

    if (!socialProfile) {
      return NextResponse.json(
        { message: "Social profile not found" },
        { status: 404 }
      );
    }

    return NextResponse.json({ socialProfile }, { status: 200 });
  } catch (error) {
    console.error("Error retrieving social profile:", error);
    return NextResponse.json(
      { error: "Failed to retrieve social profile" },
      { status: 500 }
    );
  }
}