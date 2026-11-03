"use client";

import React, { useEffect, useMemo, useState } from "react";
import { doc, onSnapshot } from "firebase/firestore";

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
    const unsubscribe = onSnapshot(
      doc(db, "publicBoards", code),
      (snap) => {
        setOffline(false);
        // A missing doc means the artist rotated their code; keep showing the
        // last standings rather than blanking the screen mid-set.
        if (snap.exists()) setBoard(toBoard(snap.data()));
      },
      () => setOffline(true)
    );
    return unsubscribe;
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
              <p className="text-[clamp(1.25rem,3.4vw,4.5rem)] font-bold leading-tight">
                {board.live
                  ? "No requests yet."
                  : "No live show right now."}
              </p>
              <p className="mt-[1vw] text-[clamp(0.85rem,1.8vw,2.4rem)] leading-tight text-cyan">
                {board.live
                  ? "Get the app and put the first song up."
                  : "Get the app and catch the next one."}
              </p>
            </div>
          )}
        </div>
      </div>

      <aside className="flex w-[27%] shrink-0 flex-col items-center justify-center gap-[1.4vw] p-[3.2vw] pl-[2vw]">
        <div
          className="w-full rounded-[1vw] bg-white p-[1.2vw]"
          /* Trusted input: generated server-side by qrcode-svg from a URL we
             build ourselves, never from Firestore content. */
          dangerouslySetInnerHTML={{ __html: qrSvg }}
        />
        <p className="text-center text-[clamp(0.9rem,1.9vw,2.5rem)] font-bold uppercase leading-tight">
          Scan to get the app
        </p>
        <p className="text-center text-[clamp(0.65rem,1.2vw,1.6rem)] leading-tight text-cyan">
          Then request songs, react and tip — live.
        </p>
        {board.totalVotes > 0 && (
          <p className="text-center text-[clamp(0.65rem,1.2vw,1.6rem)] leading-tight text-cyan">
            {board.totalVotes} vote{board.totalVotes === 1 ? "" : "s"} so far
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
