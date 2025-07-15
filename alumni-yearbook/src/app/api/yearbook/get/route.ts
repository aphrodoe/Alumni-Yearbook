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

    const yearbook = await GeneratedYearbook.findOne({ 
      email, 
      status: 'completed' 
    });
    
    if (yearbook && yearbook.s3Url) {
      return NextResponse.json({
        pdfUrl: yearbook.s3Url,
        hasPersonalizedYearbook: true,
        generatedAt: yearbook.generatedAt
      });
    } else {
      return NextResponse.json({
        pdfUrl: '/manual-yearbook.pdf',
        hasPersonalizedYearbook: false
      });
    }
  } catch (error) {
    console.error('Error fetching yearbook:', error);
    return NextResponse.json(
      { 
        message: 'Error fetching yearbook',
        pdfUrl: '/manual-yearbook.pdf',
        hasPersonalizedYearbook: false
      },
      { status: 500 }
    );
  }
}
