// lib/firebase/client.ts
import { initializeApp, getApps, getApp } from "firebase/app";
import { getFirestore, initializeFirestore } from "firebase/firestore";
import { getAuth } from "firebase/auth";
import { getStorage } from "firebase/storage";
import { firebaseConfig } from "./options";

const app = getApps().length ? getApp() : initializeApp(firebaseConfig);

// Firestore's realtime channel normally uses WebChannel streaming, which a lot
// of venue wifi (captive portals, caching proxies, cheap routers) buffers or
// blocks outright. The symptom is not a clean failure but a stall: updates
// arrive tens of seconds late, which on the TV board looks like votes simply
// not registering. autoDetectLongPolling notices the stall and switches to
// long polling instead. Must run before any getFirestore() call.
const firestore = (() => {
  try {
    return initializeFirestore(app, {
      experimentalAutoDetectLongPolling: true,
    });
  } catch {
    // Already initialized (fast refresh, or another module got there first).
    return getFirestore(app);
  }
})();

export const db = firestore;
export const auth = getAuth(app);
export const storage = getStorage(app); // 👈 add this
