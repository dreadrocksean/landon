import {
  ClientArtist,
  ClientShow,
  ClientUser,
  ClientWebpage,
} from "@/lib/schema";
import { create } from "zustand";

export type StoreState = {
  webRoute: string;
  artist: ClientArtist | null;
  webpage: ClientWebpage | null;
  user: ClientUser | null;
  shows: ClientShow[];
  imageGallery: string[];
  setWebRoute: (webRoute: string) => void;
  setArtist: (artist: ClientArtist | null) => void;
  setWebpage: (webpage: ClientWebpage | null) => void;
  setUser: (user: ClientUser | null) => void;
  setShows: (shows: ClientShow[]) => void;
  setImageGallery: (imageGallery: string[]) => void;
};

export const useStore = create<StoreState>((set) => ({
  webRoute: "",
  artist: null,
  webpage: null,
  user: null,
  shows: [],
  imageGallery: [],
  setWebRoute: (webRoute: string) => set({ webRoute }),
  setArtist: (artist: ClientArtist | null) => set({ artist }),
  setWebpage: (webpage: ClientWebpage | null) => set({ webpage }),
  setUser: (user: ClientUser | null) => set({ user }),
  setShows: (shows: ClientShow[]) => set({ shows }),
  setImageGallery: (imageGallery: string[]) => set({ imageGallery }),
}));
