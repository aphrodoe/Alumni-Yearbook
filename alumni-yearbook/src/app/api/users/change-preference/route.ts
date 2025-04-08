import { NextResponse } from 'next/server';
import connectToDatabase from '@/lib/mongodb';
import User from '@/app/models/User';
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";

export async function POST() {
const session = await getServerSession(authOptions);
  if (!session || !session.user?.email) {
    return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
  }

  try {
    await connectToDatabase();


    const Email = session.user.email;

    const updatePref = await User.findOneAndUpdate(
        { email: Email },
        { $set: { hasCompletedPreferences: true } },
    );

    return NextResponse.json({ 
          message: 'Preferences updated successfully',
          updatePref
        });



  } catch (error) {
    console.error('Error connecting to database:', error);
    return NextResponse.json({ message: 'Database connection error' }, { status: 500 });
  }

}