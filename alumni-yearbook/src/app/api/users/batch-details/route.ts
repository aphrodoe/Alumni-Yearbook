import { NextResponse } from "next/server";
import dbConnect from "@/lib/mongodb";
import UserPreference from "@/app/models/UserPreference";
import UserAddInfo from "@/app/models/UserAddInfo";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";

export async function POST(request: Request) {
  const session = await getServerSession(authOptions);
  if (!session) {
    return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
  }

  const { emails } = await request.json();
  if (!Array.isArray(emails)) {
    return NextResponse.json({ message: "Invalid emails" }, { status: 400 });
  }

  try {
    await dbConnect();

    const preferences = await UserPreference.find({ email: { $in: emails } }).lean();
    const addInfos = await UserAddInfo.find({ email: { $in: emails } }).lean();

    const prefMap = new Map(preferences.map(p => [p.email, p]));
    const addInfoMap = new Map(addInfos.map(a => [a.email, a]));

    const results = emails.map(email => ({
      email,
      profilePicture: prefMap.get(email)?.photoUrl || "/placeholder.jpg?height=200&width=200",
      additionalInfo: addInfoMap.get(email) || {
        jeevanKaFunda: "",
        iitjIs: "",
        crazyMoment: "",
        lifeTitle: ""
      }
    }));

    return NextResponse.json({ users: results });
  } catch (error) {
    console.error("Batch details error:", error);
    return NextResponse.json({
      users: emails.map(email => ({
        email,
        profilePicture: "/placeholder.jpg?height=200&width=200",
        additionalInfo: {
          jeevanKaFunda: "",
          iitjIs: "",
          crazyMoment: "",
          lifeTitle: ""
        }
      }))
    });
  }
}
