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
    
    const session = await mongoose.startSession();
    session.startTransaction();
    
    try {
      // Check for existing vote
      const existingVote = await Vote.findOne({
        pollId,
        userEmail
      }).session(session);
      
      if (existingVote) {
        // Decrement the old vote
        await Poll.findOneAndUpdate(
          { _id: pollId, "options.id": existingVote.optionId },
          { 
            $inc: { 
              "options.$.votes": -1,
              totalVotes: -1
            } 
          },
          { session }
        );
      }
      
      // Add the new vote
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
      
      // Update or create vote record
      await Vote.findOneAndUpdate(
        { pollId, userEmail },
        {
          optionId,
          updatedAt: new Date()
        },
        { upsert: true, session }
      );
      
      await session.commitTransaction();
      return NextResponse.json({ 
        success: true, 
        poll: updatedPoll,
        changed: !!existingVote 
      });
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
