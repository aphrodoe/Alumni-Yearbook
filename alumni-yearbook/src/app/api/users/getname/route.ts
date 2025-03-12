import { NextResponse } from 'next/server';
import dbConnect from '@/lib/mongodb';
import User from '../../../models/User';
import { getServerSession } from "next-auth/next";
import { authOptions } from "../../auth/[...nextauth]/route";

export async function GET(request: Request) {
    try {
        await dbConnect();

        const session = await getServerSession(authOptions); // Ensure session is awaited

        if (!session) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        // Extract query parameters from URL
        const { searchParams } = new URL(request.url);
        const email = searchParams.get('email'); // Get 'email' from query params

        if (!email) {
            return NextResponse.json({ error: 'Missing email parameter' }, { status: 400 });
        }

        // Fetch user by email
        const user = await User.findOne({ email });

        if (!user) {
            return NextResponse.json({ error: 'User not found' }, { status: 404 });
        }

        return NextResponse.json({ name: user.name });

    } catch (error) {
        console.error('Error finding name: ', error);
        return NextResponse.json({ error: 'Failed to find name' }, { status: 500 });
    }
}
