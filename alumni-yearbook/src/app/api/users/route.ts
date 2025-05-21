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

    const url = new URL(request.url);
    const page = parseInt(url.searchParams.get('page') || '1');
    const limit = parseInt(url.searchParams.get('limit') || '20');
    const search = url.searchParams.get('search') || '';
    
    const skip = (page - 1) * limit;
    
    let query = {};
    
    if (search) {
      query = {
        $or: [
          { name: { $regex: search, $options: 'i' } },
          { email: { $regex: search, $options: 'i' } }
        ]
      };
    }
    
    // First get the total count for better pagination
    const totalCount = await User.countDocuments(query);
    
    const users = await User.find(query)
      .select('email name')
      .skip(skip)
      .limit(limit + 1)
      .lean();
    
    const hasMore = users.length > limit;
    
    const usersToReturn = hasMore ? users.slice(0, limit) : users;
    
    return NextResponse.json({
      users: usersToReturn,
      hasMore,
      currentPage: page,
      totalCount
    });
  } catch (error) {
    console.error('Error fetching users:', error);
    return NextResponse.json({ 
      error: 'Failed to fetch users',
      users: [],
      hasMore: false,
      currentPage: 1
    }, { status: 200 }); // Return 200 with empty data on error
  }
}
