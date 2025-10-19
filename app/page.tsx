"use client";

import React, { FC, use } from "react";
import Featured from "@/components/featured";
import UpcomingShows from "@/components/upcoming-shows";
import FeaturedGrid from "@/components/featured-grid";
import NotFound from "@/components/not-found";

import { useStore } from "@/store/useStore";

const Home: FC = () => {
  const shows = useStore((state) => state.shows);
  const imageGallery = useStore((state) => state.imageGallery);
  const artist = useStore((state) => state.artist);
  const webpage = useStore((state) => state.webpage);

  return artist && webpage ? (
    <>
      <Featured
        header={webpage.bioHeader}
        bio={artist.bio || ""}
        name={webpage.heroTitle}
        videoUrl={webpage.featuredVideoUrl}
      />
      {shows?.length > 0 && <UpcomingShows shows={shows} />}
      {imageGallery && <FeaturedGrid images={imageGallery} />}
    </>
  ) : (
    <NotFound />
  );
};

export default Home;
