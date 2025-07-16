import { NextRequest, NextResponse } from "next/server";
import { getAuth } from "firebase-admin/auth";
import { getFirestore, Timestamp } from "firebase-admin/firestore";
import { createShow } from "@/lib/gcp/shows";
import { createVenue } from "@/lib/gcp/venues";
import "@/lib/gcp/admin"; // initialize admin SDK

const db = getFirestore();

// GET: fetch all shows
export const GET = async (req: NextRequest) => {
  try {
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
        // Add other fields as needed
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
export const POST = async (req: NextRequest) => {
  try {
    /* const authHeader = req.headers.get("authorization");
    const token = authHeader?.startsWith("Bearer ")
      ? authHeader.split("Bearer ")[1]
      : null;

    if (!token) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const decodedToken = await getAuth().verifyIdToken(token);
    const uid = decodedToken.uid; */

    const data = await req.json();
    const { title, scheduledStart, scheduledStop, venue, artistId } = data;

    if (!title || !scheduledStart || !scheduledStop || !venue || !artistId) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      );
    }

    // const venueRef = await createVenue(venue);
    // console.log("🚀 ~ POST ~ venueRef id:", venueRef.id);

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

// DELETE: delete a show by ID
export const DELETE = async (req: NextRequest) => {
  try {
    const authHeader = req.headers.get("authorization");
    const token = authHeader?.startsWith("Bearer ")
      ? authHeader.split("Bearer ")[1]
      : null;

    if (!token) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    await getAuth().verifyIdToken(token);

    const { id } = await req.json();

    if (!id) {
      return NextResponse.json({ error: "Missing show ID" }, { status: 400 });
    }

    await db.collection("shows").doc(id).delete();

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error("❌ Error deleting show:", error.message);
    return NextResponse.json(
      { error: "Failed to delete show" },
      { status: 500 }
    );
  }
};
