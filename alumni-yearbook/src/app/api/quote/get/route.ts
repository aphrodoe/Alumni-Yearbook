import { NextResponse } from 'next/server';
import dbConnect from '@/lib/mongodb';
import Quote from '../../../models/Quote';
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";

export async function GET(req: Request) {
    const session = await getServerSession({ req, ...authOptions });

    if (!session) {
        return NextResponse.json({ message: 'Unauthorized' }, { status: 403 });
    }

    try {
        await dbConnect();

        const url = new URL(req.url);
        const email = url.searchParams.get("email");

        if (!email) {
            return NextResponse.json({ message: 'Email is required' }, { status: 400 });
        }

        const quote = await Quote.findOne({ email });

        return NextResponse.json({ quote: quote?.quote || null });

    } catch (error) {
        console.error('Error fetching quote:', error);
        return NextResponse.json({ message: 'Error fetching quote' }, { status: 500 });
    }
}
