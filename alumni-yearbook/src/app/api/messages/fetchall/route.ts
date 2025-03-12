import { NextResponse } from 'next/server';
import dbConnect from '@/lib/mongodb';
import MessageBatchmate from '../../../models/Messageb';
import { getServerSession } from "next-auth/next";
import { authOptions } from "../../auth/[...nextauth]/route";

export async function GET(request: Request) {
    try {
        await dbConnect();

        const session=getServerSession(authOptions);

        if (!session) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const { receiver } = await request.json();

        const allMessages = await MessageBatchmate.find({
            email_receiver: receiver
        }).sort({ timestamp: 1 });

        return NextResponse.json({ 
            messages: allMessages
        });

    } catch (error) {
        console.error('Error checking messages:', error);
        return NextResponse.json({ error: 'Failed to check messages' }, { status: 500 });
    }
}