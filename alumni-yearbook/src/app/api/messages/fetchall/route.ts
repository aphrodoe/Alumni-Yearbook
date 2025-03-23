import { NextResponse } from 'next/server';
import dbConnect from '@/lib/mongodb';
import MessageBatchmate from '../../../models/Messageb';
import { getServerSession } from "next-auth/next";
import { authOptions } from "../../auth/[...nextauth]/route";

export async function GET(request: Request) {
    try {
        await dbConnect();

        const session = await getServerSession(authOptions); // Await the session

        if (!session) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        // Get the URL and parse the query params
        const url = new URL(request.url);
        const receiver = url.searchParams.get('receiver');

        if (!receiver) {
            return NextResponse.json({ error: 'Receiver email is required' }, { status: 400 });
        }

        if (!receiver) {
            return NextResponse.json({ error: 'Missing receiver parameter' }, { status: 400 });
        }

        // Fetch messages
        const allMessages = await MessageBatchmate.find({ email_receiver: receiver }).sort({ timestamp: 1 });

        return NextResponse.json({ messages: allMessages });

    } catch (error) {
        console.error('Error checking messages:', error);
        return NextResponse.json({ error: 'Failed to check messages' }, { status: 500 });
    }
}
