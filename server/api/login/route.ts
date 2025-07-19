import { NextRequest, NextResponse } from "next/server";
import { getAuth } from "firebase-admin/auth";
import "@/lib/gcp/admin"; // this initializes firebase-admin

type LoginRequestBody = {
  token: string;
};

export const POST = async (req: NextRequest): Promise<NextResponse> => {
  try {
    const { token }: LoginRequestBody = await req.json();

    console.log("🚀 ~ POST ~ token:", token);
    if (!token) {
      return NextResponse.json({ error: "No token provided" }, { status: 400 });
    }

    const decodedToken = await getAuth().verifyIdToken(token);
    return NextResponse.json({ success: true, uid: decodedToken.uid });
  } catch (err: unknown) {
    console.error("Login verification error:", err);
    return NextResponse.json({ error: "Invalid token" }, { status: 401 });
  }
};
