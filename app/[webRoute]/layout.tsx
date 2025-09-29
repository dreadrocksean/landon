// app/[webRoute]/layout.tsx
import React from "react";
import { notFound } from "next/navigation";
import {
  getArtistByWebRoute,
  getWebpageById,
  getUserById,
  getShowsByArtistId,
  getImageGalleryByArtistId,
} from "@/lib/gcp/artists";
import ClientWebRouteLayout from "./ClientWebRouteLayout"; // client wrapper
import { Artist, FirestoreShow, Show, User, Webpage } from "@/lib/schema";
import { create } from "zustand";

interface WebRouteLayoutProps {
  children: React.ReactNode;
  params: { webRoute: string };
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
      shows={showsPlain}
      imageGallery={imageGallery}
    >
      {children}
    </ClientWebRouteLayout>
  );
};

export default WebRouteLayout;
