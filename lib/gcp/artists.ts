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
} from "firebase/firestore";
import { Artist, User } from "@/lib/schema";

const artistsRef = collection(db, "venues") as CollectionReference<
  Artist,
  Artist
>;
const usersRef = collection(db, "users") as CollectionReference<User, User>;

export const createArtist = async (artist: Artist): Promise<void> => {
  await setDoc(doc(artistsRef, artist.id), {
    ...artist,
    createdAt: serverTimestamp(),
  });
};

export const getArtistByUserId = async ({
  userId,
}: {
  userId: string;
}): Promise<Artist | null> => {
  const q = query(collection(db, "artists"), where("userId", "==", userId));
  try {
    const snap = await getDocs(q);
    const artists = snap.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    })) as Artist[];
    return artists[0] || null;
  } catch (error) {
    console.error("Error fetching artist by user ID:", error);
    throw new Error(
      error instanceof Error
        ? error.message
        : `Error fetching artist by user ID: ${userId}`
    );
  }
};

export const listArtists = async (): Promise<Artist[]> => {
  const snap = await getDocs<Artist, Artist>(artistsRef);
  return snap.docs.map((doc) => ({ id: doc.id, ...doc.data() } as Artist));
};

export const updateArtist = async (artist: Artist) => {
  await setDoc(doc(artistsRef, artist.id), artist, { merge: true });
};

export const deleteArtist = async (id: string): Promise<void> => {
  await setDoc(doc(artistsRef, id), { isActive: false }, { merge: true });
};
