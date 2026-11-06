// lib/soundGovernor.ts
// Decides whether an audience sound may actually reach the PA.
//
// MIRRORS src/config/soundFx.ts + src/utils/soundGovernor.ts in the
// TellMeWhatToPlay client repo, where this logic is unit-tested. This repo has
// no test runner, so treat that suite as the spec: if you change a number
// here, change it there, and let its tests tell you what broke.
//
// The split between the two copies is not duplication for its own sake — the
// two sides enforce different halves of the same rules, because fans do not
// subscribe to the reaction feed and so a phone cannot see what anyone else
// fired:
//
//   the phone — each fan's own cooldowns, before the write.
//   the BOARD — this file. The one process that hears the whole room, so it
//               owns every shared clock, the density budget and per-show caps.
//               Authoritative: a phone cannot be trusted with a clock it
//               cannot see.

import type { SoundId } from "./soundFx";

// Sounds are filed by WHAT HAPPENS WHEN FORTY PEOPLE MASH THEM:
//
//   crowd    — mashing is the feature. Forty taps is a roaring room.
//   ambience — mashing produces a bed, already handled by one-at-a-time.
//   hit      — mashing is annoying. Punctuation wants space.
//   phrase   — mashing is a riot. Two spoken lines at once are neither.
//   heckle   — one voice, and that is the whole joke. "FREEBIRD!" works
//              because exactly one person shouted it into a quiet room.
//              Rarity and TIMING are the content, so it is gated to the gaps.
//
// Deliberately NOT the same axis as `bed`, which is playback mechanics.
// `large-crowd` is mechanically a bed and behaviourally crowd noise, and needs
// the bed's playback with the crowd's freedom.
export type SoundKind = "crowd" | "ambience" | "hit" | "phrase" | "heckle";

export const SOUND_KIND: Record<SoundId, SoundKind> = {
  applause: "crowd",
  cheers: "crowd",
  "large-crowd": "crowd",
  thunder: "hit",
  "fog-horn": "hit",
  "xmas-bells": "hit",
  explosion: "hit",
  shh: "hit",
  "we-love-you-landon": "phrase",
  "we-love-you-adrian": "phrase",
  "we-love-you-guys": "phrase",
  breeze: "ambience",
  surf: "ambience",
  "night-forest": "ambience",
  rain: "ambience",
  battle: "ambience",
  freebird: "heckle",
  boo: "heckle",
  // Never governed — only ever played forced. The reference tone because a
  // board that refused to prove it works would be useless; the game cues
  // because a cooldown that swallowed the fanfare would leave the room
  // staring at a winner's name in silence. The kind is carried only so the
  // operator panel can file them somewhere.
  test: "hit",
  fanfare: "hit",
  sparkle: "hit",
};

export type SoundWhen = "any" | "during" | "between";

// Tri-state. `null` means NOBODY KNOWS, and an unknown must never block — a
// gate that failed closed on a missing signal would silently empty the
// catalogue at every show where the artist plays from memory.
export type SoundPlaying = boolean | null;

export type SoundRule = {
  cooldownMs: number;
  scope: "user" | "room";
  when: SoundWhen;
  // A lifetime cap, not a rate: some sounds are a once-a-night gag. `null`
  // means uncapped, distinct from absent so a preset can LIFT a cap.
  maxPerShow?: number | null;
};

export const KIND_RULE: Record<SoundKind, SoundRule> = {
  crowd: { cooldownMs: 600, scope: "user", when: "any" },
  ambience: { cooldownMs: 8000, scope: "room", when: "any" },
  hit: { cooldownMs: 6000, scope: "room", when: "any" },
  phrase: { cooldownMs: 60000, scope: "room", when: "any", maxPerShow: 3 },
  // Still waits for a gap, but no longer treats every heckle as an insult.
  // Everybody shouts Freebird and nobody means it — a ritual the room is in
  // on, and one that can only happen twice is a tease. What keeps this civil
  // is the sender's name going up on the venue screen with it, which is a
  // test that runs on every press rather than twice a night.
  heckle: { cooldownMs: 45000, scope: "room", when: "between", maxPerShow: 6 },
};

