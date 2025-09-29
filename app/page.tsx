"use client";

import React, { FC, use } from "react";
import Featured from "@/components/featured";
import UpcomingShows from "@/components/upcoming-shows";
// import NewestAlbums from "@/components/newest-albums";
import FeaturedGrid from "@/components/featured-grid";
// import FeaturedAlbums from "@/components/featured-albums";
// import Members from "@/components/members";
// import Testimonials from "@/components/testimonials";
// import LatestBlogs from "@/components/latest-blogs";
import { ref, getDownloadURL } from "firebase/storage";
import { Artist, Show, Webpage } from "@/lib/schema";
import { storage } from "@/lib/gcp/client";

import { useStore } from "@/store/useStore";

// const getURL = async (path: string, artistId: string) => {
//   const imageRef = ref(storage, `artists/${artistId}/imageGallery/${path}`);
//   return await getDownloadURL(imageRef);
// };

const Home: FC = () => {
  const shows = useStore((state) => state.shows);
  // console.log("🚀 ~ Home ~ shows:", shows[0]);
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
      <UpcomingShows shows={shows} />
      <FeaturedGrid images={imageGallery} />
    </>
  ) : (
    <h2>Artist not found</h2>
  );
};

export default Home;
