// lib/firebase/client.ts
import { initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";
import { firebaseConfig } from "./options";

const app = initializeApp(firebaseConfig);

export const db = getFirestore(app);
