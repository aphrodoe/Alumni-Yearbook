import { NextResponse } from 'next/server';
import connectToDatabase from '@/lib/mongodb';
import UserPreference from '@/app/models/UserPreference';
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import dbConnect from '@/lib/mongodb';

export async function GET(request: Request) {
  const session = await getServerSession(authOptions);
  if (!session || !session.user?.email) {
    return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
  }

  try {
    await dbConnect();
    
    const url = new URL(request.url);
    const queryEmail = url.searchParams.get('email');
    const emailToFetch = queryEmail || session.user.email;
    
    const userPreference = await UserPreference.findOne({ 
      email: emailToFetch 
    });

    if (!userPreference) {
      return NextResponse.json({ 
        message: 'No preferences found',
        preferences: null
      });
    }

    return NextResponse.json({ 
      message: 'Preferences retrieved successfully',
      preferences: {
        photoUrl: userPreference.photoUrl,
        quote: userPreference.quote,
        clubs: userPreference.clubs
      }
    });

  } catch (error) {
    console.error('Error fetching preferences:', error);
    return NextResponse.json(
      { message: 'Error fetching preferences', error: (error as Error).message }, 
      { status: 500 }
    );
  }
}
