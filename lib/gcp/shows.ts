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
  deleteDoc,
  WithFieldValue,
  updateDoc,
  limit,
  orderBy,
} from "firebase/firestore";
import { Artist, FirestoreShow, ResponseData, Show, Venue } from "@/lib/schema";
import { createVenue, getVenueByRef } from "./venues";
import { getDataFromRef } from "./general";

export const createShow = async ({
  artistId,
  venue,
  scheduledStart,
  scheduledStop,
  ...rest
}: {
  artistId: string;
  venue: Venue;
  scheduledStart: Timestamp;
  scheduledStop: Timestamp;
  [key: string]: any;
}): Promise<ResponseData<FirestoreShow>> => {
  let venueRef: DocumentReference<Venue> | null = null;
  const artistRef = doc(db, `artists`, artistId) as DocumentReference<Artist>;
  try {
    if (!venue) throw new Error("Venue required to create show");
    const queryVenue = query(
      collection(db, "venues") as CollectionReference<Venue, Venue>,
      where("name", "==", venue.name)
    );
    const snap = await getDocs(queryVenue);
    if (snap.empty) {
      console.log("Venue not found, creating new venue");
      venueRef = await createVenue(venue);
      console.log("Created new venue:", venueRef.id);
      venue = { ...venue, id: venueRef.id };
    } else {
      console.log("Found existing venue:", snap.docs[0].id);
      venueRef = doc(db, "venues", snap.docs[0].id) as DocumentReference<
        Venue,
        Venue
      >;
      venue = { ...venue, id: snap.docs[0].id };
    }
    const now = new Date().getTime();
    const live = scheduledStart.toMillis() <= now;
    const createdAt = Timestamp.fromMillis(now);

    const showRef = await addDoc<FirestoreShow, FirestoreShow>(
      collection(artistRef, "shows") as CollectionReference<
        FirestoreShow,
        FirestoreShow
      >,
      {
        createdAt,
        scheduledStart,
        scheduledStop,
        venueId: venue.id,
        venueRef,
        venueName: venue.name,
        ...rest,
      }
    );
    const showRes = await getDataFromRef<FirestoreShow>(showRef);
    await updateDoc(artistRef, {
      live,
      currShowId: showRef.id,
      scheduledStart,
      scheduledStop,
    });
    return Promise.resolve(showRes);
  } catch (err) {
    console.log("🚀 ~ err:", err);
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
      ) as DocumentReference<FirestoreShow>
    );
    const data = { ...showDoc.data(), id: showDoc.id } as Show;
    return Promise.resolve(data);
  } catch (err: any) {
    console.error("getShow error", err);
    throw err;
  }
};

export const endShow = async (
  artistId: string,
  currShowId: string
): Promise<void> => {
  const artistRef = doc(db, `artists`, artistId) as DocumentReference<
    Artist,
    Artist
  >;
  const showRef = doc(artistRef, "shows", currShowId) as DocumentReference<
    Show,
    Show
  >;
  try {
    const timestamp = Timestamp.now();
    await updateDoc<Show, Show>(showRef, { scheduledStop: timestamp });
    await updateDoc<Artist, Artist>(artistRef, {
      live: false,
      currShowId: null,
    });
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
  const q = query(showsRef, orderBy("scheduledStop", "desc"), limit(10));
  try {
    setIsLoading(true);
    const snap = await getDocs(q);

    const showsPromises = snap.docs.map(async (doc): Promise<Show> => {
      const show = doc.data() as FirestoreShow;
      const stop =
        show.scheduledStop instanceof Timestamp
          ? show.scheduledStop
          : Timestamp.fromDate(new Date(show.scheduledStop));
      const start =
        show.scheduledStart instanceof Timestamp
          ? show.scheduledStart
          : Timestamp.fromDate(new Date(show.scheduledStart));
      const durationInHours =
        (stop.toMillis() - start.toMillis()) / (1000 * 60 * 60);
      const duration = Math.round(durationInHours * 100) / 100; // Round to two decimal places

      const venue = show.venueRef
        ? await getVenueByRef({
            ref: show.venueRef as DocumentReference<Venue, Venue>,
          })
        : undefined;
      return Promise.resolve({
        id: doc.id,
        showTitle: show.title ?? show.showTitle ?? "",
        venueName: venue?.name ?? "",
        venue,
        createdAt: show.createdAt,
        scheduledStart:
          typeof show.scheduledStart === "string"
            ? Timestamp.fromDate(new Date(show.scheduledStart))
            : show.scheduledStart,
        scheduledStop:
          typeof show.scheduledStop === "string"
            ? Timestamp.fromDate(new Date(show.scheduledStop))
            : show.scheduledStop,
        date:
          typeof show.scheduledStart === "string"
            ? new Date(show.scheduledStart)
            : show.scheduledStart.toDate(),
        duration: duration,
        location:
          venue?.location && typeof venue.location === "object"
            ? venue.location.formatted_address
            : venue?.location && typeof venue.location === "string"
            ? venue.location
            : "",
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
  return snap.docs.map((doc) => ({ ...doc.data(), id: doc.id }));
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
  showId,
  artistId,
}: {
  showId: string;
  artistId: string;
}): Promise<void> => {
  try {
    await deleteDoc(doc(db, "artists", artistId, "shows", showId));
  } catch (error) {
    console.error("Error deleting show:", error);
    throw error;
  }
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
  return snap.docs.map((doc) => ({ ...doc.data(), id: doc.id }));
};
