import { NextResponse } from 'next/server';
import dbConnect from '@/lib/mongodb';
import User from '../../models/User';
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";

export async function GET(request: Request) {
  try {
    await dbConnect();

    const session = await getServerSession(authOptions);
    
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get query parameters
    const url = new URL(request.url);
    const page = parseInt(url.searchParams.get('page') || '1');
    const limit = parseInt(url.searchParams.get('limit') || '20');
    const search = url.searchParams.get('search') || '';
    
    // Calculate skip value for pagination
    const skip = (page - 1) * limit;
    
    // Build query
    let query = {};
    
    // Add search functionality if search term provided
    if (search) {
      query = {
        $or: [
          { name: { $regex: search, $options: 'i' } },
          { email: { $regex: search, $options: 'i' } }
        ]
      };
    }
    
    // Fetch paginated users
    const users = await User.find(query)
      .select('email name')
      .skip(skip)
      .limit(limit + 1) // Fetch one extra to check if there are more
      .lean();
    
    // Check if there are more users
    const hasMore = users.length > limit;
    
    // Remove the extra user if we fetched one
    const usersToReturn = hasMore ? users.slice(0, limit) : users;
    
    return NextResponse.json({
      users: usersToReturn,
      hasMore,
      currentPage: page
    });
  } catch (error) {
    console.error('Error fetching users:', error);
    return NextResponse.json({ error: 'Failed to fetch users' }, { status: 500 });
  }
}