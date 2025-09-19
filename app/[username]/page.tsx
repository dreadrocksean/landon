import React from "react";
import { notFound } from "next/navigation";
import Page from "../page";
import {
  getArtistByWebRoute,
  getAllArtists,
  getWebpageById,
  getShowsByArtistId,
  getUserById,
  getImageGalleryByArtistId,
} from "@/lib/gcp/artists";
import { getNavigationLinks } from "@/utils/constants";

interface ArtistPageProps {
  params: { username: string };
}

export const generateStaticParams = async () => {
  const artists = await getAllArtists();
  const routes = artists.map((a) => ({ username: a.webRoute })).filter(Boolean);
  return [
    ...routes,
    { username: "kurtcaldwell" },
    { username: "adrianbartholomew" },
  ];
};

const ArtistPage = async ({ params }: ArtistPageProps) => {
  const { username } = params;
  const navigationLinks = getNavigationLinks(username);

  const [artist, webpage] = await Promise.all([
    getArtistByWebRoute({ webRoute: username }),
    getWebpageById({ id: username }),
  ]);

  const [user, showsUnsorted, imageGallery] = await Promise.all([
    getUserById(artist?.userId || ""),
    getShowsByArtistId({ artistId: artist?.id || "" }),
    getImageGalleryByArtistId({ artistId: artist?.id || "" }),
  ]);

  if (!artist || !webpage || !user) return notFound();

  const shows = showsUnsorted?.sort(
    (a, b) => b.scheduledStart.toMillis() - a.scheduledStart.toMillis()
  );

  return artist && webpage && user ? (
    <Page
      artist={artist}
      webpage={webpage}
      imageGallery={imageGallery}
      shows={shows}
      user={user}
      navigationLinks={navigationLinks}
    />
  ) : (
    notFound()
  );
};

export default ArtistPage;
