"use client";

import React, { FC, useMemo } from "react";
import Featured from "@/components/featured";
import UpcomingShows from "@/components/upcoming-shows";
import FeaturedGrid from "@/components/featured-grid";
import NotFound from "@/components/not-found";

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

  // Every section renders now, whether or not the artist has filled it in —
  // see lib/placeholders.ts. Sections that returned null on empty data were
  // the whole of the "my page looks broken" problem: a page with nothing
  // between the nav and the footer reads as a fault, not as an invitation.
  return artist && webpage ? (
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
  ) : (
    <NotFound />
  );
};

export default Home;
