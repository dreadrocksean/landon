import { DocumentReference, Timestamp } from "firebase/firestore";

// Define ResponseData type
export type ResponseData<T> = {
  success: boolean;
  error?: string;
  data: T & { id: string };
};

export type Webpage = {
  id: string;
  imageGallery: string[];
  artistId: string;
  bioHeader: string;
  heroBg: string;
  heroText: string;
  heroTitle: string;
  profilePicUrl: string;
  tel: string;
};
export type Artist = {
  id: string;
  name: string;
  email?: string;
  instrument?: string;
  createdAt: Timestamp;
  bio?: string;
  live?: boolean; // Whether the artist is currently live
  currShowId?: string | null; // ID of the current show, if any
  image?: string; // URL to the artist's image
  socialLinks?: {
    facebook?: string;
    instagram?: string;
    X?: string;
  };
  birthday?: string; // ISO date string
  location?: string; // e.g., city or address
  phone?: string; // Contact number
  website?: string; // Personal or band website
  genres?: string[]; // Array of genres the artist is associated with
  isActive?: boolean; // Whether the artist is currently active
  webRoute?: string; // Unique web route for the artist's page
  active: boolean;
  currentSongId?: string;
  fuzzySearchArray?: string[];
  genre?: string;
  imageURL?: string;
  members?: string[];
  roles?: string[];
  scheduledStart?: Timestamp;
  scheduledStop?: Timestamp;
  setBreaks?: string[];
  showLyrics?: boolean;
  showTips?: boolean;
  type?: "solo" | "group";
  userId?: string;
  userIds?: string[];
  voteTime?: number;
  bioTitle?: string;
};

export type BaseShow = {
  createdAt: Timestamp; // Timestamp when the show was created
  scheduledStart: Timestamp; // Start time of the show
  scheduledStop: Timestamp; // End time of the show
  showTitle?: string;
  title?: string;
  showStatus?: "free" | "cancelled" | "confirmed";
};

export type FirestoreShow = BaseShow & {
  venueId?: string; // Reference to the venue
  venueRef?: DocumentReference; // Reference to the venue document
  venueName?: string; // Name of the venue
  doorFee?: number; // in USD
  artistFee?: number; // in USD
  totalTips?: number; // Total tips received for the show
};

export type Show = FirestoreShow & {
  id: string; // Document ID in Firestore
  venue?: Venue; // Full venue object
  date?: Date;
  duration?: number; // Duration in hours
  location?: string; // e.g., city or address
  image?: string; // URL
  //   totalTips?: number; // Total tips received for the show
  //   entranceFee?: number; // in USD
};

export type Place = {
  id: string;
  name: string;
  address: string;
  city: string;
  state: string;
  zipCode: string;
  country: string;
  phone?: string; // Contact number
  email?: string; // Contact email
  website?: string; // Venue website
  capacity?: number; // Maximum capacity of the venue
  createdAt: Timestamp; // ISO date string for when the venue was created
};
export type Location = {
  address: string;
  census_block: string;
  country: string;
  cross_street: string;
  dma: string;
  formatted_address: string;
  locality: string;
  postcode: string;
  region: string;
};

export type Category = {
  id: string;
  name: string;
  icon?: {
    prefix: string;
    suffix: string;
  };
};

export type Venue = {
  id: string;
  fsq_id?: string; // Foursquare ID
  createdAt: Timestamp; // Timestamp for when the venue was created
  location: Location;
  categories?: Category[];
  name: string; // Name of the venue
};
export type FSQVenue = Omit<Venue, "id">;
export type User = {
  id: string;
  idToken?: string; // Firebase UID
  email: string;
  createdAt: Timestamp;
  roleId: number;
};
