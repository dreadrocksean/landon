// Shown when /tv/<code> does not resolve to a board — almost always because
// six characters were typed into a TV remote and one of them is wrong.
//
// This is read from across a room by someone who is already mildly annoyed, so
// it says what went wrong, shows what they actually entered, and names the one
// place the right code lives. Sized like TvBoard so it does not look like a
// different website.
//
// Rendered directly by page.tsx rather than through notFound(), for two
// reasons: Next does not reliably bind a nested not-found.tsx to a dynamic
// segment, and some smart-TV browsers swallow a 4xx and substitute their own
// error page — which would hide this message on exactly the screens it exists
// for.
import React from "react";

interface BoardNotFoundProps {
  // Formatted the same way the board formats a real code, so the venue is
  // comparing like with like against the artist's phone.
  entered: string;
}

const BoardNotFound: React.FC<BoardNotFoundProps> = ({ entered }) => (
  <main className="flex h-screen w-screen flex-col items-center justify-center overflow-hidden bg-bg-dark p-[4vw] text-center text-white">
    <h1 className="text-[clamp(1.5rem,5vw,6.5rem)] font-bold uppercase leading-none">
      Board not found
    </h1>

    {entered && (
      <>
        <p className="mt-[2.4vw] text-[clamp(0.7rem,1.3vw,1.75rem)] uppercase leading-none tracking-[0.3em] text-cyan">
          You entered
        </p>
        <p className="mt-[1vw] text-[clamp(1.75rem,7vw,9rem)] font-bold leading-none tracking-[0.1em] text-rose tabular-nums">
          {entered}
        </p>
      </>
    )}

    <p className="mt-[3vw] max-w-[60ch] text-[clamp(0.9rem,2vw,2.75rem)] font-bold leading-tight">
      Check the code on the artist&rsquo;s phone.
    </p>
    <p className="mt-[1.2vw] max-w-[60ch] text-[clamp(0.7rem,1.4vw,1.9rem)] leading-tight text-cyan">
      In the app, the artist opens the menu and taps{" "}
      <span className="text-white">TV Link</span>. Codes never contain the
      letters O or I, or the digits zero or one.
    </p>
  </main>
);

export default BoardNotFound;
