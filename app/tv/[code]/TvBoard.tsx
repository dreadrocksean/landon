"use client";

import React, { useEffect, useMemo, useState } from "react";
import { doc, getDoc, onSnapshot } from "firebase/firestore";

import { db } from "@/lib/gcp/client";
import { Board, toBoard } from "@/lib/board";

interface TvBoardProps {
  code: string;
  displayCode: string;
  initial: Board;
  qrSvg: string;
}

// Everything is sized in vw so one layout fills a 32" bar TV and a 75" wall
// screen alike, with clamp() keeping it sane if someone opens it on a laptop.

const STEPS = ["Scan the code", "Request a song", "Watch it climb"];

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

  const subtitle = [board.venueName, board.showTitle]
    .filter(Boolean)
    .join(" · ");

  return (
    <main className="flex h-screen w-screen flex-row justify-start overflow-hidden bg-bg-dark text-white">
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

        <div className="mt-[2vw] min-h-0 flex-1">
          {board.songs.length > 0 ? (
            <ol className="flex h-full flex-col gap-[0.9vw]">
              {board.songs.map((song, index) => (
                <li
                  key={song.songId}
                  className="relative flex min-h-0 flex-1 items-center gap-[1.4vw] overflow-hidden rounded-[0.6vw] bg-light-dark/40 px-[1.4vw]"
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
                  <span className="relative w-[3vw] shrink-0 text-[clamp(0.9rem,1.9vw,2.5rem)] font-bold leading-none text-cyan">
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
                  <span className="relative shrink-0 text-[clamp(1.1rem,2.8vw,3.75rem)] font-bold leading-none text-lime tabular-nums">
                    {song.votes}
                  </span>
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
        {board.totalVotes > 0 && (
          <p className="text-center text-[clamp(0.65rem,1.2vw,1.6rem)] font-bold leading-tight text-lime">
            {board.totalVotes} vote{board.totalVotes === 1 ? "" : "s"} tonight
          </p>
        )}
      </aside>

      <span className="pointer-events-none fixed bottom-[1vw] right-[1.2vw] text-[clamp(0.5rem,0.8vw,1rem)] uppercase tracking-[0.3em] text-cyan/50">
        {offline ? "Reconnecting…" : displayCode}
      </span>
    </main>
  );
};

export default TvBoard;
