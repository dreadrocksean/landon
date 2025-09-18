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
} from "firebase/firestore";
import { Artist, Show, User, Venue, Webpage } from "@/lib/schema";

const artistsRef = collection(db, "artists") as CollectionReference<
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

export const getShowsByArtistId = async ({
  artistId,
}: {
  artistId: string;
}): Promise<Show[]> => {
  const showsRef = collection(
    db,
    `artists/${artistId}/shows`
  ) as CollectionReference<Show>;
  const q: Query<Show> = query(showsRef);
  try {
    const snap = await getDocs(q);
    const shows = snap.docs.map(
      (doc) => ({ ...doc.data(), id: doc.id } as Show)
    );
    const showsWithVenues = await Promise.all(
      shows.map(async (show) => {
        if (show.venueRef) {
          // const venueRef = doc(db, "venues", show.venueId);
          const venueSnap = await getDoc(show.venueRef);
          if (venueSnap.exists()) {
            // Ensure the returned venue matches the Venue type
            const venueData = venueSnap.data();
            const venue = { id: venueSnap.id, ...venueData } as Venue;
            return { ...show, venue };
          }
        }
        return show;
      })
    );
    return showsWithVenues;
  } catch (error) {
    console.error("Error fetching shows by artist ID:", error);
    throw new Error(
      error instanceof Error
        ? error.message
        : `Error fetching shows by artist ID: ${artistId}`
    );
  }
};

export const getWebpageById = async ({
  id,
}: {
  id: string;
}): Promise<Webpage | null> => {
  try {
    const docRef = doc(db, "webpages", id) as DocumentReference<Webpage>;
    const docSnap = await getDoc(docRef);
    if (docSnap.exists()) {
      return { ...docSnap.data(), id: docSnap.id };
    } else {
      return null;
    }
  } catch (error) {
    console.error("Error fetching webpage by ID:", error);
    throw new Error(
      error instanceof Error
        ? error.message
        : `Error fetching webpage by ID: ${id}`
    );
  }
};

export const getArtistByWebRoute = async ({
  webRoute,
}: {
  webRoute: string;
}): Promise<Artist | null> => {
  const q = query(collection(db, "artists"), where("webRoute", "==", webRoute));
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
        : `Error fetching artist by web route: ${webRoute}`
    );
  }
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

export const getUserById = async (id: string): Promise<User | null> => {
  try {
    const docRef = doc(db, "users", id) as DocumentReference<User>;
    const docSnap = await getDoc(docRef);
    if (docSnap.exists()) {
      return { ...docSnap.data(), id: docSnap.id };
    } else {
      return null;
    }
  } catch (error) {
    console.error("Error fetching user by ID:", error);
    throw new Error(
      error instanceof Error
        ? error.message
        : `Error fetching user by ID: ${id}`
    );
  }
};

export const getAllArtists = async (): Promise<Artist[]> => {
  const snap = await getDocs<Artist, Artist>(artistsRef);
  return snap.docs.map((doc) => ({ ...doc.data(), id: doc.id } as Artist));
};

export const updateArtist = async (artist: Artist) => {
  await setDoc(doc(artistsRef, artist.id), artist, { merge: true });
};

export const deleteArtist = async (id: string): Promise<void> => {
  await setDoc(doc(artistsRef, id), { isActive: false }, { merge: true });
};
