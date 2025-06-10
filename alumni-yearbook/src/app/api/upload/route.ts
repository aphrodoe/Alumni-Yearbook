import { NextResponse } from 'next/server';
import { S3Client, PutObjectCommand, ObjectCannedACL } from '@aws-sdk/client-s3';
import connectToDatabase from '../../../lib/mongodb';
import Image from '../../models/Image';
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";

const s3Client = new S3Client({
  region: process.env.AWS_REGION || 'ap-south-1',
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID || '',
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY || '',
  },
});

async function uploadToS3(base64Image: string, fileName: string) {

  const base64Data = base64Image.replace(/^data:image\/\w+;base64,/, '');
  const buffer = Buffer.from(base64Data, 'base64');
  
  const params = {
    Bucket: process.env.AWS_S3_BUCKET_NAME || '',
    Key: `images/${Date.now()}-${fileName}`,
    Body: buffer,
    ContentType: 'image/jpeg',
    ACL: 'public-read' as ObjectCannedACL,
  };

  const command = new PutObjectCommand(params);
  await s3Client.send(command);
  

  const imageUrl = `https://${params.Bucket}.s3.${process.env.AWS_REGION}.amazonaws.com/${params.Key}`;
  
  return {
    s3Key: params.Key,
    s3Url: imageUrl
  };
}

export async function POST(request: Request) {
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

    const uploadedImages = await Promise.all(
      images.map(async (image, index) => {
        const fileName = `image-${index}`;
        const uploadResponse = await uploadToS3(image, fileName);

        return new Image({
          email: session.user?.email || '',
          s3Key: uploadResponse.s3Key, 
          s3Url: uploadResponse.s3Url, 
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
      { message: 'Error uploading images, try uploading the image with Title and Caption.', error: (error as Error).message }, 
      { status: 500 }
    );
  }
}