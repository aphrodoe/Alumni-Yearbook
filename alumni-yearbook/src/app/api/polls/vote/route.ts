import { NextResponse } from 'next/server';
import connectToDatabase from '@/lib/mongodb';
import Poll from '@/app/models/polls';
import Vote from '@/app/models/vote';
import mongoose from 'mongoose';

export async function POST(request: Request) {
  try {
    await connectToDatabase();
    const { pollId, optionId, userEmail } = await request.json();
    
    if (!mongoose.Types.ObjectId.isValid(pollId)) {
      return NextResponse.json(
        { error: 'Invalid poll ID' },
        { status: 400 }
      );
    }
    
    const existingVote = await Vote.findOne({
      pollId,
      userEmail
    });
    
    if (existingVote) {
      return NextResponse.json(
        { error: 'You have already voted on this poll' },
        { status: 400 }
      );
    }
    
    const session = await mongoose.startSession();
    session.startTransaction();
    
    try {
      const updatedPoll = await Poll.findOneAndUpdate(
        { _id: pollId, "options.id": optionId },
        { 
          $inc: { 
            "options.$.votes": 1,
            totalVotes: 1
          } 
        },
        { new: true, session }
      );
      
      if (!updatedPoll) {
        throw new Error('Poll or option not found');
      }
      
      await Vote.create([{
        pollId,
        optionId,
        userEmail,
        createdAt: new Date()
      }], { session });
      
      await session.commitTransaction();
      
      return NextResponse.json({ success: true, poll: updatedPoll });
    } catch (error) {
      await session.abortTransaction();
      throw error;
    } finally {
      session.endSession();
    }
  } catch (error) {
    console.error('Database error:', error);
    return NextResponse.json(
      { error: 'Failed to record vote' },
      { status: 500 }
    );
  }
}
