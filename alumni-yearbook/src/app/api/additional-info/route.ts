import { NextResponse } from 'next/server';
import connectToDatabase from '@/lib/mongodb';
import UserAddInfo from '@/app/models/UserAddInfo';
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";

export async function POST(request: Request) {

    const session = await getServerSession(authOptions);
    if (!session || !session.user?.email) {
        return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
    }

    try {
        const { jeevanKaFunda, iitjIs, crazyMoment, lifeTitle } = await request.json();
        if (!jeevanKaFunda || !iitjIs || !crazyMoment || !lifeTitle) {
            return NextResponse.json(
                { message: 'All fields are required' },
                { status: 400 }
            );
        }
        await connectToDatabase();
        // Create or update user additional info
        const userAddInfo = await UserAddInfo.findOneAndUpdate(
            { email: session.user.email },
            {
                jeevanKaFunda,
                iitjIs,
                crazyMoment,
                lifeTitle,
            },
            { upsert: true, new: true }
        );
    } catch (error) {
        console.error('Error updating additional info:', error);
        return NextResponse.json(
            { message: 'Error updating additional info', error: (error as Error).message },
            { status: 500 }
        );
    }

}