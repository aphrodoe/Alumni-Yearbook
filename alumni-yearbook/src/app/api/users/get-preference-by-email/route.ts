import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import connectToDatabase from "@/lib/mongodb";
import UserPreference from "@/app/models/UserPreference";

export async function GET(request: Request) {

  const { searchParams } = new URL(request.url);
  const email = searchParams.get('email');

  const session = await getServerSession(authOptions);
  if (!session || !session.user?.email) {
    return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
  }

  if (!email) {
    return NextResponse.json({ message: "Email parameter is required" }, { status: 400 });
  }

  try {
    await connectToDatabase();

    const userPreference = await UserPreference.findOne({
      email: email,
    });

    if (!userPreference) {
      return NextResponse.json({ message: "User preferences not found" }, { status: 404 });
    }

    return NextResponse.json({
      preferences: {
        photoUrl: userPreference.photoUrl,
        number: userPreference.number,
      }
    });
  } catch (error) {
    console.error("Error fetching user preferences:", error);
    return NextResponse.json(
      { message: "Error fetching user preferences", error: (error as Error).message },
      { status: 500 }
    );
  }
}
