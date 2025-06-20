import { NextRequest, NextResponse } from 'next/server';
import { YearbookGenerator } from '@/services/yearbookGenerator';
import User from '@/app/models/User';
import GeneratedYearbook from '@/app/models/GeneratedYearbook';
import dbConnect from '@/lib/mongodb';

export async function POST(request: NextRequest) {
    try {
        await dbConnect();
        
        // Get all users with completed preferences
        const users = await User.find({ hasCompletedPreferences: true });
        
        const results = {
            total: users.length,
            successful: 0,
            failed: 0,
            errors: [] as string[]
        };

        for (const user of users) {
            try {
                // Check if yearbook already exists
                const existingYearbook = await GeneratedYearbook.findOne({ email: user.email });
                if (existingYearbook && existingYearbook.status === 'completed') {
                    console.log(`Yearbook already exists for ${user.email}`);
                    results.successful++;
                    continue;
                }

                const generator = new YearbookGenerator();
                await generator.generatePersonalizedYearbook(user.email);
                results.successful++;
                
                console.log(`Generated yearbook for ${user.email}`);
            } catch (error) {
                results.failed++;
                const errorMessage = `Failed for ${user.email}: ${error instanceof Error ? error.message : 'Unknown error'}`;
                results.errors.push(errorMessage);
                console.error(errorMessage);
                
                // Mark as failed in database
                await GeneratedYearbook.findOneAndUpdate(
                    { email: user.email },
                    { status: 'failed' },
                    { upsert: true }
                );
            }
        }

        return NextResponse.json({
            message: 'Batch generation completed',
            results
        });
    } catch (error) {
        console.error('Error in batch generation:', error);
        return NextResponse.json(
            { 
                message: 'Error in batch generation',
                error: error instanceof Error ? error.message : 'Unknown error'
            },
            { status: 500 }
        );
    }
}
