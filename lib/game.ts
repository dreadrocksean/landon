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
};

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
  };
};
