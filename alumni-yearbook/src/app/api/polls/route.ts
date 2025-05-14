import { NextResponse } from 'next/server';
import connectToDatabase from '@/lib/mongodb';
import Poll from '@/app/models/polls';

export async function GET() {
  try {
    await connectToDatabase();
    
    const polls = await Poll.find({})
      .sort({ createdAt: -1 })
      .lean();
    
    return NextResponse.json(polls);
  } catch (error) {
    console.error('Database error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch polls' },
      { status: 500 }
    );
  }
}
