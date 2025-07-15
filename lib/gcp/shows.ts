import { db } from "./client";
import {
  collection,
  doc,
  getDoc,
  getDocs,
  setDoc,
  query,
  where,
  serverTimestamp,
  CollectionReference,
  Timestamp,
  DocumentReference,
  addDoc,
  WithFieldValue,
} from "firebase/firestore";
import { Artist, FirestoreShow, Show, Venue } from "@/lib/schema";
import { getVenueByRef } from "./venues";

/* export const createShow = async ({
  show,
  artistId,
}: {
  show: Show;
  artistId: string;
}): Promise<void> => {
  const showsRef = collection(
    db,
    `artists/${artistId}/shows`
  ) as CollectionReference<Show, Show>;
  await setDoc(doc(showsRef, show.id), {
    ...show,
    createdAt: serverTimestamp(),
  });
}; */

export const createVenue = (payload) => createDoc<Venue>("venue", payload);

export const createShow = async ({
  artistId,
  venue,
  scheduledStartTime,
  scheduledStopTime,
  ...rest
}: {
  artistId: string;
  venue: Venue;
  scheduledStartTime: number;
  scheduledStopTime: number;
  [key: string]: any;
}): Promise<Show> => {
  const artistRef = doc(
    // FIRESTORE_DB,
    db,
    `artists`,
    artistId
  ) as DocumentReference<Artist>;
  try {
    if (!venue) throw new Error("Venue required to create show");
    const foundVenue = await getDocs<Venue>("venue", { name: venue.name });
    const venueId =
      foundVenue?.data?.[0]?._id ?? (await createVenue(venue))?.data?._id;
    const venueRef = doc(db, `venues`, venueId);
    const now = new Date().getTime();
    const live = scheduledStartTime <= now;
    const createdAt = Timestamp.fromMillis(now);
    const scheduledStart = Timestamp.fromMillis(scheduledStartTime);
    const scheduledStop = Timestamp.fromMillis(scheduledStopTime);

    const showRef = await addDoc<Show>(
      collection(artistRef, "shows") as CollectionReference<Show>,
      {
        createdAt,
        scheduledStart,
        scheduledStop,
        venueId,
        venueRef,
        ...rest,
      } as WithFieldValue<Show>
    );
    const showRes = await getDataFromRef<Show>(showRef);
    await updateDOC(artistRef, {
      live,
      currShowId: showRef.id,
      scheduledStart,
      scheduledStop,
    });
    return Promise.resolve(showRes.data);
  } catch (err) {
    return Promise.reject(err);
  }
};

export const getShow = async ({
  artistId,
  currShowId,
}: {
  artistId: string;
  currShowId: string;
}): Promise<Show> => {
  try {
    const showDoc = await getDoc(
      doc(
        db,
        "artists",
        artistId,
        "shows",
        currShowId
      ) as DocumentReference<Show>
    );
    const data = showDoc.data();
    if (data) data._id = showDoc.id;
    return Promise.resolve(data);
  } catch (err: any) {
    console.error("getShow error", err);
    throw err;
  }
};

export const endShow = async (artistId, currShowId): Promise<void> => {
  const artistRef = doc(db, `artists`, artistId) as DocumentReference<Artist>;
  const showRef = doc(
    artistRef,
    "shows",
    currShowId
  ) as DocumentReference<Show>;
  try {
    const timestamp = Timestamp.now();
    await updateDOC<Show>(showRef, { endTime: timestamp });
    await updateDOC<Artist>(artistRef, { live: false, currShowId: null });
    console.log("Ended show");
    return Promise.resolve();
  } catch (err) {
    console.error("end show error", err);
    throw err;
  }
};

export const getShowsByArtistId = async ({
  artistId,
  setError,
  setIsLoading,
}: {
  artistId: string;
  setError: (error: string) => void;
  setIsLoading: (isLoading: boolean) => void;
}): Promise<Show[]> => {
  const showsRef = collection(
    db,
    `artists/${artistId}/shows`
  ) as CollectionReference<FirestoreShow, FirestoreShow>;
  const q = query(
    showsRef,
    where("scheduledStop", ">", Timestamp.fromDate(new Date("2025-01-01")))
  );
  try {
    setIsLoading(true);
    const snap = await getDocs(q);

    const showsPromises = snap.docs.map(async (doc): Promise<Show> => {
      const show = doc.data() as FirestoreShow;
      const durationInHours =
        (show.scheduledStop.toMillis() - show.scheduledStart.toMillis()) /
        (1000 * 60 * 60);
      const duration = Math.round(durationInHours * 100) / 100; // Round to two decimal places

      const venue = await getVenueByRef({
        ref: show.venueRef as DocumentReference<Venue, Venue>,
      });
      return Promise.resolve({
        id: doc.id,
        artistId: artistId,
        venue: venue?.name ?? "",
        createdAt: show.createdAt,
        scheduledStart: show.scheduledStart,
        scheduledStop: show.scheduledStop,
        date: show.scheduledStart.toDate(),
        duration: duration,
        location: venue?.location,
      });
    });
    const shows = await Promise.all(showsPromises);
    setIsLoading(false);
    setError("");
    return Promise.resolve(shows);
  } catch (error) {
    const errorMessage =
      error instanceof Error
        ? error.message
        : `Error fetching shows by artist ID: ${artistId}`;
    console.error(errorMessage);
    setError(errorMessage);
    setIsLoading(false);

    throw new Error(errorMessage);
  }
};

export const listShowsForArtist = async (artistId: string): Promise<Show[]> => {
  const showsRef = collection(
    db,
    `artists/${artistId}/shows`
  ) as CollectionReference<Show, Show>;
  const q = query(showsRef, where("artistId", "==", artistId));
  const snap = await getDocs(q);
  return snap.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
};

export const updateShow = async ({
  show,
  artistId,
}: {
  show: Show;
  artistId: string;
}): Promise<void> => {
  const showsRef = collection(
    db,
    `artists/${artistId}/shows`
  ) as CollectionReference<Show, Show>;
  await setDoc(doc(showsRef, show.id), show, { merge: true });
};

export const deleteShow = async ({
  id,
  artistId,
}: {
  id: string;
  artistId: string;
}): Promise<void> => {
  const showsRef = collection(
    db,
    `artists/${artistId}/shows`
  ) as CollectionReference<Show, Show>;
  await setDoc(doc(showsRef, id), { status: "booked" }, { merge: true });
};

export const listShows = async ({
  artistId,
}: {
  artistId: string;
}): Promise<Show[]> => {
  const showsRef = collection(
    db,
    `artists/${artistId}/shows`
  ) as CollectionReference<Show, Show>;
  const snap = await getDocs(showsRef);
  return snap.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
};
