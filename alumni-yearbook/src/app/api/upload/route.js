import { NextResponse } from 'next/server';
import { v2 as cloudinary } from 'cloudinary';
import connectToDatabase from '@/lib/mongodb';
import Image from '../../models/Image';
import { getServerSession } from "next-auth/next";
import { authOptions } from "../auth/[...nextauth]/route";

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET
});

export async function POST(request) {
  const session = await getServerSession(authOptions);
  if (!session) {
    return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
  }

  try {
    const { images, caption, description } = await request.json();
    
    if (!images || !Array.isArray(images) || images.length === 0) {
      return NextResponse.json(
        { message: 'At least one image is required' }, 
        { status: 400 }
      );
    }

    await connectToDatabase();

    // Upload all images to Cloudinary
    const uploadedImages = await Promise.all(
      images.map(async (image) => {
        const uploadResponse = await cloudinary.uploader.upload(image, {
          upload_preset: process.env.CLOUDINARY_UPLOAD_PRESET || ''
        });

        return new Image({
          email: session.user.email,
          cloudinaryId: uploadResponse.public_id,
          cloudinaryUrl: uploadResponse.secure_url,
          caption: caption,
          headtitle: description,
        }).save();
      })
    );

    return NextResponse.json({ 
      message: 'Upload successful',
      images: uploadedImages
    });

  } catch (error) {
    console.error('Error uploading images:', error);
    return NextResponse.json(
      { message: 'Error uploading images', error: error.message }, 
      { status: 500 }
    );
  }
}
