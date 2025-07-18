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
import { User } from "@/lib/schema";

const usersRef = collection(db, "users") as CollectionReference<User, User>;

export const getUserByEmail = async ({
  email,
  setError,
  setIsLoading,
}: {
  email: string;
  setError: (error: string | null) => void;
  setIsLoading: (loading: boolean) => void;
}): Promise<User | null> => {
  const q = query(collection(db, "users"), where("email", "==", email));

  try {
    const snap = await getDocs(q);
    const users = [...snap.docs].map((doc) => ({
      id: doc.id,
      ...doc.data(),
    })) as User[];
    const user = users[0];
    if (!user) {
      throw new Error("No user found with the provided email.");
    }
    setIsLoading(false);
    return Promise.resolve(user);
  } catch (error) {
    console.error("Error getting user by email:", error);
    setError(
      error instanceof Error
        ? error.message
        : `Error getting user by email: ${email}`
    );
    setIsLoading(false);
    throw error;
  }
};
