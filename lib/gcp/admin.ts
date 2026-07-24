// lib/gcp/admin.ts
// Server-only Firebase Admin SDK initialization.
// Reads with these credentials bypass Firestore/Storage security rules, so this
// file (and lib/gcp/server.ts) must NEVER be imported into a client
// ("use client") component — only from server components / route handlers.
import admin from "firebase-admin";

const projectId = process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID;
const clientEmail = process.env.FIREBASE_CLIENT_EMAIL;
// The private key is stored with escaped newlines in .env.local
const privateKey = process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, "\n");
const storageBucket = process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET;

if (!projectId || !clientEmail || !privateKey) {
  throw new Error(
    "Missing Firebase Admin credentials (NEXT_PUBLIC_FIREBASE_PROJECT_ID / FIREBASE_CLIENT_EMAIL / FIREBASE_PRIVATE_KEY)"
  );
}

const app = admin.apps.length
  ? admin.app()
  : admin.initializeApp({
      credential: admin.credential.cert({ projectId, clientEmail, privateKey }),
      storageBucket,
    });

export const adminDb = admin.firestore(app);
export const adminStorage = admin.storage(app);
export { admin };
