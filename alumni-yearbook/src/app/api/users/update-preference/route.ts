import { NextResponse } from 'next/server';
import { S3Client, PutObjectCommand, ObjectCannedACL } from '@aws-sdk/client-s3';
import connectToDatabase from '@/lib/mongodb';
import UserPreference from '@/app/models/UserPreference';
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
    Key: `user-preferences/${Date.now()}-${fileName}`,
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
  if (!session || !session.user?.email) {
    return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
  }

  try {
    const { photoUrl, number } = await request.json();
    
    if (!photoUrl || !number) {
      return NextResponse.json(
        { message: 'All fields are required' }, 
        { status: 400 }
      );
    }

    await connectToDatabase();

    const fileName = `profile-${session.user.email}`;
    const uploadResponse = await uploadToS3(photoUrl, fileName);

    const userPreference = await UserPreference.findOneAndUpdate(
      { email: session.user.email },
      {
        photoUrl: uploadResponse.s3Url,
        s3Key: uploadResponse.s3Key, 
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
