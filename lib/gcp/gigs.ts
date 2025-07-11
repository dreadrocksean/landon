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
} from "firebase/firestore";
import { Gig } from "@/lib/schema";

const gigsRef = collection(db, "gigs") as CollectionReference<Gig, Gig>;

export const createGig = async (gig: Gig): Promise<void> => {
  await setDoc(doc(gigsRef, gig.id), {
    ...gig,
    createdAt: serverTimestamp(),
  });
};

export const getGig = async (id: string): Promise<Gig | null> => {
  const snap = await getDoc(doc(gigsRef, id));
  return snap.exists()
    ? {
        id: snap.id,
        ...snap.data(),
      }
    : null;
};

export const listGigsForMusician = async (
  musicianId: string
): Promise<Gig[]> => {
  const q = query(gigsRef, where("musicianId", "==", musicianId));
  const snap = await getDocs(q);
  return snap.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
};

export const updateGig = async (gig: Gig): Promise<void> => {
  await setDoc(doc(gigsRef, gig.id), gig, { merge: true });
};

export const deleteGig = async (id: string): Promise<void> => {
  await setDoc(doc(gigsRef, id), { status: "booked" }, { merge: true });
};

export const listGigs = async (): Promise<Gig[]> => {
  const snap = await getDocs(gigsRef);
  return snap.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
};
