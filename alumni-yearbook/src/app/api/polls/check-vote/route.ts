import { NextResponse } from 'next/server';
import connectToDatabase from '@/lib/mongodb';
import Vote from '@/app/models/vote';
import mongoose from 'mongoose';

export async function GET(request: Request) {
  const url = new URL(request.url);
  const pollId = url.searchParams.get('pollId');
  const userEmail = url.searchParams.get('userEmail');
  
  if (!pollId || !userEmail) {
    return NextResponse.json(
      { error: 'Missing required parameters' },
      { status: 400 }
    );
  }
  
  if (!mongoose.Types.ObjectId.isValid(pollId)) {
    return NextResponse.json(
      { error: 'Invalid poll ID' },
      { status: 400 }
    );
  }
  
  try {
    await connectToDatabase();
    
    interface VoteType {
      optionId: string;
      updatedAt: Date;
    }

    const vote = await Vote.findOne({
      pollId,
      userEmail
    }).lean() as VoteType | null;
    
    return NextResponse.json({
      hasVoted: !!vote,
      optionId: vote ? vote.optionId : null,
      lastVoted: vote ? vote.updatedAt : null
    });
  } catch (error) {
    console.error('Database error:', error);
    return NextResponse.json(
      { error: 'Failed to check vote status' },
      { status: 500 }
    );
  }
}
