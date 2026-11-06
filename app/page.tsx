"use client";

import React, { FC, useMemo } from "react";
import Featured from "@/components/featured";
import UpcomingShows from "@/components/upcoming-shows";
import FeaturedGrid from "@/components/featured-grid";

import { buildPageContent } from "@/lib/placeholders";
import { useStore } from "@/store/useStore";

const Home: FC = () => {
  const shows = useStore((state) => state.shows);
  const imageGallery = useStore((state) => state.imageGallery);
  const artist = useStore((state) => state.artist);
  const webpage = useStore((state) => state.webpage);

  const content = useMemo(
    () => buildPageContent({ artist, webpage, shows, gallery: imageGallery }),
    [artist, webpage, shows, imageGallery]
  );

  // Nothing, not a 404, while the store is still empty.
  //
  // This component reads the artist out of a zustand store that the layout
  // fills in an effect, so on the server and on the first client paint it
  // has nothing — and it used to answer that by rendering NotFound. The
  // result was a "404 - Not Found" flash on every artist page, and, worse,
  // "404 - Not Found" as the entire server-rendered body: what a crawler, a
  // link preview or a venue's share card actually saw.
  //
  // It was never a real 404 either way. The layout already calls Next's
  // notFound() server-side when the artist genuinely does not exist, so by
  // the time this renders the artist is known to exist and the only question
  // is whether the store has caught up yet. The honest answer to that is to
  // show nothing for a frame.
  //
  // Properly server-rendering this section means getting the data here
  // without a module-level store, which on the server is shared between
  // concurrent requests — a bigger change than belongs in this one.
  if (!artist || !webpage) return null;

  // Every section renders now, whether or not the artist has filled it in —
  // see lib/placeholders.ts. Sections that returned null on empty data were
  // the whole of the "my page looks broken" problem: a page with nothing
  // between the nav and the footer reads as a fault, not as an invitation.
  return (
    <>
      <Featured
        header={content.bioHeader}
        bio={content.bio}
        name={content.heroTitle}
        videoUrl={content.videoUrl}
      />
      <UpcomingShows shows={content.shows} live={content.showsLive} />
      <FeaturedGrid images={content.gallery} />
    </>
  );
};

export default Home;
