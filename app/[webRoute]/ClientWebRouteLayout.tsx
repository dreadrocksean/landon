"use client";

import React, { useEffect } from "react";
import { useStore, StoreState } from "@/store/useStore";

import DemoNotice from "@/components/demo-notice";
import Footer from "@/components/footer";
import Header from "@/components/header";
import Hero from "@/components/hero";
import { buildPageContent } from "@/lib/placeholders";

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

  // Built here as well as in the page, because the hero lives in the layout
  // and the hero is where an unconfigured page looked worst: a full-height
  // section with no background and an empty headline, since heroTitle sits
  // on the webpage doc while the artist's actual name sits on the artist
  // doc. Cheap enough to derive twice; sharing it would mean threading state
  // through a boundary that exists for a different reason.
  const content = buildPageContent({ artist, webpage, shows, gallery: imageGallery });

  return (
    <main className="bg-bg-dark text-white text-base">
      <DemoNotice demo={content.demo} />
      <Header image={artist.imageURL} />
      <Hero
        artistName={content.heroTitle}
        title={content.heroTagline}
        image={content.heroBg}
      />
      {children}
      <Footer tel={webpage.tel} email={webpage.email} fname={user.fname} />
    </main>
  );
};

export default ClientWebRouteLayout;
