import { NextResponse } from "next/server";

export async function POST(req: Request) {
    try {
        const { message, email } = await req.json();

        if (!message || !email) {
            return NextResponse.json({ message: "Missing required fields" }, { status: 400 });
        }

        return NextResponse.json({ message: "Message received!" }, { status: 200 });
    } catch (error) {
        return NextResponse.json({ message: "Internal Server Error", error }, { status: 500 });
    }
}
