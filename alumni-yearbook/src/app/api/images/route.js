import { NextResponse } from 'next/server';
import connectToDatabase from '@/lib/mongodb';
import Image from '../../models/Image';
import { getServerSession } from "next-auth/next";
import { authOptions } from "../auth/[...nextauth]/route";

export async function GET() {

  const session = await getServerSession(authOptions);
  if (!session) {
    return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
  }

  try {
    await connectToDatabase();
    
    const images = await Image.find({}).sort({ createdAt: -1 });
    
    return NextResponse.json({ images });
  } catch (error) {
    console.error('Error fetching images:', error);
    return NextResponse.json(
      { message: 'Error fetching images', error: error.message }, 
      { status: 500 }
    );
  }
}