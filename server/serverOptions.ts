import { ServiceAccount } from "firebase-admin";

console.log(
  "🚀 ~ process.env.FIREBASE_PRIVATE_KEY:",
  process.env.FIREBASE_PRIVATE_KEY
);

// export const serviceAccount: ServiceAccount = {
//   projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID!,
//   privateKey: process.env.FIREBASE_PRIVATE_KEY!.replace(/\\n/g, "\n"),
//   clientEmail: process.env.FIREBASE_CLIENT_EMAIL!,
// };