// The density brake, and the rule per-sound cooldowns cannot express: twenty
// fans each firing a DIFFERENT phrase once breaks no per-sound rule and still
// sounds like a cartoon. One clock per kind, covering all its members.
// Zero means no budget — crowd noise is exempt by design.
export const ROOM_BUDGET_MS: Record<SoundKind, number> = {
  crowd: 0,
  ambience: 8000,
  hit: 2500,
  phrase: 20000,
  heckle: 25000,
};

// Per-show overrides, because the right amount of governance is a property of
// the room. The same catalogue serves a solo piano set where a fog horn would
// be vandalism and a dueling-pianos show where heckling IS the format.
export type SoundPresetId = "bar" | "listening-room" | "dueling-pianos";

export const SOUND_PRESETS: Record<
  SoundPresetId,
  {
    rule?: Partial<Record<SoundKind, Partial<SoundRule>>>;
    budget?: Partial<Record<SoundKind, number>>;
  }
> = {
  bar: {},
  "listening-room": {
    rule: {
      hit: { when: "between", cooldownMs: 20000 },
      phrase: { when: "between", maxPerShow: 2 },
      ambience: { when: "between" },
      heckle: { maxPerShow: 1 },
    },
    budget: { hit: 15000, phrase: 60000, heckle: 120000 },
  },
  "dueling-pianos": {
    rule: {
      hit: { cooldownMs: 2500 },
      phrase: { cooldownMs: 15000, maxPerShow: null },
      // The one room where shouting over the playing is the act rather than
      // an interruption, so the gap requirement comes off entirely.
      heckle: { when: "any", cooldownMs: 25000, maxPerShow: null },
    },
    budget: { hit: 1500, phrase: 6000, heckle: 12000 },
  },
};

export const DEFAULT_PRESET: SoundPresetId = "bar";

export const isSoundPresetId = (v: unknown): v is SoundPresetId =>
  typeof v === "string" &&
  Object.prototype.hasOwnProperty.call(SOUND_PRESETS, v);

// Per-sound overrides, applied last. A preset describes the room; these
// describe something true of the sound everywhere, which does not stop being
// true because the venue got loud.
const SOUND_RULE: Partial<Record<SoundId, Partial<SoundRule>>> = {
  // A room-wide "quiet down" only works if it is rare. Mashed, it IS the noise
  // it is asking for.
  shh: { maxPerShow: 2 },
  // Its takes run 12 to 15 seconds of decay. The `hit` default of 6s would
  // let the next explosion start while the last one is still falling, which
  // is mud rather than punctuation.
  explosion: { cooldownMs: 16000 },
};

export const ruleFor = (
  id: SoundId,
  preset: SoundPresetId = DEFAULT_PRESET
): SoundRule => {
  const kind = SOUND_KIND[id];
  return {
    ...KIND_RULE[kind],
    ...(SOUND_PRESETS[preset]?.rule?.[kind] ?? {}),
    ...(SOUND_RULE[id] ?? {}),
  };
};

export const budgetFor = (
  kind: SoundKind,
  preset: SoundPresetId = DEFAULT_PRESET
): number => SOUND_PRESETS[preset]?.budget?.[kind] ?? ROOM_BUDGET_MS[kind];

// --- Resolving "is a song playing right now?" -------------------------------
//
// The show doc already carries three signals, none built for this. Read them
// in order of how much they actually know:
//
//   1. The ARTIST'S OWN NAVIGATION (artistPlaying). Opening a song's lyrics
//      means they are playing it; backing out to the setlist means they are
//      between songs. The only signal that can say NO.
//   2. A FAN CONFIRMING the "Is your song playing?" prompt (playConfirm).
//   3. LYRICS PRESENCE: several fans on the same song's lyrics.
//
// Stale signals are ignored rather than trusted: all three are set-and-forget,
// so an artist who leaves the lyrics screen open and walks off stage would
// otherwise read as playing all night. The artist window is generous because a
// classical piece can run long, and cutting off mid-movement is worse than
// being slow to notice an empty stage.
export const ARTIST_SIGNAL_STALE_MS = 30 * 60 * 1000;
export const CONFIRM_FRESH_MS = 6 * 60 * 1000;
export const PRESENCE_FRESH_MS = 6 * 60 * 1000;
export const PRESENCE_MIN_FANS = 3;

