import { NextResponse } from 'next/server';
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import dbConnect from '@/lib/mongodb';
import Quote from '../../models/Quote';

export async function POST(request: Request) {
    try {
        await dbConnect();

        const session = await getServerSession(authOptions);
    
        if (!session) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const { email, quote } = await request.json();

        if (!email || !quote) {
            return NextResponse.json({ error: 'Email and quote are required' }, { status: 400 });
        }

        const updatedQuote = await Quote.findOneAndUpdate(
            { email },
            { quote },
            { 
                new: true, 
                upsert: true 
            }
        );

        return NextResponse.json(updatedQuote, { status: 200 });

    } catch (error) {
        console.error('Detailed error processing quote:', error);
        return NextResponse.json({ 
            error: 'Failed to process quote', 
            details: error instanceof Error ? error.message : 'Unknown error' 
        }, { status: 500 });
    }
}