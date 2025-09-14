import React from "react";
import { notFound } from "next/navigation";
import Page from "../page";
import {
  getArtistByWebRoute,
  getAllArtists,
  getWebpageById,
  getShowsByArtistId,
} from "@/lib/gcp/artists";

interface ArtistPageProps {
  params: { username: string };
}

export const generateStaticParams = async () => {
  const artists = await getAllArtists();
  return artists.map((a) => ({ username: a.webRoute })).filter(Boolean);
};

const ArtistPage = async ({ params }: ArtistPageProps) => {
  const { username } = params;

  const [artist, webpage] = await Promise.all([
    getArtistByWebRoute({ webRoute: username }),
    getWebpageById({ id: username }),
  ]);
  const shows = (await getShowsByArtistId({ artistId: artist?.id || "" })).sort(
    (a, b) => b.scheduledStart.toMillis() - a.scheduledStart.toMillis()
  );

  return artist && webpage ? (
    <Page artist={artist} webpage={webpage} shows={shows} />
  ) : (
    notFound()
  );
};

export default ArtistPage;
