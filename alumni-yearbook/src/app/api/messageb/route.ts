import { NextResponse } from 'next/server';
import dbConnect from '@/lib/mongodb';
import MessageBatchmate from '../../models/Messageb';
import { getServerSession } from "next-auth/next";
import { authOptions } from "../auth/[...nextauth]/route";

export async function POST(request: Request) {
  try {
    await dbConnect();

    const session = await getServerSession(authOptions);
    
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { email_sender, email_receiver, message } = await request.json();

    const existingMessages = await MessageBatchmate.find({
      $or: [
        { email_sender, email_receiver },
        { email_sender: email_receiver, email_receiver: email_sender }
      ]
    });

    if (existingMessages.length > 0) {
      return NextResponse.json({ error: 'Message already sent' }, { status: 400 });
    }

    const newMessage = await MessageBatchmate.create({
      email_sender,
      email_receiver,
      message,
      timestamp: new Date()
    });

    return NextResponse.json(newMessage);
  } catch (error) {
    console.error('Error sending message:', error);
    return NextResponse.json({ error: 'Failed to send message' }, { status: 500 });
  }
}