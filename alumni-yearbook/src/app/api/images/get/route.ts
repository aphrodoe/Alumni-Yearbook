import { NextResponse } from 'next/server';
import dbConnect from '@/lib/mongodb';
import Image from '../../../models/Image';
import { getServerSession } from "next-auth/next";
import { authOptions } from "../../auth/[...nextauth]/route";

export async function GET(request: Request) {

  const session = await getServerSession(authOptions);
  if (!session) {
    return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
  }

  try {
    await dbConnect();
    
    const images = await Image.find({email:session.user?.email});
    
    return NextResponse.json({ images });
  } catch (error) {
    console.error('Error fetching images:', error);
    return NextResponse.json(
      { message: 'Error fetching images' }, 
      { status: 500 }
    );
  }
}