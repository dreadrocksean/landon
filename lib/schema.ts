export interface Musician {
  id: string;
  name: string;
  email?: string;
  instrument?: string;
  createdAt: string;
  bio?: string;
  image?: string; // URL to the musician's image
  socialLinks?: {
    facebook?: string;
    instagram?: string;
    X?: string;
  };
  birthday?: string; // ISO date string
  location?: string; // e.g., city or address
  phone?: string; // Contact number
  website?: string; // Personal or band website
  genres?: string[]; // Array of genres the musician is associated with
  isActive?: boolean; // Whether the musician is currently active
}

export interface Gig {
  id: string;
  title: string;
  date: string;
  venue: string;
  image: string;
  status: "free" | "booked";
  duration: number; // in hours
  description?: string;
  price?: number; // in USD
  location?: string; // e.g., city or address
  musicianId: string; // FK-like reference
  createdAt: string;
}
