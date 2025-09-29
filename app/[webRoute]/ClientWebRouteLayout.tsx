"use client";

import React, { useEffect } from "react";
import { useStore, StoreState } from "@/store/useStore";

import Footer from "@/components/footer";
import Header from "@/components/header";
import Hero from "@/components/hero";

interface Props {
  artist: any;
  webpage: any;
  user: any;
  shows: any[];
  imageGallery: any[];
  children: React.ReactNode;
}

const ClientWebRouteLayout: React.FC<Props> = ({
  artist,
  webpage,
  user,
  shows,
  imageGallery,
  children,
}) => {
  const setWebRoute = useStore((state) => (state as StoreState).setWebRoute);
  const setArtist = useStore((state) => (state as StoreState).setArtist);
  const setWebpage = useStore((state) => (state as StoreState).setWebpage);
  const setUser = useStore((state) => (state as StoreState).setUser);
  const setShows = useStore((state) => (state as StoreState).setShows);
  const setImageGallery = useStore(
    (state) => (state as StoreState).setImageGallery
  );

  useEffect(() => {
    setWebRoute(artist.webRoute);
    setArtist(artist);
    setWebpage(webpage);
    setUser(user);
    setShows(shows);
    setImageGallery(imageGallery);
  }, [artist, webpage, user, shows, imageGallery]);

  return (
    <main className="bg-bg-dark text-white text-base">
      <Header image={artist.imageURL} />
      <Hero
        artistName={webpage.heroTitle}
        title={artist.bioTitle || "Bio"}
        image={webpage.heroBg}
      />
      {children}
      <Footer tel={webpage.tel} email={webpage.email} fname={user.fname} />
    </main>
  );
};

export default ClientWebRouteLayout;
