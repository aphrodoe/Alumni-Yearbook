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
    const { image, caption } = await request.json();
    
    if (!image || !caption) {
      return NextResponse.json(
        { message: 'Image and caption are required' }, 
        { status: 400 }
      );
    }

    const uploadResponse = await cloudinary.uploader.upload(image, {
      upload_preset: ''
    });
    
    await connectToDatabase();
    
    const newImage = new Image({
      email: session.user.email,
      cloudinaryId: uploadResponse.public_id,
      cloudinaryUrl: uploadResponse.secure_url,
      caption: caption
    });
    
    await newImage.save();
    
    return NextResponse.json({ 
      message: 'Upload successful',
      image: newImage
    });
  } catch (error) {
    console.error('Error uploading image:', error);
    return NextResponse.json(
      { message: 'Error uploading image', error: error.message }, 
      { status: 500 }
    );
  }
}
