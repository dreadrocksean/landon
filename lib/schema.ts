import { DocumentReference, Timestamp } from "firebase/firestore";

export interface Artist {
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
}

export interface BaseShow {
  createdAt: Timestamp; // Timestamp when the show was created
  scheduledStart: Timestamp; // Start time of the show
  scheduledStop: Timestamp; // End time of the show
  showTitle?: string;
  title?: string;
  showStatus?: "free" | "cancelled" | "confirmed";
}

export interface FirestoreShow extends BaseShow {
  venueId?: string; // Reference to the venue
  venueRef?: DocumentReference; // Reference to the venue document
  doorFee?: number; // in USD
  artistFee?: number; // in USD
  totalTips?: number; // Total tips received for the show
}

export interface Show extends FirestoreShow {
  id: string; // Document ID in Firestore
  venue?: string; // Name of the venue
  date?: Date;
  duration?: number; // Duration in hours
  location?: string; // e.g., city or address
  image?: string; // URL
  //   totalTips?: number; // Total tips received for the show
  //   entranceFee?: number; // in USD
}

export interface Place {
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
}
export interface Location {
  address: string;
  census_block: string;
  country: string;
  dma: string;
  formatted_address: string;
  locality: string;
  postcode: string;
  region: string;
}

export interface Venue {
  id: string;
  fsq_id?: string; // Foursquare ID
  createdAt: Timestamp; // Timestamp for when the venue was created
  location: Location;
  name: string; // Name of the venue
}
export interface User {
  id: string;
  idToken?: string; // Firebase UID
  email: string;
  createdAt: Timestamp;
  roleId: number;
}
