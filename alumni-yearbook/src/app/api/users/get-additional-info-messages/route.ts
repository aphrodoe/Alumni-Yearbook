import { NextResponse } from "next/server";
import { S3Client, GetObjectCommand } from '@aws-sdk/client-s3';
import connectToDatabase from "@/lib/mongodb";
import UserAddInfo from "@/app/models/UserAddInfo";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";

export async function GET(request: Request) {
  const session = await getServerSession(authOptions);
  if (!session) {
    return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
  }

  const url = new URL(request.url);
  const email = url.searchParams.get("email");

  if (!email) {
    return NextResponse.json(
      { message: "Email parameter is required" },
      { status: 400 }
    );
  }

  try {
    await connectToDatabase();

    const additionalInfo = await UserAddInfo.findOne({ email });

    return NextResponse.json({
      success: true,
      additionalInfo: additionalInfo || {
        jeevanKaFunda: "",
        iitjIs: "",
        crazyMoment: "",
        lifeTitle: ""
      }
    });
  } catch (error) {
    console.error("Error fetching additional info:", error);
    return NextResponse.json(
      { message: "Error fetching additional info", error: (error as Error).message },
      { status: 500 }
    );
  }
}
