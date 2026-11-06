"use client";

import React, { useEffect, useState } from "react";
import { useStore, StoreState } from "@/store/useStore";

import DemoNotice from "@/components/demo-notice";
import Footer from "@/components/footer";
import Header from "@/components/header";
import Hero from "@/components/hero";
import { DEMO_HERO_BG, buildPageContent } from "@/lib/placeholders";

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

  // A hero image can be SET and still not exist.
  //
  // Two of the four artists who had picked one were pointing at a file that
  // 404s out of Firebase Storage — uploaded once, since moved or deleted,
  // with the URL left behind on the webpage doc. Firebase answers with JSON
  // rather than an image, the browser blocks it, and the hero renders as a
  // flat dark rectangle: exactly the empty-looking page this whole feature
  // exists to prevent, and invisible to a check that only asks whether the
  // field is a non-empty string.
  //
  // So the string is not taken at its word. The image is probed, and a URL
  // that does not resolve is treated as the absence it actually is — which
  // also means the notice below lists the cover photo as a sample, because
  // by then it is one.
  const [heroBroken, setHeroBroken] = useState(false);

  useEffect(() => {
    setHeroBroken(false);
    const url = content.heroBg;
    // Nothing to check when it is already the fallback.
    if (!url || url === DEMO_HERO_BG) return;
    let alive = true;
    const probe = new window.Image();
    probe.onerror = () => {
      if (alive) setHeroBroken(true);
    };
    probe.src = url;
    return () => {
      alive = false;
    };
  }, [content.heroBg]);

  const heroBg = heroBroken ? DEMO_HERO_BG : content.heroBg;
  const demoFields =
    heroBroken && !content.demo.includes("heroBg")
      ? ([...content.demo, "heroBg"] as typeof content.demo)
      : content.demo;
  const isDemo = demoFields.length > 0;

  return (
    <main
      className={`bg-bg-dark text-white text-base ${
        isDemo ? "has-demo-notice pb-[var(--notice-h)]" : ""
      }`}
    >
      <DemoNotice demo={demoFields} />
      <Header image={artist.imageURL} />
      <Hero
        artistName={content.heroTitle}
        title={content.heroTagline}
        image={heroBg}
      />
      {children}
      <Footer tel={webpage.tel} email={webpage.email} fname={user.fname} />
    </main>
  );
};

export default ClientWebRouteLayout;
