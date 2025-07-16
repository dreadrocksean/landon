"use client";

import { Timestamp } from "firebase/firestore";
import React, { useState, useEffect, useCallback, useRef, use } from "react";
import { useRouter } from "next/navigation";
import ReactDatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";
import { getLocalISOString } from "@/utils/date";

import useAuth from "@/hooks/useAuth";
import useShows from "@/hooks/useShows";

import "@/styles/calendar-form.css";

export interface GeneralDBDocument {
  id: number;
  created_at: Timestamp;
  updated_at?: string;
}

type Show = {
  id: number;
  title: string;
  scheduledStart: string;
  scheduledStop: string;
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

const init = {
  city: "Lenexa",
  state: "KS",
  title: "Test Show",
  scheduledStart: getLocalISOString(new Date()), // optional default time
  scheduledStop: getLocalISOString(new Date(Date.now() + 4 * 60 * 60 * 1000)), // 4 hours in the future
};

export const CalForm = () => {
  const { shows, addShow, removeShow, user, artist, isLoading, error } =
    useShows();
  const { isAuthenticated } = useAuth();
  console.log("🚀 ~ CalForm ~ isAuthenticated:", isAuthenticated);
  const router = useRouter();
  const [form, setForm] = useState<Partial<Show>>({});
  const [city, setCity] = useState("");
  const [state, setState] = useState("");
  const [venueInput, setVenueInput] = useState("");
  const [venueSuggestions, setVenueSuggestions] = useState<Venue[]>([]);
  const debounceRef = useRef<NodeJS.Timeout | null>(null);

  const artistId = artist?.id ?? "";

  useEffect(() => {
    if (!isAuthenticated) {
      router.push("/login");
    } else {
      router.push("/calendar");
    }
  }, [isAuthenticated]);

  useEffect(() => {
    // Initialize form with default values
    setForm({
      venue: null,
      title: init.title,
      scheduledStart: init.scheduledStart, // optional default time
      scheduledStop: init.scheduledStop, // 4 hours in the future
    });
    setCity(init.city);
    setState(init.state);
  }, []);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleVenueSelect = (venue: Venue) => {
    setVenueInput(venue.name);
    // setCity(`${venue.location?.locality}, ${venue.location?.dma}`);
    setForm({
      ...form,
      venue,
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

  const handleSubmit = useCallback(
    async (e: React.FormEvent) => {
      e.preventDefault();
      if (form.scheduledStart && form.scheduledStop) {
        const start = new Date(form.scheduledStart);
        const end = new Date(form.scheduledStop);
        if (start >= end) {
          alert("End time must be after start time.");
          return;
        }
      }

      if (form.title && form.scheduledStart && form.scheduledStop) {
        try {
          const response = await fetch("/api/calendar", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ ...form, artistId }),
          });

          const data = await response.json();

          if (data.success) {
            const newShow: Show = {
              id: data.id,
              title: form.title,
              scheduledStart: form.scheduledStart,
              scheduledStop: form.scheduledStop,
            };
            // setShows([...shows, newShow]);
            setForm({});
            setVenueInput("");
          } else {
            alert(`Error: ${data.error}`);
          }
        } catch (error) {
          alert("Failed to save show.");
        }
      }
    },
    [form, artistId]
  );

  const handleDelete = (showId: string) => {
    removeShow({ showId, artistId });
  };

  return (
    <div className="max-w-xl mx-auto p-6 bg-white rounded-lg shadow-lg relative">
      <h2 className="text-2xl text-gray-500 font-bold mb-4 text-center">
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
        <div className="flex space-x-2">
          <ReactDatePicker
            selected={
              form.scheduledStart ? new Date(form.scheduledStart) : null
            }
            onChange={(date) =>
              setForm({
                ...form,
                scheduledStart: date?.toISOString() ?? "",
              })
            }
            showTimeSelect
            timeIntervals={15}
            dateFormat="Pp"
            placeholderText="Start time"
            className="w-full px-3 py-2 border rounded"
          />
          <ReactDatePicker
            selected={form.scheduledStop ? new Date(form.scheduledStop) : null}
            onChange={(date) =>
              setForm({ ...form, scheduledStop: date?.toISOString() ?? "" })
            }
            showTimeSelect
            timeIntervals={15}
            dateFormat="Pp"
            placeholderText="End time"
            className="w-full px-3 py-2 border rounded"
          />
        </div>

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
        <button
          type="submit"
          className="w-full bg-blue-600 text-white py-2 rounded hover:bg-blue-700 transition"
        >
          Add Show
        </button>
      </form>
      <div>
        <h3 className="text-gray-500 text-xl font-semibold mb-2">
          Upcoming Shows
        </h3>
        <ul className="max-h-60 overflow-y-auto space-y-3">
          {shows.map((show) => {
            console.log(
              "🚀 ~ {shows.map ~ show.scheduledStart:",
              show.scheduledStart
            );
            return (
              <li
                key={show.id}
                className="flex justify-between items-center bg-gray-100 p-3 rounded"
              >
                <div>
                  <p className="font-medium text-black">{show.showTitle}</p>
                  <p className="text-sm text-gray-500">{show.venue}</p>
                  <p className="text-sm text-gray-600">
                    {show.scheduledStart
                      .toDate()
                      .toLocaleString()
                      .split(",")[0]
                      .trim()}
                  </p>
                  <p className="text-sm text-gray-600">
                    {show.scheduledStart
                      .toDate()
                      .toLocaleString()
                      .split(",")[1]
                      .trim()}{" "}
                    →{" "}
                    {show.scheduledStop
                      .toDate()
                      .toLocaleString()
                      .split(",")[1]
                      .trim()}
                  </p>
                </div>
                <button
                  onClick={() => handleDelete(show.id)}
                  className="text-red-500 hover:text-red-700"
                >
                  ✕
                </button>
              </li>
            );
          })}
          {shows.length === 0 && (
            <li className="text-gray-500 text-center">No shows scheduled.</li>
          )}
        </ul>
      </div>
    </div>
  );
};

export default CalForm;
