import { db } from "./client";
import {
  collection,
  doc,
  getDoc,
  setDoc,
  getDocs,
  serverTimestamp,
  CollectionReference,
} from "firebase/firestore";
import { Musician } from "@/lib/schema";

const musiciansRef = collection(db, "musicians") as CollectionReference<
  Musician,
  Musician
>;

export const createMusician = async (musician: Musician): Promise<void> => {
  await setDoc(doc(musiciansRef, musician.id), {
    ...musician,
    createdAt: serverTimestamp(),
  });
};

export const getMusician = async (id: string): Promise<Musician | null> => {
  const snap = await getDoc(doc(musiciansRef, id));
  return snap.exists() ? { id: snap.id, ...snap.data() } : null;
};

export const listMusicians = async (): Promise<Musician[]> => {
  const snap = await getDocs<Musician, Musician>(musiciansRef);
  return snap.docs.map((doc) => ({ id: doc.id, ...doc.data() } as Musician));
};

export const updateMusician = async (musician: Musician) => {
  await setDoc(doc(musiciansRef, musician.id), musician, { merge: true });
};

export const deleteMusician = async (id: string): Promise<void> => {
  await setDoc(doc(musiciansRef, id), { isActive: false }, { merge: true });
};
