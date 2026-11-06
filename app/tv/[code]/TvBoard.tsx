"use client";

import React, {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import {
  collection,
  doc,
  getDoc,
  limit,
  onSnapshot,
  orderBy,
  query,
} from "firebase/firestore";

import { db } from "@/lib/gcp/client";
import { Board, BoardSong, BoardTip, toBoard } from "@/lib/board";
import { GAME_LABEL, ShowGame, toShowGame } from "@/lib/game";
import {
  createSoundBoard,
  isFanSoundId,
  SOUND_LIST,
  SoundBoard,
  SoundId,
} from "@/lib/soundFx";
import {
  BRIGHT_VISUALS,
  VISUAL_GAP_MS,
  VISUAL_MS,
  visualFor,
  type VisualKind,
} from "@/lib/soundVisuals";
import {
  DEFAULT_PRESET,
  SOUND_KIND,
  type SoundKind,
  isSoundPresetId,
  PRESENCE_FRESH_MS,
  resolvePlaying,
  type SoundPlaying,
  type SoundPresetId,
} from "@/lib/soundGovernor";

// Firestore Timestamp -> millis, tolerating a pending local write (no server
// timestamp yet) and a doc written by an older version of the app.
const tsToMs = (v: unknown): number => {
  const ms = (v as { toMillis?: () => number })?.toMillis?.();
  return typeof ms === "number" ? ms : 0;
};

// How many fans are sitting on the SAME song's lyrics, taking the most
// populated song rather than the total: five fans spread over five songs is
// five people browsing, not a room listening to one thing.
const samePageFans = (presence: unknown, nowMs: number): number => {
  if (!presence || typeof presence !== "object") return 0;
  const bySong: Record<string, number> = {};
  Object.values(presence as Record<string, any>).forEach((entry) => {
    const songId = entry?.songId;
    if (!songId) return;
    const at = tsToMs(entry?.at);
    if (!at || nowMs - at > PRESENCE_FRESH_MS) return;
    bySong[songId] = (bySong[songId] ?? 0) + 1;
  });
  const counts = Object.values(bySong);
  return counts.length ? Math.max(...counts) : 0;
};

interface TvBoardProps {
  code: string;
  displayCode: string;
  initial: Board;
  qrSvg: string;
}

// Everything is sized in vw so one layout fills a 32" bar TV and a 75" wall
// screen alike, with clamp() keeping it sane if someone opens it on a laptop.

const STEPS = ["Scan the code", "Request a song", "Watch it climb"];

// Fixed, not random: the page is server-rendered, and a random list would
// differ between the server HTML and hydration.
interface Flyer {
  key: string;
  emoji: string;
  size: number;
  left: number;
  drift: number;
  duration: number;
}

const CONFETTI_COLORS = ["#ffd000", "#f33274", "#35e8b4", "#8a6fe0", "#ffffff"];

// One piece takes CONFETTI_FALL_S to cross the screen. Launches are spread
// across that same window, so by the time the first piece reaches the bottom
// the top is still emitting — the screen is full top to bottom, and the whole
// burst runs for two screenfuls (fall + emission) before it clears.
const CONFETTI_FALL_S = 2.6;
const CONFETTI_COUNT = 120;
const CONFETTI_TOTAL_MS = (CONFETTI_FALL_S * 2 + 0.4) * 1000;

// Celebrations stay clear of the right-hand panel. The QR is the whole point
// of the screen, and a scan that fails because a confetti square or an emoji
// was sitting on the code costs an install at the exact moment someone
// decided to get the app.
const CELEBRATION_MAX_LEFT = 66;

// Below this many votes on the leader, the board shows the race but not the
// numbers. The same reasoning as the money total further down: a tally in
// six-inch type is social proof once it is large and an announcement that the
// room is empty while it is small, and early in the night it is always small.
// The bar behind each row already carries who is winning and by how much,
// which is the part that works at any size. Gated on the LEADER's count, not
// each song's, so the numbers arrive together rather than popping in one row
// at a time, and so the sidebar total never contradicts the rows.
const VOTE_DISPLAY_FLOOR = 10;

// How long a heckle's credit stays on screen. Long enough to read from the
// back of a room, short enough to be gone before the next one lands.
const HECKLE_CALLOUT_MS = 4500;

// How long the winner takeover holds before dropping back to the panel. Long
// enough for a room to look up, find the name and react to it.
const GAME_FANFARE_MS = 7000;

// Rain, built once at module load the way the confetti is. Irregular by
// construction — a sheet where every streak shares a duration pulses in step
// and reads as a screensaver rather than weather.
// The title arriving one character at a time. Spaces carry no sparkle and
// no delay of their own — a gap that twinkles reads as a letter you missed.
const RevealedTitle: React.FC<{ text: string }> = ({ text }) => (
  <span aria-label={text}>
    {Array.from(text).map((ch, i) => (
      <span
        key={`${i}-${ch}`}
        className="tv-reveal-char relative"
        style={{ animationDelay: `${i * 0.07}s` }}
      >
        {ch}
        {ch.trim() !== "" && (
          <span
            className="tv-reveal-spark"
            style={{ animationDelay: `${i * 0.07}s` }}
          />
        )}
      </span>
    ))}
  </span>
);

const RAINDROP_COUNT = 90;
const RAINDROPS = Array.from({ length: RAINDROP_COUNT }, (_, i) => ({
  left: (i * 37.31) % 100,
  length: 6 + ((i * 13) % 7),
  delay: ((i * 29) % 100) / 100 * 1.1,
  duration: 0.75 + ((i * 7) % 5) * 0.12,
  opacity: 0.35 + ((i * 11) % 4) * 0.12,
}));

// A name off a client write, so it is clamped and stripped before it goes on
// a screen the whole venue can see. Matches HECKLE_NAME_MAX in the app.
const HECKLE_NAME_MAX = 18;
const cleanHeckleName = (raw: unknown): string =>
  typeof raw === "string"
    ? raw.replace(/\s+/g, " ").trim().slice(0, HECKLE_NAME_MAX)
    : "";

// How the preview panel is ordered and labelled. Mirrors KIND_GROUPS in the
// client's src/config/soundFx.ts so the engineer at the desk and the fan on
// the phone are reading the same catalogue in the same order — the desk has
// to be able to answer "where's the one they just pressed?" without
// translating between two layouts.
const PANEL_GROUPS: { kind: SoundKind; title: string }[] = [
  { kind: "crowd", title: "Crowd" },
  { kind: "hit", title: "Hits" },
  { kind: "heckle", title: "Hecklers" },
  { kind: "phrase", title: "Chants" },
  { kind: "ambience", title: "Ambience" },
];

const CONFETTI = Array.from({ length: CONFETTI_COUNT }, (_, i) => ({
  // Golden-ratio stride scatters the columns instead of banding them, which
  // a simple (i * k) % 100 does as soon as k divides evenly into 100.
  // Full width, unlike the flyers. Confetti only ever falls during a tip,
  // and the tip splash already dims and blurs the whole screen — nobody is
  // scanning the QR for those seven seconds either way, so keeping the right
  // third bare just made the celebration look lopsided.
  left: (i * 61.803) % 100,
  size: 0.8 + ((i * 7) % 6) * 0.22,
  color: CONFETTI_COLORS[i % CONFETTI_COLORS.length],
  delay: (i / CONFETTI_COUNT) * CONFETTI_FALL_S,
  duration: CONFETTI_FALL_S + ((i * 5) % 7) * 0.12,
}));

const TvBoard: React.FC<TvBoardProps> = ({
  code,
  displayCode,
  initial,
  qrSvg,
}) => {
  const [board, setBoard] = useState<Board>(initial);
  const [offline, setOffline] = useState(false);

  // Votes land in publicBoards/{code} via Cloud Functions, so the screen
  // follows the room without polling.
  useEffect(() => {
    const ref = doc(db, "publicBoards", code);
    let unsubscribe: (() => void) | null = null;
    let retry: ReturnType<typeof setTimeout> | null = null;
    let attempt = 0;
    let stopped = false;

    const apply = (data: Record<string, unknown> | undefined) => {
      // A missing doc means the artist rotated their code; keep showing the
      // last standings rather than blanking the screen mid-set.
      if (data) setBoard(toBoard(data));
    };

    // onSnapshot's error callback is terminal — the listener is torn down and
    // never retries itself. Without this the board would freeze for the rest
    // of the night on one transient network blip, which is exactly the
    // conditions a venue provides.
    const subscribe = () => {
      if (stopped) return;
      unsubscribe = onSnapshot(
        ref,
        (snap) => {
          attempt = 0;
          setOffline(false);
          apply(snap.data());
        },
        () => {
          setOffline(true);
          unsubscribe = null;
          attempt += 1;
          const delay = Math.min(1000 * 2 ** (attempt - 1), 30000);
          retry = setTimeout(subscribe, delay);
        }
      );
    };
    subscribe();

    // Backstop. The stream can stall without ever erroring — a proxy holding
    // the connection open sends nothing and reports nothing — so a cheap
    // periodic read guarantees the screen is never more than ~15s stale. One
    // small doc, four reads a minute, per screen.
    const poll = setInterval(() => {
      getDoc(ref)
        .then((snap) => {
          setOffline(false);
          apply(snap.data());
        })
        .catch(() => setOffline(true));
    }, 15000);

    return () => {
      stopped = true;
      clearInterval(poll);
      if (retry) clearTimeout(retry);
      if (unsubscribe) unsubscribe();
    };
  }, [code]);

  // A board that goes black halfway through the first set is useless. Not all
  // browsers allow this, and nothing can stop the TV's own sleep timer, but
  // it covers the common case of a laptop casting to the screen.
  useEffect(() => {
    let lock: { release: () => Promise<void> } | null = null;
    const request = async () => {
      try {
        const nav = navigator as Navigator & {
          wakeLock?: { request: (type: "screen") => Promise<typeof lock> };
        };
        if (nav.wakeLock) lock = await nav.wakeLock.request("screen");
      } catch {
        // Unsupported or refused — the screen may sleep on its own schedule.
      }
    };
    request();
    const reacquire = () => {
      if (document.visibilityState === "visible") request();
    };
    document.addEventListener("visibilitychange", reacquire);
    return () => {
      document.removeEventListener("visibilitychange", reacquire);
      lock?.release().catch(() => {});
    };
  }, []);

  const topVotes = useMemo(
    () => board.songs.reduce((max, song) => Math.max(max, song.votes), 0),
    [board.songs]
  );

  const showCounts = topVotes >= VOTE_DISPLAY_FLOOR;

  // Fanfare. In the app, a fan's pick reaching #1 fires confetti once per
  // climb — never on mount. The room equivalent is a song breaking into the
  // Top 5 at all, since the screen cannot know whose pick it was.
  //
  // The seen-set starts as whatever was already on screen at first paint, so
  // a board opened mid-set does not celebrate five songs at once.
  const seenRef = useRef<Set<string> | null>(null);
  const [entrant, setEntrant] = useState<BoardSong | null>(null);

  // A tip outranks a Top-5 entry: it is the rarer, louder moment, and the one
  // the room is being invited to copy.
  const lastTipRef = useRef<string | null>(null);
  // Primed-ness has to be its own flag. Using "lastTipRef is still null" as
  // the first-paint test swallowed the FIRST tip of the night on a board that
  // opened with none — which is the case that matters most.
  const tipPrimedRef = useRef(false);
  const [tip, setTip] = useState<BoardTip | null>(null);
  const [confetti, setConfetti] = useState(false);
  // The running game. Its own subscription rather than riding the sound one,
  // because that listener only exists on a board opened with ?fx=1 — the
  // desk's copy — and the game has to appear on every screen in the venue.
  const [game, setGame] = useState<ShowGame | null>(null);
  // Fires once when a winner first appears, so the takeover is an EVENT
  // rather than a state the screen sits in.
  const [gameFanfare, setGameFanfare] = useState<string | null>(null);
  const lastWinnerRef = useRef<string | null>(null);
  // Primed-ness has to be its own flag, exactly as the tip banner learned:
  // using "lastWinnerRef is still null" as the first-paint test cannot tell
  // a winner that just landed from one that was already there when the board
  // opened.
  const gamePrimedRef = useRef(false);
  const fanfareTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    const current = board.recentTip;
    // Prime on first paint so a board opened mid-set does not replay the last
    // tip of the night as if it had just landed.
    if (!tipPrimedRef.current) {
      tipPrimedRef.current = true;
      lastTipRef.current = current?.id ?? null;
      return;
    }
    if (!current || current.id === lastTipRef.current) return;
    lastTipRef.current = current.id;
    setTip(current);
    setConfetti(true);
    const hideConfetti = setTimeout(() => setConfetti(false), CONFETTI_TOTAL_MS);
    const hideBanner = setTimeout(() => setTip(null), 8000);
    return () => {
      clearTimeout(hideConfetti);
      clearTimeout(hideBanner);
    };
  }, [board.recentTip]);

  // Audience sound effects, DARK unless the URL asks for them (?fx=1).
  //
  // The board's audio can be patched into the PA, so arming it is a decision
  // someone makes for a moment on a particular night — not something every
  // board in the country inherits because this file shipped. The artist-facing
  // control and the per-sound picks come next; this is the mechanism, landed
  // behind a flag, the same way the region gate went in.
  const [fxOn, setFxOn] = useState(false);
  const [soundReady, setSoundReady] = useState(false);
  const soundRef = useRef<SoundBoard | null>(null);
  // Surfaced for tests: a sound leaves no trace on the screen, so without this
  // the only way to check one fired is to listen to it.
  const fxSeqRef = useRef(0);
  const [lastFx, setLastFx] = useState("none");

  useEffect(() => {
    if (new URLSearchParams(window.location.search).get("fx") !== "1") return;
    setFxOn(true);
    const sounds = createSoundBoard();
    soundRef.current = sounds;
    // Try without a gesture first. A kiosk-mode or autoplay-allowed browser
    // lets this through, and then the venue never sees a prompt at all.
    let mounted = true;
    sounds.unlock().then((ok) => {
      if (mounted) setSoundReady(ok);
    });
    return () => {
      mounted = false;
      // Only surrender the ref if it still points at THIS board. React runs
      // this effect twice in development, and an older instance's cleanup
      // landing after the newer one has claimed the ref would blank it —
      // leaving a board that reports itself armed while every play() call
      // quietly no-ops through the optional chain.
      if (soundRef.current === sounds) soundRef.current = null;
      sounds.close();
    };
  }, []);

  const enableSound = useCallback(() => {
    const sounds = soundRef.current;
    if (!sounds) return;
    sounds.unlock().then((ok) => {
      setSoundReady(ok);
      // Immediate proof it works, and it doubles as the level-setting tone.
      if (ok) sounds.play("test", { force: true });
    });
  }, []);

  // Raise the picture for a sound that just played.
  //
  // Throttled separately from the audio governor, because the two are judging
  // different things: the governor decides what a room can stand HEARING, and
  // a sound that is fine to hear twice in a second is not necessarily fine to
  // SEE twice in a second. The bright ones share one clock so a thunder and
  // an explosion back to back read as two events rather than a glitch.
  const raiseVisual = useCallback((kind: VisualKind) => {
    const now = Date.now();
    const bright = BRIGHT_VISUALS.has(kind);
    const since = now - (bright ? lastBrightAt.current : lastVisualAt.current[kind] ?? 0);
    if (since < VISUAL_GAP_MS[kind]) return;
    if (bright) lastBrightAt.current = now;
    lastVisualAt.current[kind] = now;

    if (kind === "confetti") {
      // Shares the tip's confetti rather than running a second layer of it.
      setConfetti(true);
      if (visualTimer.current) clearTimeout(visualTimer.current);
      visualTimer.current = setTimeout(
        () => setConfetti(false),
        VISUAL_MS.confetti
      );
      return;
    }

    visualSeq.current += 1;
    setVisual({ kind, key: visualSeq.current });
    if (visualTimer.current) clearTimeout(visualTimer.current);
    visualTimer.current = setTimeout(() => setVisual(null), VISUAL_MS[kind]);
  }, []);

  const audition = useCallback((id: SoundId) => {
    soundRef.current?.play(id, { force: true });
    // The panel previews the picture as well as the sound. Checking one
    // without the other is how you find out at the gig that the sleigh never
    // worked.
    const kind = visualFor(id);
    if (kind) raiseVisual(kind);
  }, []);

  // The artist's kill switch, read straight off the show doc — the same
  // anonymous read the reactions use, so it needs no Cloud Function and takes
  // effect the moment they hit it rather than on the next vote.
  //
  // Absent means allowed: patching this board into the PA was already a
  // deliberate act, so this is the switch to slam, not a second setup step.
  // A refused listener therefore leaves the sounds ON, which is the honest
  // default — the artist can see the badge and hit mute, whereas silently
  // disarming would leave them pressing a button that does nothing.
  //
  // Mirrored into a ref so the play path can check it without this listener
  // re-rendering the board.
  const fxAllowedRef = useRef(true);
  const [fxAllowed, setFxAllowed] = useState(true);
  // Is a song playing? Read from the same doc, resolved from the three signals
  // it already carries (the artist's own navigation, a fan confirming the "is
  // your song playing?" prompt, and a crowd sitting on one song's lyrics).
  // A ref because the play path must read it without re-rendering the board.
  const fxPlayingRef = useRef<SoundPlaying>(null);
  const [fxPreset, setFxPreset] = useState<SoundPresetId>(DEFAULT_PRESET);

  // Ending the round retires the takeover immediately. An artist who wins
  // it themselves and ends it two seconds later would otherwise watch the
  // reveal happen behind a blur.
  useEffect(() => {
    if (game?.status !== "closed") return;
    if (fanfareTimer.current) clearTimeout(fanfareTimer.current);
    setGameFanfare(null);
  }, [game?.status]);

  useEffect(() => {
    if (!board.artistId || !board.showId) return;
    const unsub = onSnapshot(
      doc(db, "artists", board.artistId, "shows", board.showId),
      (snap) => setGame(toShowGame((snap.data() ?? {}).game)),
      () => {
        // Cosmetic, like the reactions listener: a refused read must not take
        // the board down. No game simply means no game.
      }
    );
    return unsub;
  }, [board.artistId, board.showId]);

  // The winner takeover, raised once per round — and only for a win that
  // happens while this board is watching.
  //
  // Without priming, a screen opened (or reloaded) into a round that had
  // already been won fired the fanfare on first paint, which dimmed and
  // blurred the whole board. On a closed round that meant the takeover sat
  // on top of the revealed title: the one thing the artist had just chosen
  // to show the room was the one thing it hid.
  useEffect(() => {
    const key = game?.winner ? `${game.id}:${game.winner.uid}` : null;
    if (!gamePrimedRef.current) {
      gamePrimedRef.current = true;
      lastWinnerRef.current = key;
      return;
    }
    if (!key || key === lastWinnerRef.current) return;
    lastWinnerRef.current = key;
    // Nothing to celebrate on a round that is already over. The reveal is
    // the moment now, and it must not be covered.
    if (game?.status === "closed") return;
    setGameFanfare(key);
    setConfetti(true);
    if (fanfareTimer.current) clearTimeout(fanfareTimer.current);
    fanfareTimer.current = setTimeout(() => {
      setGameFanfare(null);
      setConfetti(false);
    }, GAME_FANFARE_MS);
  }, [game?.id, game?.winner]);

  useEffect(() => {
    if (!fxOn || !board.artistId || !board.showId) return;
    const unsub = onSnapshot(
      doc(db, "artists", board.artistId, "shows", board.showId),
      (snap) => {
        const data = snap.data() ?? {};
        const allowed = data.soundFx !== false;
        fxAllowedRef.current = allowed;
        setFxAllowed(allowed);
        setFxPreset(
          isSoundPresetId(data.soundFxPreset) ? data.soundFxPreset : DEFAULT_PRESET
        );
        const nowMs = Date.now();
        const atMs = tsToMs(data.artistPlaying?.at);
        fxPlayingRef.current = resolvePlaying(
          {
            // A pending local write has no server timestamp yet, which would
            // read as 1970 and go instantly stale. Ignore it and wait for the
            // server's own value.
            artistPlaying: atMs
              ? { on: data.artistPlaying?.on === true, atMs }
              : null,
            playConfirmAtMs: tsToMs(data.playConfirm?.at),
            lyricsPresenceCount: samePageFans(data.lyricsPresence, nowMs),
          },
          nowMs
        );
      },
      () => {
        // Cosmetic listener for a safety control: never take the board down,
        // and never imply a mute that was not asked for.
      }
    );
    return () => unsub();
  }, [fxOn, board.artistId, board.showId]);

  useEffect(() => {
    soundRef.current?.setPreset(fxPreset);
  }, [fxPreset]);

  // Flying reactions, mirroring the app's ReactionOverlay. Read straight from
  // artists/{id}/shows/{id}/reactions rather than through publicBoards: they
  // are ephemeral, high-frequency and cosmetic, and routing each one through
  // a Cloud Function would add seconds to something whose whole point is that
  // it lands the moment a fan taps. Anonymous reads of an active artist's
  // reactions are already permitted by firestore.rules.
  const [flyers, setFlyers] = useState<Flyer[]>([]);
  const flyerSeq = useRef(0);
  // Who just heckled, credited on screen. The whole point of the kind: a
  // chant is the room agreeing and belongs to nobody, a heckle is one person
  // and the name is what makes it funny rather than a soundboard going off.
  const [callout, setCallout] = useState<{
    label: string;
    name: string;
    key: number;
  } | null>(null);
  const calloutTimer = useRef<ReturnType<typeof setTimeout> | null>(null);


  // The picture riding the current sound. One at a time: two full-screen
  // effects at once is noise, and the newest is always the one the room just
  // heard.
  const [visual, setVisual] = useState<{ kind: VisualKind; key: number } | null>(
    null
  );
  const visualTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const visualSeq = useRef(0);
  const lastVisualAt = useRef<Partial<Record<VisualKind, number>>>({});
  // One clock for every bright effect, not one each — see BRIGHT_VISUALS.
  const lastBrightAt = useRef(0);

  useEffect(() => {
    if (!board.artistId || !board.showId) return;
    const mountMs = Date.now();
    const q = query(
      collection(
        db,
        "artists",
        board.artistId,
        "shows",
        board.showId,
        "reactions"
      ),
      orderBy("createdAt", "desc"),
      limit(30)
    );
    const unsub = onSnapshot(
      q,
      (snap) => {
        const fresh: Flyer[] = [];
        let playedFx: SoundId | null = null;
        snap.docChanges().forEach((change) => {
          if (change.type !== "added") return;
          const data = change.doc.data() as Record<string, any>;
          // Skip the history the query returns on mount, and writes whose
          // server timestamp has not resolved yet.
          const atMs = data?.createdAt?.toMillis?.() ?? 0;
          if (!atMs || atMs < mountMs) return;
          flyerSeq.current += 1;
          const seq = flyerSeq.current;
          const isTip = typeof data.amount === "number" && data.amount > 0;

          // Sound rides the same change the flyer does, and costs nothing
          // extra to reach: no new listener, no new write, no Cloud Function.
          // play() returns false when the global cooldown swallows it, which
          // in a busy room is the common case and not an error.
          // Only a sound the fan PICKED. Emotes used to map onto sounds as a
          // fallback, which quietly handed the PA to a bar built for a
          // mashing thumb — somebody tapping a heart was not asking the room
          // to hear a fog horn. Validated rather than trusted, because this
          // value comes off a client write.
          const fx: SoundId | undefined = isFanSoundId(data.sound)
            ? data.sound
            : undefined;
          if (
            fx &&
            fxAllowedRef.current &&
            soundRef.current?.play(fx, { playing: fxPlayingRef.current })
          ) {
            playedFx = fx;
            // Credit only what actually reached the room. A governed drop
            // puts no sound in the air, and a name on screen with silence
            // behind it reads as a bug.
            const kind = visualFor(fx);
            if (kind) raiseVisual(kind);

            const who = cleanHeckleName(data.heckleName);
            if (who && SOUND_KIND[fx] === "heckle") {
              const label =
                SOUND_LIST.find((entry) => entry.id === fx)?.label ?? "";
              setCallout({ label, name: who, key: flyerSeq.current });
              if (calloutTimer.current) clearTimeout(calloutTimer.current);
              calloutTimer.current = setTimeout(
                () => setCallout(null),
                HECKLE_CALLOUT_MS
              );
            }
          }
          fresh.push({
            key: `${change.doc.id}-${seq}`,
            emoji: String(data.emoji || "😄"),
            // Tips fly bigger, as they do in the app.
            size: isTip ? 7 + Math.min(Number(data.amount), 20) * 0.25 : 5.5,
            left: 4 + ((seq * 61.803) % (CELEBRATION_MAX_LEFT - 8)),
            drift: ((seq * 37) % 14) - 7,
            duration: 3 + ((seq * 11) % 10) * 0.15,
          });
        });
        if (playedFx) {
          fxSeqRef.current += 1;
          setLastFx(`${playedFx}:${fxSeqRef.current}`);
        }
        if (!fresh.length) return;
        setFlyers((prev) => [...prev, ...fresh].slice(-40));
      },
      () => {
        // Cosmetic: a refused or dropped listener must never take the board
        // down with it.
      }
    );
    return () => unsub();
  }, [board.artistId, board.showId]);

  useEffect(() => {
    const ids = board.songs.map((song) => song.songId);
    if (seenRef.current === null) {
      seenRef.current = new Set(ids);
      return;
    }
    const fresh = board.songs.find((song) => !seenRef.current!.has(song.songId));
    seenRef.current = new Set(ids);
    if (!fresh) return;
    setEntrant(fresh);
    const timer = setTimeout(() => setEntrant(null), 6000);
    return () => clearTimeout(timer);
  }, [board.songs]);

  const subtitle = [board.venueName, board.showTitle]
    .filter(Boolean)
    .join(" · ");

  return (
    <main
      /* Surfaced for tests: the celebration is a 6s window that is awkward to
         catch by scraping text, and these make it observable. */
      data-entrant={entrant?.songId ?? "none"}
      data-tip={tip?.id ?? "none"}
      data-songs={board.songs.map((x) => x.songId).join(",")}
      data-counts={showCounts ? "shown" : "hidden"}
      data-sound={
        fxOn ? (soundReady ? (fxAllowed ? "armed" : "muted") : "locked") : "off"
      }
      data-sound-last={lastFx}
      className="flex h-screen w-screen flex-row justify-start overflow-hidden bg-bg-dark text-white"
    >
      <div className="flex min-w-0 flex-1 flex-col p-[3.2vw] pr-0">
        <header className="flex items-baseline gap-[1.6vw]">
          {board.live && (
            <span className="flex shrink-0 items-center gap-[0.6vw] rounded-full bg-rose px-[1.2vw] py-[0.4vw] text-[clamp(0.6rem,1.1vw,1.5rem)] font-bold uppercase tracking-[0.2em] leading-none">
              <span className="size-[0.7vw] animate-pulse rounded-full bg-white" />
              Live
            </span>
          )}
          <h1 className="min-w-0 truncate text-[clamp(1.75rem,4.6vw,6rem)] font-bold uppercase leading-none">
            {board.artistName}
          </h1>
        </header>

        {subtitle && (
          <p className="mt-[0.8vw] truncate text-[clamp(0.8rem,1.7vw,2.25rem)] leading-tight text-cyan">
            {subtitle}
          </p>
        )}

        {game ? (
          /* A round replaces the STANDINGS, not the whole screen.
             Vote positions are irrelevant for the next minute, but the join
             QR on the right is more important than it has ever been — a game
             is the one thing on this board that makes somebody who is not
             playing want the app. Blurring it out behind a takeover would
             throw away the moment it exists to create. */
          <div className="mt-[1.6vw] flex min-h-0 flex-1 flex-col justify-center">
            <p className="text-[clamp(0.7rem,1.3vw,1.75rem)] font-bold uppercase leading-none tracking-[0.3em] text-lime">
              🎵 {GAME_LABEL[game.type] ?? "Game"}
            </p>

            {game.status === "open" && (
              <>
                <p className="mt-[1.2vw] text-[clamp(1.1rem,3vw,4.2rem)] font-bold leading-none text-white">
                  What&apos;s playing?
                </p>

                {/* The shape of the answer, all round. Letters knocked out,
                    so this is safe on a wall — and the counts are a hint
                    rather than a leak, which is what gives the half of the
                    room that will never win something to argue about. */}
                {!!game.maskedSong && (
                  <p className="tv-mask mt-[1.4vw] break-words font-bold leading-none tracking-[0.12em] text-lime text-[clamp(1.6rem,5vw,7rem)]">
                    {game.maskedSong}
                  </p>
                )}

                {/* Winners are posted by NAME only. Nobody learns the song
                    from somebody else winning it — the title waits for the
                    artist to let it go. */}
                {game.winner ? (
                  <>
                    <p className="mt-[1.6vw] text-[clamp(0.8rem,1.6vw,2.1rem)] font-bold uppercase tracking-[0.2em] text-cyan">
                      Got it first
                    </p>
                    <p className="mt-[0.4vw] break-words text-[clamp(1.4rem,4vw,5.5rem)] font-bold leading-none text-lime">
                      {game.winner.name}
                      {game.winner.artistBonus ? " ★" : ""}
                    </p>
                    <p className="mt-[0.8vw] text-[clamp(0.8rem,1.6vw,2.1rem)] leading-tight text-cyan">
                      Still open — get on the board.
                    </p>
                  </>
                ) : (
                  <p className="mt-[1.2vw] text-[clamp(0.8rem,1.7vw,2.3rem)] leading-tight text-cyan">
                    First to name it wins. Get the artist too for a bonus.
                  </p>
                )}
              </>
            )}

            {game.status === "closed" && (
              <>
                {!!game.revealedSong && (
                  <p className="mt-[1.2vw] break-words text-[clamp(1.4rem,4.2vw,6rem)] font-bold leading-none text-white">
                    <RevealedTitle text={game.revealedSong} />
                  </p>
                )}
                {!!game.revealedArtist && (
                  <p className="mt-[0.5vw] text-[clamp(0.9rem,2vw,2.6rem)] leading-tight text-cyan">
                    {game.revealedArtist}
                  </p>
                )}
                {game.winner ? (
                  <p className="mt-[1.4vw] text-[clamp(1rem,2.4vw,3.2rem)] font-bold leading-tight text-lime">
                    {game.winner.name}
                    {game.winner.artistBonus ? " ★" : ""}
                  </p>
                ) : (
                  <p className="mt-[1.4vw] text-[clamp(1rem,2.2vw,2.8rem)] leading-tight text-cyan">
                    Nobody got that one.
                  </p>
                )}
              </>
            )}

            {/* Right but not first. The point of putting them up is that
                most of the room is in this bucket, and a near miss with your
                name on it is a reason to play the next one. */}
            {(game.alsoCorrect?.length ?? 0) > 0 && (
              <div className="mt-[1.6vw]">
                <p className="text-[clamp(0.6rem,1.1vw,1.4rem)] font-bold uppercase tracking-[0.25em] text-cyan/60">
                  Also got it
                </p>
                <p className="mt-[0.5vw] text-[clamp(0.8rem,1.6vw,2.1rem)] leading-snug text-white/80">
                  {game.alsoCorrect!.map((p) => p.name).join(" · ")}
                </p>
              </div>
            )}
          </div>
        ) : (
          <>
        {board.songs.length > 0 && (
          <p className="mt-[1.6vw] text-[clamp(0.7rem,1.3vw,1.75rem)] font-bold uppercase leading-none tracking-[0.25em] text-cyan">
            🔥 Crowd Favorites
          </p>
        )}

        <div className="mt-[1.2vw] min-h-0 flex-1">
          {board.songs.length > 0 ? (
            <ol className="flex h-full flex-col gap-[0.9vw]">
              {board.songs.map((song, index) => (
                <li
                  key={song.songId}
                  className={`relative flex min-h-0 flex-1 items-center gap-[1.4vw] overflow-hidden rounded-[0.6vw] px-[1.4vw] transition-colors duration-500 ${
                    entrant?.songId === song.songId
                      ? "bg-lime/25 ring-[0.2vw] ring-lime"
                      : "bg-light-dark/40"
                  }`}
                >
                  {/* Share of the leader's votes, as a bar behind the row. */}
                  <span
                    aria-hidden
                    className="absolute inset-y-0 left-0 bg-rose/30 transition-[width] duration-700 ease-out"
                    style={{
                      width: topVotes
                        ? `${Math.round((song.votes / topVotes) * 100)}%`
                        : "0%",
                    }}
                  />
                  <span
                    className={`relative flex size-[3.2vw] shrink-0 items-center justify-center rounded-full text-[clamp(0.9rem,1.9vw,2.5rem)] font-bold leading-none ${
                      index === 0
                        ? "bg-[#ffd000] text-bg-dark"
                        : "bg-[#8a6fe0] text-white"
                    }`}
                  >
                    {index + 1}
                  </span>
                  <span className="relative min-w-0 flex-1">
                    <span className="block truncate text-[clamp(1rem,2.4vw,3.25rem)] font-bold leading-tight">
                      {song.title}
                    </span>
                    {song.artist && (
                      <span className="block truncate text-[clamp(0.65rem,1.2vw,1.6rem)] leading-tight text-cyan">
                        {song.artist}
                      </span>
                    )}
                  </span>
                  {showCounts && (
                    <span className="relative shrink-0 text-[clamp(1.1rem,2.8vw,3.75rem)] font-bold leading-none text-lime tabular-nums">
                      {song.votes}
                    </span>
                  )}
                </li>
              ))}
            </ol>
          ) : (
            <div className="flex h-full flex-col justify-center">
              <p className="text-[clamp(1.25rem,3.9vw,5rem)] font-bold leading-[1.05]">
                {board.live
                  ? "Be first — pick the opening song."
                  : "No live show right now."}
              </p>
              <p className="mt-[1.2vw] text-[clamp(0.85rem,1.8vw,2.4rem)] leading-tight text-cyan">
                {board.live
                  ? "Scan the code, request a song, and watch the room vote it up."
                  : "Get the app and catch the next one."}
              </p>

              {/* Before the first vote there is nothing to rank, so the space
                  goes to explaining the mechanic — most of the room has never
                  been asked to choose the setlist before. */}
              {board.live && (
                <ol className="mt-[3.4vw] flex flex-wrap gap-x-[2.4vw] gap-y-[1.2vw]">
                  {STEPS.map((step, index) => (
                    <li key={step} className="flex items-center gap-[0.9vw]">
                      <span className="flex size-[2.7vw] shrink-0 items-center justify-center rounded-full bg-rose text-[clamp(0.65rem,1.3vw,1.75rem)] font-bold leading-none">
                        {index + 1}
                      </span>
                      <span className="text-[clamp(0.7rem,1.45vw,1.95rem)] font-bold leading-tight">
                        {step}
                      </span>
                    </li>
                  ))}
                </ol>
              )}
            </div>
          )}
        </div>
          </>
        )}
      </div>

      {/* The invitation. Everything here is aimed at someone glancing up from
          a table across the room: the wordmark so they know what they are
          being asked to join, the promise, then the code to act on it. */}
      <aside className="flex w-[29%] shrink-0 flex-col items-center justify-center gap-[1vw] p-[2.6vw] pl-[1.6vw]">
        {/* eslint-disable-next-line @next/next/no-img-element -- images are
            unoptimized in next.config, so next/image buys nothing here. */}
        <img
          src="/img/tmwtp-logo.png"
          alt="Tell Me What To Play"
          className="w-[62%] shrink-0 object-contain"
        />

        <p className="text-center text-[clamp(0.75rem,1.6vw,2.1rem)] font-bold uppercase leading-tight tracking-[0.05em] text-lime">
          You pick the next song
        </p>

        <div
          className="w-[88%] rounded-[1vw] bg-white p-[1vw]"
          /* Trusted input: generated server-side by qrcode-svg from a URL we
             build ourselves, never from Firestore content. */
          dangerouslySetInnerHTML={{ __html: qrSvg }}
        />

        <p className="text-center text-[clamp(0.9rem,1.9vw,2.5rem)] font-bold uppercase leading-tight">
          Scan to join in
        </p>
        <p className="text-center text-[clamp(0.65rem,1.2vw,1.6rem)] leading-tight text-cyan">
          Request songs, react and tip the band — live.
        </p>
        {showCounts && board.totalVotes > 0 && (
          <p className="text-center text-[clamp(0.65rem,1.2vw,1.6rem)] font-bold leading-tight text-lime">
            {board.totalVotes} vote{board.totalVotes === 1 ? "" : "s"} tonight
          </p>
        )}

        {/* Status that lasts the night, rather than six seconds. In votes,
            not dollars: a running money total turns the wall into a
            fundraising thermometer and makes a quiet night look like a
            failure in public. */}
        {board.topSupporter && (
          <p className="text-center text-[clamp(0.6rem,1.1vw,1.5rem)] leading-tight text-cyan">
            Top supporter&nbsp;
            <span className="font-bold text-[#ffd000]">
              {board.topSupporter.name}
            </span>
            {/* Behind the same floor as every other number, and for a
                sharper version of the same reason: this line sits directly
                under the QR code, so it is what someone reads while deciding
                whether to join. "· 2 votes" there tells them the room is
                empty. The name alone still says somebody is backing the
                band, which is the part worth showing early. */}
            {showCounts && (
              <>
                &nbsp;· {board.topSupporter.votes} vote
                {board.topSupporter.votes === 1 ? "" : "s"}
              </>
            )}
          </p>
        )}
      </aside>

      {/* The fanfare. Sized to be read from the back of the room rather than
          leaned into — a venue screen gets a glance, not attention. Clears
          itself after 6s. */}
      {/* The celebration slot. A tip outranks a Top-5 entry, so only one
          thing is ever on screen. Bottom-anchored: at the top it covered the
          artist's name. */}
      {tip ? (
        /* A tip takes the whole screen for a few seconds.

           It used to be a bar along the bottom, which is the right weight
           for the Top-5 entrant below and the wrong weight for this: tipping
           is the rarest thing that happens all night and the only one where
           somebody paid. A strip at the ankles asks the room to notice. This
           does not ask.

           Sits UNDER the confetti (z-10 against z-20) so the pieces fall in
           front of the card rather than behind it, and under the engineer's
           panel, which must stay reachable even mid-fanfare.

           No dollar figure, by design — the public payload carries votes and
           a shoutout name and deliberately not an amount. What the room
           should see is that someone moved a song up, not what they paid. */
        <div className="pointer-events-none fixed inset-0 z-10 flex items-center justify-center">
          <div className="absolute inset-0 bg-bg-dark/80 backdrop-blur-[0.3vw]" />
          <div className="tv-tip relative mx-[4vw] max-w-[72vw] rounded-[1.2vw] border-[0.25vw] border-[#ffd000] bg-bg-overly px-[4vw] py-[2.6vw] text-center shadow-[0_1vw_4vw_rgba(0,0,0,0.7)]">
            <div className="tv-tip-pop text-[clamp(2rem,6vw,8rem)] leading-none">
              🎉
            </div>

            <div className="mt-[1vw] text-[clamp(0.6rem,1.1vw,1.5rem)] font-bold uppercase leading-none tracking-[0.4em] text-[#ffd000]">
              Tipped the band
            </div>

            <div className="mt-[0.8vw] break-words text-[clamp(1.6rem,5vw,7rem)] font-bold leading-none text-white">
              {tip.name}
            </div>

            {tip.votes > 0 && (
              <div className="mt-[1.2vw] inline-block rounded-full bg-[#ffd000] px-[2vw] py-[0.6vw] text-[clamp(1rem,2.6vw,3.6rem)] font-bold leading-none text-bg-dark">
                +{tip.votes} {tip.votes === 1 ? "vote" : "votes"}
              </div>
            )}

            {tip.songTitle && (
              <div className="mt-[1.2vw] text-[clamp(0.9rem,2vw,2.8rem)] font-bold leading-tight text-lime">
                {tip.songTitle}
              </div>
            )}

            {tip.message && (
              <div className="mt-[0.8vw] text-[clamp(0.8rem,1.6vw,2.2rem)] italic leading-tight text-white/75">
                &ldquo;{tip.message}&rdquo;
              </div>
            )}
          </div>
        </div>
      ) : entrant ? (
        <div className="pointer-events-none fixed inset-x-0 bottom-0 z-10 flex justify-center">
          <div className="tv-entrant flex max-w-[80vw] items-center gap-[1.2vw] rounded-t-[1vw] bg-lime px-[2.4vw] py-[1.1vw] text-bg-dark shadow-2xl">
            <span className="shrink-0 text-[clamp(1rem,2.2vw,3rem)] leading-none">
              🎉
            </span>
            <span className="min-w-0">
              <span className="block text-[clamp(0.6rem,1.1vw,1.5rem)] font-bold uppercase leading-none tracking-[0.25em]">
                New in the Top 5
              </span>
              <span className="mt-[0.3vw] block truncate text-[clamp(1rem,2.3vw,3.1rem)] font-bold leading-tight">
                {entrant.title}
              </span>
            </span>
          </div>
        </div>
      ) : null}

      {/* Confetti, tips only. Kept rare so it still means something, and
          built from a handful of divs rather than a canvas library: the board
          runs on a TV stick, and transform/opacity keyframes stay on the GPU
          where a canvas loop would not. */}
      {confetti && (
        <div aria-hidden className="pointer-events-none fixed inset-0 z-20 overflow-hidden">
          {CONFETTI.map((piece, i) => (
            <span
              key={i}
              className="tv-confetti absolute top-[-6vh] block"
              style={{
                left: `${piece.left}%`,
                width: `${piece.size}vh`,
                height: `${piece.size * 1.6}vh`,
                backgroundColor: piece.color,
                animationDelay: `${piece.delay}s`,
                animationDuration: `${piece.duration}s`,
              }}
            />
          ))}
        </div>
      )}

      {/* Flying reactions. Launched from the bottom edge so they rise across
          the board without ever sitting on top of the artist's name. */}
      {flyers.length > 0 && (
        <div
          aria-hidden
          className="pointer-events-none fixed inset-0 z-20 overflow-hidden"
        >
          {flyers.map((f) => (
            <span
              key={f.key}
              className="tv-flyer absolute bottom-0 block leading-none"
              style={{
                left: `${f.left}%`,
                fontSize: `${f.size}vh`,
                ["--tv-dur" as string]: `${f.duration}s`,
                ["--tv-drift" as string]: `${f.drift}vw`,
              }}
              // Each flyer retires itself the instant it finishes, instead of
              // a timer sweeping the list: the sweep re-rendered every flyer
              // on screen on a fixed cadence, which is its own source of
              // dropped frames mid-flight.
              onAnimationEnd={() =>
                setFlyers((prev) => prev.filter((x) => x.key !== f.key))
              }
            >
              <span className="tv-flyer-inner">{f.emoji}</span>
            </span>
          ))}
        </div>
      )}

      {/* The picture riding a sound. Above the board, below the engineer's
          panel, and keyed so a repeat restarts the animation rather than
          sliding into the tail of the last one. */}
      {visual?.kind === "lightning" && (
        <div key={visual.key} aria-hidden>
          {/* Two layers: the sky going off, and the strike itself. One flat
              rectangle is what makes a fake flash look fake. */}
          <div className="tv-lightning-sky pointer-events-none fixed inset-0 z-20" />
          <div className="tv-lightning-core pointer-events-none fixed inset-0 z-20" />
        </div>
      )}

      {visual?.kind === "flash" && (
        <div key={visual.key} aria-hidden>
          <div className="tv-flash-wash pointer-events-none fixed inset-0 z-20" />
          <div className="tv-flash-core pointer-events-none fixed inset-0 z-20" />
        </div>
      )}

      {visual?.kind === "rain" && (
        <div
          key={visual.key}
          aria-hidden
          className="pointer-events-none fixed inset-0 z-20 overflow-hidden"
        >
          {RAINDROPS.map((drop, i) => (
            <span
              key={i}
              className="tv-raindrop absolute top-0 block rounded-full bg-white"
              style={{
                left: `${drop.left}%`,
                width: "0.15vh",
                height: `${drop.length}vh`,
                opacity: drop.opacity,
                animationDelay: `${drop.delay}s`,
                animationDuration: `${drop.duration}s`,
              }}
            />
          ))}
        </div>
      )}

      {visual?.kind === "santa" && (
        <div
          key={visual.key}
          aria-hidden
          className="tv-sleigh pointer-events-none fixed left-0 top-[16vh] z-20 whitespace-nowrap text-[10vh] leading-none"
        >
          {/* Reindeer, Santa, sleigh — in that order because it travels
              right to left, so the deer leads. Santa alone is a FACE, not a
              figure, and a face beside a sled read as two unrelated objects;
              with something pulling in front it resolves into a team.
              Negative tracking closes the emoji gaps so it moves as one
              thing rather than three. */}
          <span className="tv-sleigh-bob tracking-[-0.18em]">🦌🎅🛷</span>
        </div>
      )}

      {/* A winner takes the screen, briefly.
          Reuses the tip splash's shape because it is the same kind of
          moment — one person, named, with the room looking up. Lime rather
          than gold: gold is money, this is glory. Drops back to the panel
          after a few seconds so the round can keep collecting late answers. */}
      {gameFanfare && game?.winner && game.status === "open" && (
        <div
          key={gameFanfare}
          className="pointer-events-none fixed inset-0 z-10 flex items-center justify-center"
        >
          <div className="absolute inset-0 bg-bg-dark/80 backdrop-blur-[0.3vw]" />
          <div className="tv-tip relative mx-[4vw] max-w-[74vw] rounded-[1.2vw] border-[0.25vw] border-lime bg-bg-overly px-[4vw] py-[2.6vw] text-center shadow-[0_1vw_4vw_rgba(0,0,0,0.7)]">
            <div className="tv-tip-pop text-[clamp(2rem,6vw,8rem)] leading-none">
              🏆
            </div>
            <div className="mt-[1vw] text-[clamp(0.6rem,1.1vw,1.5rem)] font-bold uppercase leading-none tracking-[0.4em] text-lime">
              Named it first
            </div>
            <div className="mt-[0.8vw] break-words text-[clamp(1.6rem,5vw,7rem)] font-bold leading-none text-white">
              {game.winner.name}
            </div>
            {game.winner.artistBonus && (
              <div className="mt-[1.2vw] inline-block rounded-full bg-lime px-[2vw] py-[0.6vw] text-[clamp(0.9rem,2.2vw,3rem)] font-bold leading-none text-bg-dark">
                ★ Got the artist too
              </div>
            )}
          </div>
        </div>
      )}

      {/* Who just heckled.

          Bottom centre rather than up with the standings: it is a punchline,
          it wants the room's eye for four seconds and then it wants to be
          gone. Keyed so a second heckle restarts the animation instead of
          sliding silently into the first one's slot. */}
      {callout && (
        <div
          key={callout.key}
          className="tv-callout pointer-events-none fixed bottom-[7vh] left-1/2 z-40 -translate-x-1/2 whitespace-nowrap rounded-[0.6vw] border border-lime/40 bg-bg-overly/95 px-[2vw] py-[0.8vw] text-center shadow-[0_0.3vw_1.2vw_rgba(0,0,0,0.6)]"
        >
          <div className="text-[clamp(1rem,2.4vw,3rem)] font-bold uppercase leading-none tracking-[0.1em] text-white">
            {callout.label}
          </div>
          <div className="mt-[0.5vw] text-[clamp(0.6rem,1.2vw,1.5rem)] uppercase tracking-[0.25em] text-lime">
            {callout.name}
          </div>
        </div>
      )}

      {/* Sound status, and the engineer's panel. A venue has to be able to
          tell at a glance whether the room's phones can make a noise right
          now — audio that has silently fallen back to locked after a TV sleep
          looks identical to a quiet crowd, and the bit flops with nobody
          knowing why. */}
      {fxOn && (
        <div className="fixed right-[1.2vw] top-[1.2vw] z-30 flex flex-col items-end gap-[0.6vw]">
          {soundReady ? (
            <>
              {fxAllowed ? (
                <span className="rounded-full bg-lime px-[1vw] py-[0.35vw] text-[clamp(0.5rem,0.85vw,1.05rem)] font-bold uppercase tracking-[0.2em] leading-none text-bg-dark">
                  🔊 Sound armed
                </span>
              ) : (
                /* Distinct from "locked": the audio works fine, the artist
                   has muted the room. Confusing the two means someone at the
                   desk debugging a system that is behaving correctly. */
                <span className="rounded-full bg-rose px-[1vw] py-[0.35vw] text-[clamp(0.5rem,0.85vw,1.05rem)] font-bold uppercase tracking-[0.2em] leading-none text-white">
                  🔇 Muted by artist
                </span>
              )}
              {/* Set the gain before doors, not during a ballad.

                  Nobody in the room ever sees this: ?fx=1 gates the sound
                  board and this panel together, so the screen the audience
                  watches has neither. It is one person's tool on one laptop.

                  Folded away regardless, for that person's sake. Seventeen
                  buttons in a flex-wrap row was a wall with no order to scan,
                  and it sat on top of the standings and the join QR — which
                  the engineer is also watching, on the same screen, all
                  night. Collapsed it costs one line; open, the groups match
                  the fan's picker so "where's the one they just pressed?" is
                  one glance.

                  <details> rather than state, because it is keyboard- and
                  remote-focusable for free, survives a re-render on its own,
                  and does not close when something inside it is clicked —
                  which matters when auditioning is the whole point. */}
              <details className="group w-[22vw] min-w-[13rem] overflow-hidden rounded-[0.5vw] border border-light-dark bg-bg-overly text-right shadow-[0_0.3vw_1vw_rgba(0,0,0,0.5)]">
                <summary className="cursor-pointer list-none rounded-[0.5vw] px-[0.8vw] py-[0.4vw] text-[clamp(0.45rem,0.75vw,0.95rem)] font-bold uppercase tracking-[0.15em] leading-none text-cyan hover:text-white focus:outline-none focus-visible:ring-[0.2vw] focus-visible:ring-lime">
                  <span className="inline-block transition-transform group-open:rotate-90">
                    ▸
                  </span>{" "}
                  Preview sounds
                </summary>

                <div className="max-h-[70vh] overflow-y-auto px-[0.6vw] pb-[0.6vw]">
                  {/* Pinned above the catalogue, and styled apart from it,
                      because it is not an effect — it is the reference tone
                      for setting a channel's gain, and it is the first thing
                      reached for and the only one with a wrong time to press
                      it. Burying it among the hits made it a needle. */}
                  {SOUND_LIST.filter((s) => s.id === "test").map((sound) => (
                    <button
                      key={sound.id}
                      type="button"
                      onClick={() => audition(sound.id)}
                      className="mb-[0.5vw] w-full rounded-[0.4vw] border border-lime/50 px-[0.7vw] py-[0.35vw] text-[clamp(0.45rem,0.75vw,0.95rem)] font-bold uppercase tracking-[0.1em] leading-none text-lime hover:bg-lime/10 focus:outline-none focus-visible:ring-[0.2vw] focus-visible:ring-lime"
                    >
                      {sound.label}
                    </button>
                  ))}

                  {PANEL_GROUPS.map(({ kind, title }) => {
                    const items = SOUND_LIST.filter(
                      (s) => s.kind === kind && s.id !== "test"
                    );
                    if (!items.length) return null;
                    return (
                      <div key={kind} className="mt-[0.4vw]">
                        <div className="px-[0.1vw] pb-[0.25vw] text-[clamp(0.4rem,0.62vw,0.8rem)] font-bold uppercase tracking-[0.25em] text-cyan/50">
                          {title}
                        </div>
                        <div className="flex flex-wrap justify-end gap-[0.3vw]">
                          {items.map((sound) => (
                            <button
                              key={sound.id}
                              type="button"
                              onClick={() => audition(sound.id)}
                              className="rounded-[0.4vw] bg-light-dark/80 px-[0.6vw] py-[0.3vw] text-[clamp(0.45rem,0.72vw,0.9rem)] font-bold uppercase tracking-[0.1em] leading-none text-white hover:bg-light-dark focus:outline-none focus-visible:ring-[0.2vw] focus-visible:ring-lime"
                            >
                              {sound.label}
                              {/* The take count, shown only where there is a
                                  choice to make. Dropping a file into
                                  public/sfx is meant to be a soundcheck-speed
                                  change, and this is the only way to confirm
                                  it landed without mashing the button and
                                  waiting to hear something new. */}
                              {sound.variants > 1 && (
                                <span className="ml-[0.3vw] font-normal text-lime">
                                  ×{sound.variants}
                                </span>
                              )}
                            </button>
                          ))}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </details>
            </>
          ) : (
            /* A real button, because this gets pressed with a TV remote as
               often as a finger — it has to be reachable by focus. */
            <button
              type="button"
              onClick={enableSound}
              className="rounded-full bg-rose px-[1.2vw] py-[0.5vw] text-[clamp(0.55rem,0.95vw,1.2rem)] font-bold uppercase tracking-[0.15em] leading-none text-white focus:outline-none focus-visible:ring-[0.25vw] focus-visible:ring-lime"
            >
              🔇 Press to enable sound
            </button>
          )}
        </div>
      )}

      <span className="pointer-events-none fixed bottom-[1vw] right-[1.2vw] text-[clamp(0.5rem,0.8vw,1rem)] uppercase tracking-[0.3em] text-cyan/50">
        {offline ? "Reconnecting…" : displayCode}
      </span>
    </main>
  );
};

export default TvBoard;
