import { useState, useEffect } from "react";
import { user as userData } from "@/data/data";
// Update this import to match the actual export from "@/lib/gcp/artists"
import { getArtistByUserId } from "@/lib/gcp/artists";
import { getUserByEmail } from "@/lib/gcp/users";
import { getShowsByArtistId } from "@/lib/gcp/shows"; // Update this import to match the actual export
import { User, Artist, Show } from "@/lib/schema";

const useShows = (initialShows: string[]) => {
  const [user, setUser] = useState<User | undefined>(undefined);
  const [artist, setArtist] = useState<Artist | undefined>(undefined);
  const [shows, setShows] = useState<Show[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    // This effect could be used to fetch shows from an API or perform other side effects
    // For now, it just logs the current shows
    setIsLoading(true);
    setError(null);
    console.log("Fetching shows...");

    const getShows = async (artistId) => {
      const shows = await getShowsByArtistId({
        artistId,
        setError,
        setIsLoading,
      });
      setShows(shows || []);
    };

    const getArtist = async ({ userId }: { userId: string }) => {
      const artist = await getArtistByUserId({ userId });
      setArtist(artist);
      getShows(artist.id);
    };
    const getUser = async (email: string) => {
      const user = await getUserByEmail({ email, setError, setIsLoading });
      setUser(user);
      getArtist({ userId: user.id });
    };

    getUser(userData.email);
  }, [userData?.email]);

  const addShow = (show: Show) => {
    setShows((prevShows) => [...prevShows, show]);
  };

  const removeShow = (show: Show) => {
    setShows((prevShows) => prevShows.filter((s) => s.id !== show.id));
  };

  return { shows, addShow, removeShow, user, artist, isLoading, error };
};

export default useShows;
