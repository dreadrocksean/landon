import { DocumentReference, Timestamp } from "firebase/firestore";

export interface Artist {
  id: string;
  name: string;
  email?: string;
  instrument?: string;
  createdAt: Timestamp;
  bio?: string;
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
}

export interface FirestoreShow extends BaseShow {
  venueId?: string; // Reference to the venue
  venueRef?: DocumentReference; // Reference to the venue document
  showStatus?: "free" | "cancelled" | "confirmed";
  doorFee?: number; // in USD
  artistFee?: number; // in USD
  totalTips?: number; // Total tips received for the show
}

export interface Show extends FirestoreShow {
  id: string; // Document ID in Firestore
  venue: string; // Name of the venue
  date: Date; // Date of the show
  duration: number; // Duration in hours
  location?: string; // e.g., city or address
}

// export interface Show {
//   id: string;
//   artistId: string; // FK-like reference
//   createdAt: Timestamp;
//   date: Date;
//   venue: string;
//   duration: number; // in hours
//   title?: string;
//   status?: "free" | "cancelled" | "confirmed";
//   description?: string;
//   entranceFee?: number; // in USD
//   location?: Location; // e.g., city or address
//   totalTips?: number; // Total tips received for the show
// }

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
