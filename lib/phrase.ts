// Phrase Of The Night, as the venue wall sees it.
//
// The board only ever reads this — the auction is settled by a Cloud
// Function, and nothing here can change who holds the board.

export type ShowPhrase = {
  text: string;
  name: string;
  amountCents: number;
  uid: string;
  at: number;
  tipId: string;
};

const str = (v: unknown): string => (typeof v === "string" ? v : "");

// Defensive in the same way toShowGame is: this comes off a document the
// board does not own, and a malformed phrase must render as no phrase rather
// than as a crash on a screen nobody can reach to reload.
export const toShowPhrase = (raw: unknown): ShowPhrase | null => {
  if (!raw || typeof raw !== "object") return null;
  const p = raw as Record<string, unknown>;
  const text = str(p.text).trim();
  if (!text) return null;
  return {
    text,
    name: str(p.name) || "Someone",
    amountCents: typeof p.amountCents === "number" ? p.amountCents : 0,
    uid: str(p.uid),
    at: typeof p.at === "number" ? p.at : 0,
    tipId: str(p.tipId),
  };
};

export const dollars = (cents: number): string => {
  const whole = cents / 100;
  return Number.isInteger(whole) ? `$${whole}` : `$${whole.toFixed(2)}`;
};

// What identifies "a different phrase is up now". The tip id is the only
// value guaranteed unique per bid — two people can pay the same amount with
// the same name, and somebody can take their own board back with the same
// words.
export const phraseKey = (p?: ShowPhrase | null): string =>
  p ? p.tipId || `${p.uid}:${p.at}` : "";
