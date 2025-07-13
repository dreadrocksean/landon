"use client";

import { Timestamp } from "firebase/firestore";
import React, { useState, useEffect, useCallback, useRef } from "react";

export interface GeneralDBDocument {
  id: number;
  created_at: Timestamp;
  updated_at?: string;
}

type Show = {
  id: number;
  title: string;
  date: string;
  location: string;
};

export interface VenueCategory {
  icon: { prefix: string; suffix: string };
  id: number;
  name: string;
}

export interface Venue extends GeneralDBDocument {
  categories: VenueCategory[];
  fsq_id: string;
  name: string;
  distance: number;
  geocodes: {
    main: { latitude: number; longitude: number };
  };
  location: {
    address: string;
    formatted_address: string;
    locality: string;
    region: string;
    country: string;
    postcode: string;
  };
  timezone: string;
}

const foursquare = {
  CLIENT_ID: "QFMSNEWT5412BKBVIGV3HBAJYHZ2RXXYXQ2U0AWS2OGX01IA",
  CLIENT_SECRET: "3UDUWLIXP5RYISSMQOXN4KBK4IBQN1O0NZUU5OE5ITTKFEMG",
  v: "20220925",
};

const fetchVenues = async ({
  query,
  near,
}: {
  query: string;
  near: string;
}): Promise<Venue[]> => {
  const url = `https://api.foursquare.com/v3/places/search?query=${encodeURIComponent(
    query
  )}&near=${encodeURIComponent(near)}&client_id=${
    foursquare.CLIENT_ID
  }&client_secret=${foursquare.CLIENT_SECRET}&v=${foursquare.v}`;

  try {
    const res = await fetch(url, {
      headers: {
        Authorization: "fsq3fpjmjiA1An7xQlMYQ3z+a1kovuhPPKHBz+/5WoVgrTw=",
        "Content-Type": "application/json",
      },
    });
    const json = await res.json();
    return json.results ?? [];
  } catch (err) {
    console.error("Error fetching venues:", err);
    return [];
  }
};

export const CalForm = () => {
  const [shows, setShows] = useState<Show[]>([]);
  const [form, setForm] = useState<Partial<Show>>({});
  const [city, setCity] = useState("");
  const [state, setState] = useState("");
  const [venueInput, setVenueInput] = useState("");
  const [venueSuggestions, setVenueSuggestions] = useState<Venue[]>([]);
  const [selectedVenue, setSelectedVenue] = useState<Venue | null>(null);
  const debounceRef = useRef<NodeJS.Timeout | null>(null);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleVenueSelect = (venue: Venue) => {
    setSelectedVenue(venue);
    setVenueInput(venue.name);
    setForm({
      ...form,
      location: `${venue.name}, ${venue.location.formatted_address}`,
    });
    setVenueSuggestions([]);
  };

  const formattedVenueList = useCallback(() => {
    return venueSuggestions.map((v) => ({
      id: v.fsq_id,
      name: v.name,
      address: v.location.formatted_address,
    }));
  }, [venueSuggestions]);

  useEffect(() => {
    if (venueInput.trim().length < 3 || !city || !state) {
      setVenueSuggestions([]);
      return;
    }

    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(async () => {
      const near = `${city}, ${state}`;
      const venues = await fetchVenues({ query: venueInput, near });

      if (venues.length === 1) {
        handleVenueSelect(venues[0]);
      } else {
        setVenueSuggestions(venues);
      }
    }, 300);
  }, [venueInput, city, state]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (form.title && form.date && form.location) {
      const newShow: Show = {
        id: Date.now(),
        title: form.title,
        date: form.date,
        location: form.location,
      };
      setShows([...shows, newShow]);
      setForm({});
      setVenueInput("");
      setSelectedVenue(null);
    }
  };

  const handleDelete = (id: number) => {
    setShows(shows.filter((show) => show.id !== id));
  };

  return (
    <div className="max-w-xl mx-auto p-6 bg-white rounded-lg shadow-lg relative">
      <h2 className="text-2xl font-bold mb-4 text-center">
        Manage Shows Calendar
      </h2>
      <form onSubmit={handleSubmit} className="mb-6 space-y-4">
        <input
          name="title"
          type="text"
          placeholder="Show Title"
          value={form.title || ""}
          onChange={handleChange}
          className="w-full px-3 py-2 border rounded"
          required
        />
        <input
          name="date"
          type="date"
          value={form.date || ""}
          onChange={handleChange}
          className="w-full px-3 py-2 border rounded"
          required
        />
        <div className="flex space-x-2">
          <input
            type="text"
            placeholder="City"
            value={city}
            onChange={(e) => setCity(e.target.value)}
            className="w-1/2 px-3 py-2 border rounded"
            required
          />
          <input
            type="text"
            placeholder="State"
            value={state}
            onChange={(e) => setState(e.target.value)}
            className="w-1/2 px-3 py-2 border rounded"
            required
          />
        </div>
        <input
          type="text"
          placeholder="Search Venue"
          value={venueInput}
          onChange={(e) => {
            setVenueInput(e.target.value);
            setSelectedVenue(null);
          }}
          className="w-full px-3 py-2 border rounded"
        />
        {venueSuggestions.length > 0 && (
          <ul className="absolute z-20 bg-white border w-full rounded max-h-60 overflow-y-auto">
            {formattedVenueList().map((venue) => (
              <li
                key={venue.id}
                onClick={() =>
                  handleVenueSelect(
                    venueSuggestions.find((v) => v.fsq_id === venue.id)!
                  )
                }
                className="px-4 py-2 hover:bg-gray-100 cursor-pointer"
              >
                <strong>{venue.name}</strong>
                <div className="text-sm text-gray-600">{venue.address}</div>
              </li>
            ))}
          </ul>
        )}
        <input
          name="location"
          type="text"
          placeholder="Selected Venue Address"
          value={form.location || ""}
          onChange={handleChange}
          className="w-full px-3 py-2 border rounded"
          required
        />
        <button
          type="submit"
          className="w-full bg-blue-600 text-white py-2 rounded hover:bg-blue-700 transition"
        >
          Add Show
        </button>
      </form>

      <div>
        <h3 className="text-xl font-semibold mb-2">Upcoming Shows</h3>
        <ul className="space-y-3">
          {shows.map((show) => (
            <li
              key={show.id}
              className="flex items-center justify-between bg-gray-100 p-3 rounded"
            >
              <div>
                <span className="font-medium">{show.title}</span>
                <span className="ml-2 text-gray-600">{show.date}</span>
                <span className="ml-2 text-gray-500">{show.location}</span>
              </div>
              <button
                onClick={() => handleDelete(show.id)}
                className="text-red-500 hover:text-red-700 px-2 py-1 rounded"
                aria-label="Delete show"
              >
                ✕
              </button>
            </li>
          ))}
          {shows.length === 0 && (
            <li className="text-gray-500 text-center">No shows scheduled.</li>
          )}
        </ul>
      </div>
    </div>
  );
};

export default CalForm;
