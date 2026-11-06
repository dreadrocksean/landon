// lib/board.ts
// Pure helpers and types for the venue TV board. No Firebase imports, so this
// is safe to pull into a client component — lib/gcp/board.ts holds the
// server-only (Admin SDK) read.
//
// Mirrors functions/src/tvBoard/boardCode.js in the TellMeWhatToPlay client
// repo, which mints the codes and writes the board docs — keep the two in step.

export const BOARD_CODE_LEN = 6;

// "abc-123", "abc 123" and "ABC123" all name the same board, because the code
// gets read off a TV and typed on a remote.
export const normalizeBoardCode = (raw?: string | null): string =>
  String(raw || "")
    .toUpperCase()
    .replace(/[^A-Z0-9]/g, "");

// Route params arrive percent-encoded, so a typed space reaches us as "%20"
// and normalizing it directly would strip the "%" and keep the "20" — turning
// "ZZT EST" into the plausible-looking, wrong "ZZT20EST". Decode first, and
// treat malformed encoding ("%ZZ") as empty rather than throwing at a TV.
export const decodeCodeParam = (raw?: string | null): string => {
  try {
    return decodeURIComponent(String(raw || ""));
  } catch {
    return "";
  }
};

// Display form, grouped so it is readable from across a room: ABC-123.
export const formatBoardCode = (raw?: string | null): string => {
  const normalized = normalizeBoardCode(raw);
  if (normalized.length !== BOARD_CODE_LEN) return normalized;
  return `${normalized.slice(0, 3)}-${normalized.slice(3)}`;
};

export interface BoardSong {
  songId: string;
  title: string;
  artist: string | null;
  votes: number;
}

// A tip the board may announce. Names and messages are already filtered
// server-side (functions/src/tvBoard/shoutout.js) — the page renders what it
// is given and does no vetting of its own, same as the rest of the board.
export interface BoardTip {
  id: string;
  name: string;
  votes: number;
  message: string | null;
  songTitle: string | null;
  at: number;
}

export interface BoardSupporter {
  name: string;
  votes: number;
}

export interface Board {
  artistId: string;
  artistName: string;
  // The artist's profile photo. Already public — it is what fans see in the
  // app — and it is the one thing that makes a board look like THIS band's
  // rather than the product's.
  artistImageURL: string | null;
  live: boolean;
  showId: string | null;
  showTitle: string | null;
  venueName: string | null;
  songs: BoardSong[];
  totalVotes: number;
  recentTip: BoardTip | null;
  topSupporter: BoardSupporter | null;
}

// Shape an arbitrary Firestore document into the Board the page renders,
// tolerating docs written by an older version of the Cloud Function. Also
// drops the doc's updatedAt Timestamp, which is not serializable across the
// Server -> Client boundary.
export const toBoard = (data: Record<string, any>): Board => ({
  artistId: String(data.artistId ?? ""),
  artistName: String(data.artistName ?? ""),
  artistImageURL:
    typeof data.artistImageURL === "string" && data.artistImageURL
      ? data.artistImageURL
      : null,
  live: data.live === true,
  showId: data.showId ?? null,
  showTitle: data.showTitle ?? null,
  venueName: data.venueName ?? null,
  songs: Array.isArray(data.songs)
    ? data.songs.map((song: any) => ({
        songId: String(song?.songId ?? ""),
        title: String(song?.title ?? "Untitled"),
        artist: song?.artist ?? null,
        votes: typeof song?.votes === "number" ? song.votes : 0,
      }))
    : [],
  totalVotes: typeof data.totalVotes === "number" ? data.totalVotes : 0,
  recentTip: data.recentTip?.id
    ? {
        id: String(data.recentTip.id),
        name: String(data.recentTip.name ?? "Someone"),
        votes:
          typeof data.recentTip.votes === "number" ? data.recentTip.votes : 0,
        message: data.recentTip.message ?? null,
        songTitle: data.recentTip.songTitle ?? null,
        at: typeof data.recentTip.at === "number" ? data.recentTip.at : 0,
      }
    : null,
  topSupporter: data.topSupporter?.name
    ? {
        name: String(data.topSupporter.name),
        votes:
          typeof data.topSupporter.votes === "number"
            ? data.topSupporter.votes
            : 0,
      }
    : null,
});
