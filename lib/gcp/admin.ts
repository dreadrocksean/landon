// lib/firebase/admin.ts
import {
  cert,
  getApps,
  initializeApp,
  ServiceAccount,
} from "firebase-admin/app";
import { firestore } from "firebase-admin";
import { serviceAccount } from "./options";

if (!getApps().length) {
  initializeApp({
    credential: cert(serviceAccount),
  });
}

export const adminDb = firestore();
