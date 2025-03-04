import { NextResponse } from 'next/server';
import connectToDatabase from '@/lib/mongodb';
import Messageb from '../../models/Messageb';
import { getServerSession } from "next-auth/next";
import { authOptions } from "../auth/[...nextauth]/route";

export async function POST(request) {
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
    
    const newMessageb = new Messageb({
      email: session.user.email,
      email_receiver: email,
      message: message
    });
    
    await newMessageb.save();
    
    return NextResponse.json({ 
      message: 'Message sent successfully',
      message: newMessageb
    });
  } catch (error) {
    console.error('Error sending message:', error);
    return NextResponse.json(
      { message: 'Error sending message', error: error.message }, 
      { status: 500 }
    );
  }


}