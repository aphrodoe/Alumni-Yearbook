import { NextResponse } from "next/server";
import { v2 as cloudinary } from "cloudinary";
import connectToDatabase from "@/lib/mongodb";
import UserPreference from "@/app/models/UserPreference";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

export async function POST(request: Request) {
  const session = await getServerSession(authOptions);
  if (!session || !session.user?.email) {
    return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
  }

  try {
    const { photoUrl } = await request.json();

    if (!photoUrl) {
      return NextResponse.json(
        { message: "Photo URL is required" },
        { status: 400 }
      );
    }

    await connectToDatabase();


    const uploadResponse = await cloudinary.uploader.upload(photoUrl, {
      upload_preset: process.env.CLOUDINARY_UPLOAD_PRESET || "",
    });

    const userPreference = await UserPreference.findOne({
      email: session.user.email,
    });

    if (userPreference) {

      userPreference.photoUrl = uploadResponse.secure_url;
      await userPreference.save();
    } else {

      await UserPreference.create({
        email: session.user.email,
        photoUrl: uploadResponse.secure_url,
        number: "", 
      });
    }

    return NextResponse.json({
      message: "Photo updated successfully",
      photoUrl: uploadResponse.secure_url,
    });
  } catch (error) {
    console.error("Error updating photo:", error);
    return NextResponse.json(
      { message: "Error updating photo", error: (error as Error).message },
      { status: 500 }
    );
  }
}