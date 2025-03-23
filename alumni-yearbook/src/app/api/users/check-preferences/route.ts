import { NextResponse } from 'next/server';
import dbConnect from '@/lib/mongodb';
import User from '@/app/models/User';

export async function GET(request: Request) {
    try {
        await dbConnect();

        const { searchParams } = new URL(request.url);
        const email = searchParams.get('email');

        if (!email) {
            return NextResponse.json({ error: 'Missing email parameter' }, { status: 400 });
        }

        const user = await User.findOne({ email });

        if (!user) {
            console.log(`User not found for email: ${email}`);
            return NextResponse.json({ hasCompletedPreferences: false });
        }

        console.log("User preferences check:", {
            email,
            hasCompletedPreferences: user.hasCompletedPreferences,
            userExists: !!user
        });

        return NextResponse.json({ 
            hasCompletedPreferences: user.hasCompletedPreferences === true
        }, {
            headers: {
                'Cache-Control': 'no-store, no-cache, must-revalidate, proxy-revalidate',
                'Pragma': 'no-cache',
                'Expires': '0'
            }
        });

    } catch (error) {
        console.error('Error checking preferences: ', error);
        return NextResponse.json({ error: 'Failed to check preferences' }, { status: 500 });
    }
}