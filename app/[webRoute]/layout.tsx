// app/[webRoute]/layout.tsx
import React from "react";
import { notFound } from "next/navigation";
import { Metadata } from "next";

import {
  getArtistByWebRoute,
  getWebpageById,
  getUserById,
  getShowsByArtistId,
  getImageGalleryByArtistId,
} from "@/lib/gcp/artists";
import ClientWebRouteLayout from "./ClientWebRouteLayout"; // client wrapper
import { Artist, Show, User, Webpage } from "@/lib/schema";

interface WebRouteLayoutProps {
  children: React.ReactNode;
  params: { webRoute: string };
}

// ✅ This runs before rendering to set <head> tags
export async function generateMetadata({
  params,
}: {
  params: { webRoute: string };
}): Promise<Metadata> {
  const webRoute = params.webRoute;

  const [artist, webpage] = await Promise.all([
    getArtistByWebRoute({ webRoute }),
    getWebpageById({ id: webRoute }),
  ]);

  if (!artist || !webpage) return {};

  return {
    title: `${artist.name ?? "Music Page"}`,
    description: webpage.heroText ?? "Discover live music",
    openGraph: {
      title: `${artist.name ?? "Music Page"}`,
      description: webpage.bioHeader ?? "Discover live music",
      images: artist.imageURL ? [artist.imageURL] : [],
    },
    twitter: {
      card: "summary_large_image",
      title: artist.name,
      description: webpage.bioHeader ?? "Discover live music",
      images: artist.imageURL ? [artist.imageURL] : [],
    },
  };
}

const WebRouteLayout = async ({ children, params }: WebRouteLayoutProps) => {
  const webRoute = params.webRoute;

  const [artist, webpage] = await Promise.all([
    getArtistByWebRoute({ webRoute }),
    getWebpageById({ id: webRoute }),
  ]);
  if (!artist || !webpage) return notFound();

  const [user, shows, imageGallery] = await Promise.all([
    getUserById(artist.userId),
    getShowsByArtistId({ artistId: artist.id }),
    getImageGalleryByArtistId({ artistId: artist.id }),
  ]);
  //   console.log("🚀 ~ WebRouteLayout ~ shows:", shows);

  if (!user) return notFound();

  const serializeShow = (show: Show) => ({
    ...show,
    createdAt: show.createdAt.toMillis(),
    scheduledStart: show.scheduledStart.toMillis(),
    scheduledStop: show.scheduledStop.toMillis(),
    endTime: show?.endTime?.toMillis() || null,
    venueRef: null,
    venue: { ...show.venue, createdAt: show?.venue?.createdAt.toMillis() },
  });
  const showsPlain = shows.map(serializeShow);
  const showsSorted = [...showsPlain].sort(
    (a, b) => b.scheduledStart - a.scheduledStart
  );

  const serializeArtist = (artist: Artist) => ({
    ...artist,
    createdAt: artist.createdAt.toMillis(),
  });

  const serializeWebpage = (webpage: Webpage) => ({
    ...webpage,
    createdAt: webpage.createdAt.toMillis(),
  });

  const serializeUser = (user: User) => ({
    ...user,
    createdAt: user.createdAt.toMillis(),
  });

  return (
    <ClientWebRouteLayout
      artist={serializeArtist(artist)}
      webpage={serializeWebpage(webpage)}
      user={serializeUser(user)}
      shows={showsSorted}
      imageGallery={imageGallery}
    >
      {children}
    </ClientWebRouteLayout>
  );
};

export default WebRouteLayout;
