// lib/gcp/board.ts
// Server-side read of the venue TV board projection.
//
// publicBoards/{code} is maintained by Cloud Functions and is the ONLY place
// the audience-facing vote standings are readable without auth — the
// underlying artists/{id}/shows/{id}/songStats collection is locked to the
// owning artist. The function decides what goes into the projection, so this
// page cannot leak anything by rendering too much.
//
// Do NOT import this from a client component (it pulls in the Admin SDK).
import { adminDb } from "./admin";
import { Board, normalizeBoardCode, toBoard } from "../board";

export const getBoardByCode = async (code: string): Promise<Board | null> => {
  const normalized = normalizeBoardCode(code);
  if (!normalized) return null;
  const snap = await adminDb.collection("publicBoards").doc(normalized).get();
  if (!snap.exists) return null;
  return toBoard(snap.data() || {});
};
