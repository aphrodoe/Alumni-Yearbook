import { NextResponse } from 'next/server';
import { v2 as cloudinary } from 'cloudinary';
import connectToDatabase from '@/lib/mongodb';
import UserPreference from '@/app/models/UserPreference';
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET
});

// In your update-preference route
export async function POST(request: Request) {
  const session = await getServerSession(authOptions);
  if (!session || !session.user?.email) {
    return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
  }

  try {
    const { photoUrl, number} = await request.json();
    
    if (!photoUrl || !number) {
      return NextResponse.json(
        { message: 'All fields are required' }, 
        { status: 400 }
      );
    }

    await connectToDatabase();

    // Upload base64 image to Cloudinary
    const uploadResponse = await cloudinary.uploader.upload(photoUrl, {
      upload_preset: process.env.CLOUDINARY_UPLOAD_PRESET || ''
    });

    // Create or update user preference
    const userPreference = await UserPreference.findOneAndUpdate(
      { email: session.user.email },
      {
        photoUrl: uploadResponse.secure_url,
        number,
      },
      { upsert: true, new: true }
    );

    return NextResponse.json({ 
      message: 'Preferences updated successfully',
      userPreference
    });

  } catch (error) {
    console.error('Error updating preferences:', error);
    return NextResponse.json(
      { message: 'Error updating preferences', error: (error as Error).message }, 
      { status: 500 }
    );
  }
}
