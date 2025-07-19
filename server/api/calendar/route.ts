import { NextRequest, NextResponse } from "next/server";
import { getFirestore } from "firebase-admin/firestore";
import { createShow } from "@/lib/gcp/shows";
console.log("🚀 ~ createShow:", createShow);
import "@/server/admin"; // initialize admin SDK

import { Show, Venue } from "@/lib/schema";

const db = getFirestore();

interface CreateShowBody {
  title: string;
  scheduledStart: string;
  scheduledStop: string;
  venue: Venue;
  artistId: string;
}

// GET: fetch all shows
export const GET = async (req: NextRequest): Promise<NextResponse> => {
  try {
    const showsRef = db.collection("shows");
    const query = showsRef.orderBy("scheduledStart", "desc");
    const snapshot = await query.get();

    const shows: Show[] = snapshot.docs.map((doc) => {
      const data = doc.data();
      return {
        id: doc.id,
        showTitle: data.title,
        scheduledStart: data.scheduledStart.toDate(),
        scheduledStop: data.scheduledStop.toDate(),
        venueId: data.venueId,
        venue: data.venue,
        date: data.date ? data.date.toDate() : data.scheduledStart.toDate(),
        duration:
          data.duration ??
          (data.scheduledStop && data.scheduledStart
            ? (data.scheduledStop.toDate().getTime() -
                data.scheduledStart.toDate().getTime()) /
              1000
            : null),
        createdAt: data.createdAt ? data.createdAt.toDate() : null,
      };
    });

    return NextResponse.json({ shows });
  } catch (error: any) {
    console.error("❌ Error fetching shows:", error.message);
    return NextResponse.json(
      { error: "Failed to fetch shows" },
      { status: 500 }
    );
  }
};

// POST: create a new show
export const POST = async (req: NextRequest): Promise<NextResponse> => {
  try {
    const data: CreateShowBody = await req.json();
    const { title, scheduledStart, scheduledStop, venue, artistId } = data;

    if (!title || !scheduledStart || !scheduledStop || !venue || !artistId) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      );
    }

    const newShowId = await createShow(data);
    console.log("🚀 ~ POST ~ newShowId:", newShowId);

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
