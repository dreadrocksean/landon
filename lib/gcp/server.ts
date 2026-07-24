// lib/gcp/server.ts
// Server-side data fetching for the public artist pages, using the Firebase
// Admin SDK (bypasses security rules). Mirrors the client-SDK functions in
// lib/gcp/artists.ts that app/[webRoute]/layout.tsx depends on.
// Data is returned fully "plain" (Timestamps -> millis, DocumentReferences ->
// null) so it can be passed from Server Components to Client Components.
// Do NOT import this from a client component.
import { randomUUID } from "crypto";
import { adminDb, adminStorage } from "./admin";

// Recursively convert Firestore-specific values into JSON-serializable plain
// values so React can hand them across the Server -> Client boundary.
const deepSerialize = (value: any): any => {
  if (value === null || value === undefined) return null;
  if (typeof value !== "object") return value;
  // Firestore Timestamp (admin or client) -> milliseconds
  if (typeof value.toMillis === "function") return value.toMillis();
  // Firestore DocumentReference -> drop (circular + not serializable)
  if (typeof value.path === "string" && value.firestore) return null;
  // Firestore GeoPoint -> plain object
  if (
    value.constructor?.name === "GeoPoint" &&
    typeof value.latitude === "number"
  ) {
    return { latitude: value.latitude, longitude: value.longitude };
  }
  if (Array.isArray(value)) return value.map(deepSerialize);
  const out: Record<string, any> = {};
  for (const [k, v] of Object.entries(value)) out[k] = deepSerialize(v);
  return out;
};

export const getArtistByWebRoute = async ({
  webRoute,
}: {
  webRoute: string;
}): Promise<any | null> => {
  const snap = await adminDb
    .collection("artists")
    .where("webRoute", "==", webRoute)
    .limit(1)
    .get();
  if (snap.empty) return null;
  const doc = snap.docs[0];
  return deepSerialize({ ...doc.data(), id: doc.id });
};

export const getWebpageById = async ({
  id,
}: {
  id: string;
}): Promise<any | null> => {
  const docSnap = await adminDb.collection("webpages").doc(id).get();
  if (!docSnap.exists) return null;
  return deepSerialize({ ...docSnap.data(), id: docSnap.id });
};

export const getUserById = async (id: string = ""): Promise<any | null> => {
  if (!id) return null;
  const docSnap = await adminDb.collection("users").doc(id).get();
  if (!docSnap.exists) return null;
  return deepSerialize({ ...docSnap.data(), id: docSnap.id });
};

export const getShowsByArtistId = async ({
  artistId,
}: {
  artistId?: string;
}): Promise<any[]> => {
  if (!artistId) return [];
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const snap = await adminDb
    .collection(`artists/${artistId}/shows`)
    .where("scheduledStart", ">=", today)
    .orderBy("scheduledStart", "asc")
    .get();

  const shows = await Promise.all(
    snap.docs.map(async (doc) => {
      const data = doc.data() as any;
      let venue: any = null;
      if (data.venueRef && typeof data.venueRef.get === "function") {
        const venueSnap = await data.venueRef.get();
        if (venueSnap.exists) {
          venue = { id: venueSnap.id, ...venueSnap.data() };
        }
      }
      return { ...data, id: doc.id, venue };
    })
  );
  return deepSerialize(shows);
};

export const getImageGalleryByArtistId = async ({
  artistId,
}: {
  artistId?: string;
}): Promise<string[]> => {
  if (!artistId) return [];
  try {
    const bucket = adminStorage.bucket();
    const prefix = `artists/${artistId}/webpage/imageGallery/small`;
    const [files] = await bucket.getFiles({ prefix });
    const urls = await Promise.all(
      files
        // getFiles can return the "folder" placeholder object; skip it
        .filter((file) => !file.name.endsWith("/"))
        .map(async (file) => {
          // Use the permanent Firebase download-token URL (not a signed URL,
          // which would expire) so baked-in static-export pages keep working.
          const [meta] = await file.getMetadata();
          let token = (
            meta?.metadata?.firebaseStorageDownloadTokens as string | undefined
          )?.split(",")[0];
          if (!token) {
            token = randomUUID();
            await file.setMetadata({
              metadata: { firebaseStorageDownloadTokens: token },
            });
          }
          const encoded = encodeURIComponent(file.name);
          return `https://firebasestorage.googleapis.com/v0/b/${bucket.name}/o/${encoded}?alt=media&token=${token}`;
        })
    );
    return urls;
  } catch (err) {
    console.error("Error fetching image gallery:", err);
    return [];
  }
};
