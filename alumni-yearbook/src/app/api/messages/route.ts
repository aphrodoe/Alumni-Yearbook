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

    const { sender, receiver } = await request.json();

    const messages = await MessageBatchmate.find({
      $or: [
        { email_sender: sender, email_receiver: receiver },
        { email_sender: receiver, email_receiver: sender }
      ]
    }).sort({ timestamp: 1 });

    return NextResponse.json(messages);
  } catch (error) {
    console.error('Error fetching messages:', error);
    return NextResponse.json({ error: 'Failed to fetch messages' }, { status: 500 });
  }
}