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

  // console.log("🚀 ~ Home ~ artist:", artist);
  // console.log("🚀 ~ Home ~ webpage:", webpage);
  return artist && webpage ? (
    <>
      <Featured
        header={webpage.bioHeader}
        bio={artist.bio || ""}
        name={webpage.heroTitle}
        videoUrl={webpage.featuredVideoUrl}
      />
      <UpcomingShows shows={shows} />
      <FeaturedGrid images={imageGallery} />
    </>
  ) : (
    <NotFound />
  );
};

export default Home;
