"use client";

import React, { FC, useState } from "react";
import { doc, updateDoc } from "firebase/firestore";

import useAuth from "@/hooks/useAuth";
import { db } from "@/lib/gcp/client";
import { useStore } from "@/store/useStore";

// The artist's switch for taking their calendar live.
//
// Shown only to the signed-in owner of the page, and only while the calendar
// is still showing sample dates — once it is live this has done its job and
// a permanent toggle on a public page is just something to knock. Turning it
// back off is a thing they can do from the app; leaving the escape hatch
// here would mean a stray tap replaces a real gig list with sample dates on
// a page a venue might be looking at.
//
// Writes `showsLive` straight to the webpage doc, which the rules already let
// the owning artist update. No new permission, no new endpoint.
const CalendarSwitch: FC = () => {
  const { user } = useAuth();
  const artist = useStore((state) => state.artist);
  const webRoute = useStore((state) => state.webRoute);
  const webpage = useStore((state) => state.webpage);
  const setWebpage = useStore((state) => state.setWebpage);

  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Ownership is the whole gate. Everyone else — fans, venues, bookers —
  // sees the sample calendar with its label and nothing to press.
  const isOwner = !!user && !!artist?.userId && user.uid === artist.userId;
  if (!isOwner || !webRoute) return null;

  const goLive = async () => {
    setBusy(true);
    setError(null);
    try {
      await updateDoc(doc(db, "webpages", webRoute), { showsLive: true });
      // Reflected locally rather than waiting for a reload: this page is
      // server-rendered, so nothing would otherwise re-fetch and the artist
      // would press the button and watch nothing happen.
      if (webpage) setWebpage({ ...webpage, showsLive: true });
    } catch (err) {
      console.error("goLive ~ could not take the calendar live:", err);
      setError("Could not save that. Try again in a moment.");
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="mx-auto mt-10 max-w-xl rounded-lg border border-lime/40 bg-light-dark/40 p-6 text-center">
      <p className="text-white font-medium">
        These are sample dates. Turn your calendar on and this section will
        show your real gigs from the app — including when you have none
        booked.
      </p>
      <button
        type="button"
        onClick={goLive}
        disabled={busy}
        className="mt-5 rounded bg-lime px-6 py-3 font-bold uppercase tracking-wide text-bg-dark transition-colors duration-300 hover:bg-white disabled:opacity-60"
      >
        {busy ? "Turning on…" : "Use my real calendar"}
      </button>
      {error && <p className="mt-3 text-sm text-rose">{error}</p>}
    </div>
  );
};

export default CalendarSwitch;
