"use client";

import useAuth from "@/hooks/useAuth";
import { useStore } from "@/store/useStore";

// Is the person looking at this page the artist whose page it is?
//
// Two different components need this and they must not drift: the notice uses
// it to decide who is being spoken to, and the calendar switch uses it to
// decide who may press anything. One definition, so "owner" cannot come to
// mean two things.
const useIsOwner = (): boolean => {
  const { user } = useAuth();
  const artist = useStore((state) => state.artist);
  return !!user && !!artist?.userId && user.uid === artist.userId;
};

export default useIsOwner;
