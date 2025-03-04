import { NextResponse } from 'next/server';
import dbConnect from '@/lib/mongodb';
import Image from '../../../models/Image';
import { getServerSession } from "next-auth/next";
import { authOptions } from "../../auth/[...nextauth]/route";

export async function GET(request: Request) {
    try {
        await dbConnect();

        const session = await getServerSession(authOptions);
        if (!session) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const userEmail = session.user?.email;
        if (!userEmail) {
            return NextResponse.json({ error: 'No email found in session' }, { status: 400 });
        }

        const userImages = await Image.find({ email: userEmail });

        return NextResponse.json(userImages);
    } catch (error) {
        console.error('Error fetching user images:', error);
        return NextResponse.json({ error: 'Failed to fetch user images' }, { status: 500 });
    }
}