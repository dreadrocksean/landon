// lib/game.ts
// The running game, as the venue screen sees it.
//
// MIRRORS src/config/games.ts in the app. Conspicuously missing: the answer.
// That lives in a gameSecrets subcollection the rules keep away from fans,
// and the board has no business holding it either — `revealedSong` arrives
// only once the artist ends the round, which is the moment telling the whole
// room is the entire point.

export type GameType = "name-that-song";

export type GamePlayer = {
  name: string;
  uid: string;
  at: number;
  artistBonus: boolean;
};

export type ShowGame = {
  id: string;
  type: GameType;
  status: "open" | "closed";
  startedAt: number;
  winner: GamePlayer | null;
  alsoCorrect?: GamePlayer[];
  // The title with letters and digits knocked out, up for the whole round.
  // Word and letter counts are a hint, not a leak — a row of blanks is the
  // thing the room argues about while the clock runs.
  maskedSong?: string | null;
  revealedSong?: string | null;
  revealedArtist?: string | null;
  // When the artist ended it. Drives how long the board keeps showing the
  // result — see gameHoldsBoard.
  closedAt?: number | null;
};

// How long a finished round keeps the board's main panel.
//
// The reveal is a MOMENT, not a state. Once the room has read the answer the
// board's job goes back to the standings, which are the thing the whole
// product is about. Clearing it depends on the artist pressing a button
// mid-set, which they will not do, so a round they ended at nine was still
// sitting on the wall at midnight with the Crowd Favorites hidden behind it.
//
// Matches ROUND_RESULTS_MS in the app's src/config/games.ts — the fan's
// screen and the venue's screen let go of a finished round at the same time,
// because they are the same moment ending.
export const GAME_RESULTS_MS = 120000;

// Whether the game panel should still own the board.
//
// An open round always does. A closed one does for GAME_RESULTS_MS and then
// steps aside on its own. A closed round with no closedAt is treated as
// expired rather than fresh: those were closed by a build that did not write
// the field, so they are old by construction — which is also what clears the
// one already stuck on a board today.
export const gameHoldsBoard = (
  game?: ShowGame | null,
  now: number = Date.now()
): boolean => {
  if (!game) return false;
  if (game.status === "open") return true;
  if (typeof game.closedAt !== "number") return false;
  return now - game.closedAt < GAME_RESULTS_MS;
};

// When it stops holding, or null if it is not on a clock. The board sets a
// timer for exactly this so the panel steps aside on its own rather than
// waiting for some unrelated re-render to notice.
export const gameHoldsUntil = (game?: ShowGame | null): number | null =>
  game && game.status === "closed" && typeof game.closedAt === "number"
    ? game.closedAt + GAME_RESULTS_MS
    : null;

export const GAME_LABEL: Record<GameType, string> = {
  "name-that-song": "Name That Song",
};

// A name off a client write, going on a wall. Same clamp the heckle credit
// uses, for the same reason.
const NAME_MAX = 18;
export const cleanPlayerName = (raw: unknown): string =>
  typeof raw === "string" ? raw.replace(/\s+/g, " ").trim().slice(0, NAME_MAX) : "";

export const toShowGame = (raw: unknown): ShowGame | null => {
  const g = raw as Partial<ShowGame> | null | undefined;
  if (!g || typeof g.id !== "string" || !g.type) return null;
  const player = (p: unknown): GamePlayer | null => {
    const v = p as Partial<GamePlayer> | null;
    const name = cleanPlayerName(v?.name);
    if (!name) return null;
    return {
      name,
      uid: typeof v?.uid === "string" ? v.uid : "",
      at: typeof v?.at === "number" ? v.at : 0,
      artistBonus: v?.artistBonus === true,
    };
  };
  return {
    id: g.id,
    type: g.type,
    status: g.status === "closed" ? "closed" : "open",
    startedAt: typeof g.startedAt === "number" ? g.startedAt : 0,
    winner: player(g.winner),
    alsoCorrect: Array.isArray(g.alsoCorrect)
      ? g.alsoCorrect.map(player).filter((p): p is GamePlayer => !!p)
      : [],
    maskedSong: typeof g.maskedSong === "string" ? g.maskedSong : null,
    revealedSong: typeof g.revealedSong === "string" ? g.revealedSong : null,
    revealedArtist:
      typeof g.revealedArtist === "string" ? g.revealedArtist : null,
    closedAt: typeof g.closedAt === "number" ? g.closedAt : null,
  };
};