export type ShowPlayingSignals = {
  artistPlaying?: { on: boolean; atMs: number } | null;
  playConfirmAtMs?: number | null;
  lyricsPresenceCount?: number | null;
};

export const resolvePlaying = (
  s: ShowPlayingSignals,
  nowMs: number
): SoundPlaying => {
  const artist = s.artistPlaying;
  if (artist && nowMs - artist.atMs < ARTIST_SIGNAL_STALE_MS) return artist.on;

  const confirmed = s.playConfirmAtMs ?? 0;
  if (confirmed && nowMs - confirmed < CONFIRM_FRESH_MS) return true;

  if ((s.lyricsPresenceCount ?? 0) >= PRESENCE_MIN_FANS) return true;

  return null;
};

export const whenAllows = (when: SoundWhen, playing: SoundPlaying): boolean => {
  if (when === "any" || playing === null) return true;
  return when === "during" ? playing : !playing;
};

// --- The governor -----------------------------------------------------------

export type SoundBlockReason = "cooldown" | "budget" | "spent" | "when";

export type SoundDecision =
  | { ok: true }
  | { ok: false; reason: SoundBlockReason; retryInMs: number };

const ALLOWED: SoundDecision = { ok: true };

export const createRoomGovernor = (preset: SoundPresetId = DEFAULT_PRESET) => {
  let active = preset;
  let lastById: Partial<Record<SoundId, number>> = {};
  let lastByKind: Partial<Record<SoundKind, number>> = {};
  let countById: Partial<Record<SoundId, number>> = {};

  const check = (
    id: SoundId,
    { nowMs, playing }: { nowMs: number; playing: SoundPlaying }
  ): SoundDecision => {
    const rule = ruleFor(id, active);
    const kind = SOUND_KIND[id];

    if (!whenAllows(rule.when, playing)) {
      // No retry time: this reopens when the show moves on, not on a clock.
      return { ok: false, reason: "when", retryInMs: 0 };
    }

    if (rule.maxPerShow != null && (countById[id] ?? 0) >= rule.maxPerShow) {
      return { ok: false, reason: "spent", retryInMs: 0 };
    }

    // Only shared clocks. A per-user cooldown was already enforced on the
    // phone that sent it, and tracking every fan here would buy nothing.
    if (rule.scope === "room" && rule.cooldownMs > 0) {
      const since = nowMs - (lastById[id] ?? -Infinity);
      if (since < rule.cooldownMs) {
        return {
          ok: false,
          reason: "cooldown",
          retryInMs: rule.cooldownMs - since,
        };
      }
    }

    const budget = budgetFor(kind, active);
    if (budget > 0) {
      const since = nowMs - (lastByKind[kind] ?? -Infinity);
      if (since < budget) {
        return { ok: false, reason: "budget", retryInMs: budget - since };
      }
    }

    return ALLOWED;
  };

  return {
    check,
    tryPlay: (
      id: SoundId,
      at: { nowMs: number; playing: SoundPlaying }
    ): SoundDecision => {
      const decision = check(id, at);
      if (!decision.ok) return decision;
      lastById[id] = at.nowMs;
      lastByKind[SOUND_KIND[id]] = at.nowMs;
      countById[id] = (countById[id] ?? 0) + 1;
      return decision;
    },
    setPreset: (next: SoundPresetId) => {
      active = next;
    },
    reset: () => {
      lastById = {};
      lastByKind = {};
      countById = {};
    },
  };
};

export type RoomGovernor = ReturnType<typeof createRoomGovernor>;
