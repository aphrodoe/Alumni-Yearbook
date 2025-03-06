import { NextResponse } from 'next/server';
import dbConnect from '@/lib/mongodb';
import Section from '../../../models/Section';
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

        const userSections = await Section.find({ email: userEmail });

        return NextResponse.json(userSections);
    } catch (error) {
        console.error('Error fetching user Sections:', error);
        return NextResponse.json({ error: 'Failed to fetch user Sections' }, { status: 500 });
    }
}