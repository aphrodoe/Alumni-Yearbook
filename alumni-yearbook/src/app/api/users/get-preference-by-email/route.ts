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
      // Return a 200 with default values instead of 404
      return NextResponse.json({
        preferences: {
          photoUrl: `/placeholder.jpg?height=200&width=200`,
          number: ""
        }
      });
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
      { 
        preferences: {
          photoUrl: `/placeholder.jpg?height=200&width=200`,
          number: ""
        }
      },
      { status: 200 } // Return 200 even on error with default values
    );
  }
}
