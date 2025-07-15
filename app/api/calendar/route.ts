import { NextRequest, NextResponse } from "next/server";
import { getAuth } from "firebase-admin/auth";
import { getFirestore, Timestamp } from "firebase-admin/firestore";
import { createShow } from "@/lib/gcp/shows";
import { createVenue } from "@/lib/gcp/venues";
import "@/lib/gcp/admin"; // initialize admin SDK

const db = getFirestore();

export const GET = async (req: NextRequest) => {
  console.log("🚀 ~ GET ~ req:", req);

  try {
    // const authHeader = req.headers.get("authorization");
    // if (!authHeader?.startsWith("Bearer ")) {
    //   return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    // }
    // const token = authHeader.split("Bearer ")[1];
    // console.log("🚀 ~ GET ~ token:", token);
    // await getAuth().verifyIdToken(token);

    const showsRef = db.collection("shows");
    const query = showsRef.orderBy("scheduledStart", "desc");
    const snapshot = await query.get();

    const shows = snapshot.docs.map((doc) => {
      const data = doc.data();
      return {
        id: doc.id,
        title: data.title,
        scheduledStart: data.scheduledStart.toDate(),
        scheduledStop: data.scheduledStop.toDate(),
        venueId: data.venueId,
        // add other fields as needed
      };
    });

    return NextResponse.json({ shows });
  } catch (error: any) {
    console.error("Error fetching shows:", error);
    return NextResponse.json(
      { error: "Failed to fetch shows" },
      { status: 500 }
    );
  }
};

export const POST = async (req: NextRequest) => {
  try {
    const authHeader = req.headers.get("authorization");
    const token = authHeader?.startsWith("Bearer ")
      ? authHeader.split("Bearer ")[1]
      : null;

    if (!token) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const decodedToken = await getAuth().verifyIdToken(token);
    const uid = decodedToken.uid;

    const data = await req.json();
    const { title, scheduledStart, scheduledStop, venue } = data;

    if (!title || !scheduledStart || !scheduledStop || !venue) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      );
    }

    const start = Timestamp.fromDate(new Date(scheduledStart));
    const end = Timestamp.fromDate(new Date(scheduledStop));

    const venueResult = await createVenue(venue);

    const newShowId = await createShow({
      ...data,
      scheduledStart: start,
      scheduledStop: end,
      userId: uid,
      venueId: venueResult.id,
      venueRef: venueResult.ref,
    });

    return NextResponse.json({ success: true, id: newShowId });
  } catch (error: any) {
    console.error("❌ Error creating show:", error.message, error.stack);
    return NextResponse.json(
      {
        error:
          error.code === "auth/argument-error"
            ? "Invalid auth token"
            : "Failed to create show",
      },
      { status: error.code === "auth/argument-error" ? 401 : 500 }
    );
  }
};
