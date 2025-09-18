import React from "react";
import { notFound } from "next/navigation";
import Page from "../page";
import {
  getArtistByWebRoute,
  getAllArtists,
  getWebpageById,
  getShowsByArtistId,
  getUserById,
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
  const shows = (await getShowsByArtistId({ artistId: artist?.id || "" })).sort(
    (a, b) => b.scheduledStart.toMillis() - a.scheduledStart.toMillis()
  );
  const user = await getUserById(artist?.userId || "");

  return artist && webpage && user ? (
    <Page
      artist={artist}
      webpage={webpage}
      shows={shows}
      user={user}
      navigationLinks={navigationLinks}
    />
  ) : (
    notFound()
  );
};

export default ArtistPage;
