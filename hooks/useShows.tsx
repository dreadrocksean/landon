import { useState, useEffect } from "react";
import { user as userData } from "@/data/data";
// Update this import to match the actual export from "@/lib/gcp/artists"
import { getArtistByUserId } from "@/lib/gcp/artists";
import { getUserByEmail } from "@/lib/gcp/users";
import { getShowsByArtistId } from "@/lib/gcp/shows"; // Update this import to match the actual export
import { User, Artist, Show } from "@/lib/schema";

const useShows = () => {
  const [user, setUser] = useState<User | null>(null);
  const [artist, setArtist] = useState<Artist | null>(null);
  const [shows, setShows] = useState<Show[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    // This effect could be used to fetch shows from an API or perform other side effects
    // For now, it just logs the current shows
    setIsLoading(true);
    setError(null);
    console.log("Fetching shows...");

    const getShows = async (artistId?: string) => {
      try {
        if (!artistId) {
          setShows([]);
          throw new Error("Artist ID is required to fetch shows");
        }
        console.log("Fetching shows for artist ID:", artistId);
        setIsLoading(true);
        setError(null);
        const shows = await getShowsByArtistId({
          artistId,
          setError,
          setIsLoading,
        });
        setShows(shows || []);
      } catch (error) {
        console.error("Error fetching shows:", error);
        setError("Failed to fetch shows");
        setIsLoading(false);
      }
    };

    const getArtist = async ({ userId }: { userId?: string }) => {
      try {
        if (!userId) {
          setArtist(null);
          throw new Error("User ID is required to fetch artist");
        }
        setIsLoading(true);
        setError(null);
        console.log("Fetching artist by user ID:", userId);
        const artist = await getArtistByUserId({ userId });
        setArtist(artist);
        getShows(artist?.id);
      } catch (error) {
        console.error("Error fetching artist:", error);
        setError("Failed to fetch artist");
        setIsLoading(false);
      }
    };

    const getUser = async (email: string) => {
      try {
        if (!email) {
          setUser(null);
          throw new Error("Email is required to fetch user");
        }
        setIsLoading(true);
        setError(null);
        console.log("Fetching user by email:", email);
        const user = await getUserByEmail({ email, setError, setIsLoading });
        setUser(user);
        getArtist({ userId: user?.id });
      } catch (error) {
        console.error("Error fetching user:", error);
        setError("Failed to fetch user");
        setIsLoading(false);
      }
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
