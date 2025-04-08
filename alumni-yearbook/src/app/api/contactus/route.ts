import { NextResponse } from 'next/server';
import connectToDatabase from '@/lib/mongodb';
import ContactMessage from '@/app/models/contact_us';
import { getServerSession } from "next-auth/next";
import { authOptions } from "../auth/[...nextauth]/route";
import emailjs from 'emailjs-com';

export async function POST(request: { json: () => Promise<{ message: string }> }) {
  const session = await getServerSession(authOptions);
  if (!session) {
    return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
  }

  try {
    const { message } = await request.json();
    
    if (!message) {
      return NextResponse.json(
        { message: 'Message is required' }, 
        { status: 400 }
      );
    }

    await connectToDatabase();
    
    if (!session.user) {
      return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
    }

    const newContactMessage = new ContactMessage({
      email: session.user.email,
      message: message
    });
    
    await newContactMessage.save();

    try {
      await emailjs.send(
        process.env.NEXT_PUBLIC_EMAILJS_SERVICE_ID!,
        process.env.NEXT_PUBLIC_EMAILJS_TEMPLATE_ID!,
        {
          from_name: session.user.name || "A User",
          message: message,
          to_email: "anshmcs@gmail.com" 
        },
        process.env.NEXT_PUBLIC_EMAILJS_PUBLIC_KEY!
      );
    } catch (emailError) {
      console.error("EmailJS error:", emailError);
      return NextResponse.json(
        { message: 'Message saved but email not sent', error: (emailError as Error).message }, 
        { status: 500 }
      );
    }

    return NextResponse.json({ 
      message: 'Message sent successfully',
      contactMessage: newContactMessage
    });
  } catch (error) {
    console.error('Error sending message:', error);
    return NextResponse.json(
      { message: 'Error sending message', error: (error as Error).message }, 
      { status: 500 }
    );
  }
}