import { NextResponse } from "next/server";
import connectToDatabase from "@/lib/mongodb";
import UserAddInfo from "@/app/models/UserAddInfo";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";

export async function POST(request: Request) {
  const session = await getServerSession(authOptions);
  if (!session || !session.user?.email) {
    return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
  }

  try {
    const { jeevanKaFunda, iitjIs, crazyMoment, lifeTitle } = await request.json();
    
    const validateWordCount = (value: string, fieldName: string) => {
      if (!value) return true;
      const wordCount = value.trim().split(/\s+/).length;
      if (wordCount > 10) {
        return false;
      }
      return true;
    };

    if (!validateWordCount(jeevanKaFunda, "Jeevan Ka Funda")) {
      return NextResponse.json(
        { message: "Jeevan Ka Funda must be 10 words or less" },
        { status: 400 }
      );
    }

    if (!validateWordCount(iitjIs, "IITJ Is")) {
      return NextResponse.json(
        { message: "IITJ Is must be 10 words or less" },
        { status: 400 }
      );
    }

    if (!validateWordCount(crazyMoment, "Crazy Moment")) {
      return NextResponse.json(
        { message: "Crazy Moment must be 10 words or less" },
        { status: 400 }
      );
    }

    if (!validateWordCount(lifeTitle, "Life Title")) {
      return NextResponse.json(
        { message: "Life Title must be 10 words or less" },
        { status: 400 }
      );
    }

    await connectToDatabase();

    const userAddInfo = await UserAddInfo.findOne({
      email: session.user.email,
    });

    if (userAddInfo) {

      userAddInfo.jeevanKaFunda = jeevanKaFunda || "";
      userAddInfo.iitjIs = iitjIs || "";
      userAddInfo.crazyMoment = crazyMoment || "";
      userAddInfo.lifeTitle = lifeTitle || "";
      await userAddInfo.save();
    } else {

      await UserAddInfo.create({
        email: session.user.email,
        jeevanKaFunda: jeevanKaFunda || "",
        iitjIs: iitjIs || "",
        crazyMoment: crazyMoment || "",
        lifeTitle: lifeTitle || "",
      });
    }

    return NextResponse.json({
      message: "Additional information updated successfully",
      userAddInfo: {
        jeevanKaFunda,
        iitjIs,
        crazyMoment,
        lifeTitle,
      },
    });
  } catch (error) {
    console.error("Error updating additional info:", error);
    return NextResponse.json(
      { message: "Error updating additional info", error: (error as Error).message },
      { status: 500 }
    );
  }
}