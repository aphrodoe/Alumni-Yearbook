import { NextResponse } from 'next/server';
import connectToDatabase from '@/lib/mongodb';
import Messagej from '../../models/Messagej';
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";

export async function POST(request: Request) {
  const session = await getServerSession(authOptions);
  if (!session) {
    return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
  }

  try {
    const { email, message } = await request.json();
    
    if (!email || !message) {
      return NextResponse.json(
        { message: 'Email and message are required' }, 
        { status: 400 }
      );
    }

    await connectToDatabase();
    
    if (!session.user) {
      return NextResponse.json(
        { message: 'User information is missing in the session' }, 
        { status: 400 }
      );
    }

    const newMessagej = new Messagej({
      email: session.user.email,
      email_receiver: email,
      message: message
    });
    
    await newMessagej.save();
    
    return NextResponse.json({ 
      message: 'Message sent successfully',
      messageData: newMessagej
    });
  } catch (error) {
    console.error('Error sending message:', error);
    return NextResponse.json(
      { message: 'Error sending message', error: (error as Error).message }, 
      { status: 500 }
    );
  }

}