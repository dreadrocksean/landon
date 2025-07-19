import { ServiceAccount } from "firebase-admin";
import { FirebaseOptions } from "firebase/app";

// export const firebaseConfig: FirebaseOptions = {
//   apiKey: "AIzaSyB7KeJNbcyroHBp564KN8liPXMN1e_sTP4",
//   authDomain: "tellmewhattoplay-1.firebaseapp.com",
//   databaseURL: "https://tellmewhattoplay-1.firebaseio.com",
//   projectId: "tellmewhattoplay-1",
//   storageBucket: "tellmewhattoplay-1.appspot.com",
//   messagingSenderId: "177859591611",
//   appId: "1:177859591611:web:04d7a35bee4048d0",
// };

export const firebaseConfig: FirebaseOptions = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY!,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN!,
  databaseURL: process.env.NEXT_PUBLIC_FIREBASE_DATABASE_URL!,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID!,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET!,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID!,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID!,
};

export const serviceAccount: ServiceAccount = {
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID!,
  privateKey: process.env.FIREBASE_PRIVATE_KEY!.replace(/\\n/g, "\n"),
  clientEmail: process.env.FIREBASE_CLIENT_EMAIL!,
  // clientId: "104427249681064068693",
  // authUri: "https://accounts.google.com/o/oauth2/auth",
  // tokenUri: "https://oauth2.googleapis.com/token",
  // authProviderX509CertUrl: "https://www.googleapis.com/oauth2/v1/certs",
  // client_x509_cert_url:
  //   "https://www.googleapis.com/robot/v1/metadata/x509/firebase-adminsdk-fbsvc%40tellmewhattoplay-1.iam.gserviceaccount.com",
  // universe_domain: "googleapis.com",
};
