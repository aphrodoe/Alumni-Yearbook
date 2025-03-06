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

    const existingMessage = await MessageBatchmate.findOne({
      email_sender,
      email_receiver
    });

    if (existingMessage) {
      return NextResponse.json({ error: 'You have already sent a message to this user' }, { status: 400 });
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