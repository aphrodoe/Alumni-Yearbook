import { NextResponse } from "next/server";
import dbConnect from "@/lib/mongodb";
import User from "@/app/models/User";
import { getServerSession } from "next-auth/next";
import { authOptions } from "../../auth/[...nextauth]/route";

export async function POST(request: Request) {
  try {
    await dbConnect();
    console.log("Connected to database");

    const session = await getServerSession(authOptions);
    console.log("Session retrieved:", session ? "Success" : "Null");

    if (!session || !session.user?.email) {
      console.log("Authentication failed - no valid session or email");
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }

    const { email } = session.user;
    console.log("Updating preferences for email:", email);

    let formData = {};
    try {
      formData = await request.json();
      console.log("Form data received:", formData);
    } catch (e) {
      console.log("No form data in request or invalid JSON");
    }

    const updatedUser = await User.findOneAndUpdate(
      { email },
      { 
        hasCompletedPreferences: true,
      },
      { new: true } 
    );
    
    console.log("Update result:", updatedUser);
    
    if (!updatedUser) {
      console.log("User not found with email:", email);
      return NextResponse.json({ message: "User not found" }, { status: 404 });
    }
    
    console.log("Updated user preferences status:", {
      email,
      hasCompletedPreferences: updatedUser.hasCompletedPreferences
    });
    
    console.log("Preferences updated successfully for:", email);
    return NextResponse.json({ 
      message: "Preferences updated successfully",
      user: {
        email: updatedUser.email,
        name: updatedUser.name,
        hasCompletedPreferences: updatedUser.hasCompletedPreferences
      }
    });
  } catch (error) {
    console.error("Error updating preferences:", error);
    return NextResponse.json({ 
      error: "Failed to update preferences", 
      details: error instanceof Error ? error.message : String(error)
    }, { status: 500 });
  }
}