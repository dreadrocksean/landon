// lib/firebase/admin.ts

import { cert, getApps, initializeApp } from "firebase-admin/app";
import { firestore } from "firebase-admin";
// import { serviceAccount } from "./serverOptions";

// if (!getApps().length) {
//   initializeApp({
//     credential: cert(serviceAccount),
//   });
// }

// export const adminDb = firestore();
