import { NextRequest, NextResponse } from 'next/server';
import { YearbookGenerator } from '@/services/yearbookGenerator';
import dbConnect from '@/lib/mongodb';

export async function POST(request: NextRequest) {
    try {
        await dbConnect();
        
        const { email } = await request.json();
        
        if (!email) {
            return NextResponse.json(
                { message: 'Email is required' },
                { status: 400 }
            );
        }

        const generator = new YearbookGenerator();
        const s3Url = await generator.generatePersonalizedYearbook(email);

        return NextResponse.json({ 
            message: 'Yearbook generated successfully',
            s3Url 
        });
    } catch (error) {
        console.error('Error generating yearbook:', error);
        return NextResponse.json(
            { 
                message: 'Error generating yearbook',
                error: error instanceof Error ? error.message : 'Unknown error'
            },
            { status: 500 }
        );
    }
}
