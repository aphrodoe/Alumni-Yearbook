import { NextRequest, NextResponse } from 'next/server';
import GeneratedYearbook from '@/app/models/GeneratedYearbook';
import dbConnect from '@/lib/mongodb';

export async function GET(request: NextRequest) {
    try {
        await dbConnect();
        
        const { searchParams } = new URL(request.url);
        const status = searchParams.get('status');
        const page = parseInt(searchParams.get('page') || '1');
        const limit = parseInt(searchParams.get('limit') || '10');
        
        const query = status ? { status } : {};
        const skip = (page - 1) * limit;
        
        const yearbooks = await GeneratedYearbook.find(query)
            .sort({ generatedAt: -1 })
            .skip(skip)
            .limit(limit);
            
        const total = await GeneratedYearbook.countDocuments(query);
        
        return NextResponse.json({
            yearbooks,
            pagination: {
                page,
                limit,
                total,
                pages: Math.ceil(total / limit)
            }
        });
    } catch (error) {
        console.error('Error fetching yearbooks list:', error);
        return NextResponse.json(
            { 
                message: 'Error fetching yearbooks list',
                error: error instanceof Error ? error.message : 'Unknown error'
            },
            { status: 500 }
        );
    }
}
