import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import connectToDatabase from "@/lib/mongodb";
import UserAddInfo from "@/app/models/UserAddInfo";

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session || !session.user?.email) {
    return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
  }

  try {
    await connectToDatabase();

    const userAddInfo = await UserAddInfo.findOne({
      email: session.user.email,
    });

    if (!userAddInfo) {
      return NextResponse.json({ message: "User additional info not found" }, { status: 404 });
    }

    return NextResponse.json({
      jeevanKaFunda: userAddInfo.jeevanKaFunda,
      iitjIs: userAddInfo.iitjIs,
      crazyMoment: userAddInfo.crazyMoment,
      lifeTitle: userAddInfo.lifeTitle,
    });
  } catch (error) {
    console.error("Error fetching user additional info:", error);
    return NextResponse.json(
      { message: "Error fetching user additional info", error: (error as Error).message },
      { status: 500 }
    );
  }
}