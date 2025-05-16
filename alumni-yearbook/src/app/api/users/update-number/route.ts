import { NextResponse } from "next/server";
import connectToDatabase from "@/lib/mongodb";
import UserPreference from "@/app/models/UserPreference";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";

export async function POST(request: Request) {
  const session = await getServerSession(authOptions);
  if (!session || !session.user?.email) {
    return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
  }

  try {
    const { number } = await request.json();

    if (!number) {
      return NextResponse.json(
        { message: "Phone number is required" },
        { status: 400 }
      );
    }

    if (!/^\d{10}$/.test(number)) {
      return NextResponse.json(
        { message: "Phone number must be exactly 10 digits" },
        { status: 400 }
      );
    }

    await connectToDatabase();

    const userPreference = await UserPreference.findOne({
      email: session.user.email,
    });

    if (userPreference) {

      userPreference.number = number;
      await userPreference.save();
    } else {

      await UserPreference.create({
        email: session.user.email,
        photoUrl: "",
        number,
      });
    }

    return NextResponse.json({
      message: "Phone number updated successfully",
      number,
    });
  } catch (error) {
    console.error("Error updating phone number:", error);
    return NextResponse.json(
      { message: "Error updating phone number", error: (error as Error).message },
      { status: 500 }
    );
  }
}