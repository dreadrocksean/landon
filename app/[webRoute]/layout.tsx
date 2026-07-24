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
} from "@/lib/gcp/server";

// Always server-render with fresh data (live shows/artists), rather than
// caching a build-time snapshot.
export const dynamic = "force-dynamic";
import ClientWebRouteLayout from "./ClientWebRouteLayout"; // client wrapper

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

  if (!user) return notFound();

  // Data from lib/gcp/server.ts is already deep-serialized (Timestamps -> millis,
  // DocumentReferences -> null), so it can be passed straight to the client.
  return (
    <ClientWebRouteLayout
      artist={artist}
      webpage={webpage}
      user={user}
      shows={shows}
      imageGallery={imageGallery}
    >
      {children}
    </ClientWebRouteLayout>
  );
};

export default WebRouteLayout;
