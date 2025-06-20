import { NextRequest, NextResponse } from 'next/server';
import GeneratedYearbook from '@/app/models/GeneratedYearbook';
import dbConnect from '@/lib/mongodb';

export async function GET(request: NextRequest) {
    try {
        await dbConnect();
        
        const { searchParams } = new URL(request.url);
        const email = searchParams.get('email');
        
        if (!email) {
            return NextResponse.json(
                { message: 'Email parameter is required' },
                { status: 400 }
            );
        }

        const yearbook = await GeneratedYearbook.findOne({ email });
        
        if (!yearbook) {
            return NextResponse.json(
                { message: 'Yearbook not found', status: 'not_found' },
                { status: 404 }
            );
        }

        return NextResponse.json({
            email: yearbook.email,
            status: yearbook.status,
            s3Url: yearbook.s3Url,
            generatedAt: yearbook.generatedAt
        });
    } catch (error) {
        console.error('Error fetching yearbook status:', error);
        return NextResponse.json(
            { 
                message: 'Error fetching yearbook status',
                error: error instanceof Error ? error.message : 'Unknown error'
            },
            { status: 500 }
        );
    }
}
