import { useState, useEffect, useCallback, use } from "react";
import { user as userData } from "@/data/data";
import { getArtistByUserId } from "@/lib/gcp/artists";
import { getUserByEmail } from "@/lib/gcp/users";
import { getShowsByArtistId, deleteShow } from "@/lib/gcp/shows";
import { User, Artist, Show, Form } from "@/lib/schema";
import { createShow } from "@/lib/gcp/shows";

export type UseShowsReturn = {
  shows: Show[];
  addShow: (show: Form) => void;
  getShows: () => Promise<void>;
  removeShow: (params: { showId: string; artistId: string }) => Promise<void>;
  user: User | null;
  artist: Artist | null;
  isLoading: boolean;
  error: string | null;
};

const useShows = (): UseShowsReturn => {
  const [user, setUser] = useState<User | null>(null);
  const [artist, setArtist] = useState<Artist | null>(null);
  const [shows, setShows] = useState<Show[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  const getShows = useCallback(async (): Promise<void> => {
    if (artist?.id) {
      try {
        if (!artist?.id) {
          setShows([]);
          throw new Error("Artist ID is required to fetch shows");
        }
        console.log("Fetching shows for artist ID:", artist?.id);
        setIsLoading(true);
        setError(null);
        const shows = await getShowsByArtistId({
          artistId: artist.id,
          setError,
          setIsLoading,
        });
        setShows(shows || []);
      } catch (error) {
        console.error("Error fetching shows:", error);
        setError("Failed to fetch shows");
        setIsLoading(false);
      }
    }
  }, [artist?.id]);

  const getArtist = useCallback(
    async ({ userId }: { userId?: string }): Promise<void> => {
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
        getShows();
      } catch (error) {
        console.error("Error fetching artist:", error);
        setError("Failed to fetch artist");
        setIsLoading(false);
      }
    },
    [getShows]
  );

  const getUser = useCallback(async (): Promise<void> => {
    try {
      if (!userData?.email) {
        setUser(null);
        throw new Error("Email is required to fetch user");
      }
      setIsLoading(true);
      setError(null);
      console.log("Fetching user by email:", userData?.email);
      const user = await getUserByEmail({
        email: userData?.email,
        setError,
        setIsLoading,
      });
      setUser(user);
      getArtist({ userId: user?.id });
    } catch (error) {
      console.error("Error fetching user:", error);
      setError("Failed to fetch user");
      setIsLoading(false);
    }
  }, [getArtist]);

  const removeShow = async ({
    showId,
    artistId,
  }: {
    showId: string;
    artistId: string;
  }): Promise<void> => {
    try {
      setIsLoading(true);
      setError(null);
      await deleteShow({ showId, artistId });
      getShows();
    } catch (error) {
      console.error("Error deleting show:", error);
      setError("Failed to delete show");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    setIsLoading(true);
    setError(null);
    console.log("Fetching shows...");
    getUser();
  }, [getUser]);

  const addShow = async (form: Form): Promise<void> => {
    if (form.scheduledStart && form.scheduledStop) {
      const start = form.scheduledStart.toDate();
      const end = form.scheduledStop.toDate();
      if (start >= end) {
        alert("End time must be after start time.");
        return;
      }
    }

    if (
      form.title &&
      form.scheduledStart &&
      form.scheduledStop &&
      form.venue &&
      artist?.id
    ) {
      try {
        setIsLoading(true);
        setError(null);
        const data = await createShow({
          artistId: artist.id,
          venue: form.venue,
          scheduledStart: form.scheduledStart,
          scheduledStop: form.scheduledStop,
          title: form.title,
        });

        setIsLoading(false);
        if (data.success) {
          getShows();
        } else {
          alert(`Error: ${data.error}`);
          setError(`Error: ${data.error}`);
        }
      } catch (error) {
        alert("Failed to save show.");
        console.error("Error saving show:", error);
        setError(`Error saving show: ${error}`);
      }
    }
  };

  return {
    shows,
    getShows,
    addShow,
    removeShow,
    user,
    artist,
    isLoading,
    error,
  };
};

export default useShows;
