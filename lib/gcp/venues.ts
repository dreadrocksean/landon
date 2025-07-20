import { db } from "./client";
import {
  collection,
  doc,
  getDoc,
  setDoc,
  getDocs,
  serverTimestamp,
  CollectionReference,
  DocumentData,
  where,
  Query,
  query,
  DocumentReference,
  addDoc,
} from "firebase/firestore";
import { FSQVenue, Venue } from "@/lib/schema";

const venuesRef = collection(db, "venues") as CollectionReference<
  FSQVenue,
  FSQVenue
>;

export const createVenue = async (
  venue: FSQVenue
): Promise<DocumentReference<FSQVenue, FSQVenue>> =>
  await addDoc<FSQVenue, FSQVenue>(venuesRef, {
    ...venue,
    createdAt: serverTimestamp(),
  });

export const getVenueById = async ({
  id,
}: {
  id: string;
}): Promise<Venue | null> => {
  const docRef = doc(venuesRef, id);
  const snap = await getDoc(docRef);
  if (snap.exists()) {
    return { ...snap.data(), id: snap.id } as Venue;
  }
  return null;
};

export const getVenueByRef = async ({
  ref,
}: {
  ref: DocumentReference<Venue, Venue>;
}): Promise<Venue | undefined> => {
  try {
    const snap = await getDoc(ref);
    if (snap.exists()) {
      return Promise.resolve({ ...snap.data(), id: snap.id });
    }
    return Promise.resolve(undefined);
  } catch (error) {
    console.error("Error fetching venue by reference:", error);
    throw new Error(
      error instanceof Error
        ? error.message
        : `Error fetching venue by reference: ${ref.id}`
    );
  }
};

export const listVenues = async (): Promise<Venue[]> => {
  const snap = await getDocs<FSQVenue, FSQVenue>(venuesRef);
  return snap.docs.map((doc) => ({ ...doc.data(), id: doc.id } as Venue));
};

export const updateVenue = async (venue: Venue) => {
  await setDoc(doc(venuesRef, venue.id), venue, { merge: true });
};
