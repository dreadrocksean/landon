"use client";

import { Timestamp } from "firebase/firestore";
import React, { useState, useEffect, useCallback, useRef } from "react";
import { useRouter } from "next/navigation";
import ReactDatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";
import { getLocalISOString } from "@/utils/date";

import useAuth from "@/hooks/useAuth";
import useShows from "@/hooks/useShows";

import "@/styles/calendar-form.css";

import { Venue, FirestoreShow, FSQVenue } from "@/lib/schema";

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
}): Promise<FSQVenue[]> => {
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

const localSchedule = {
  start: getLocalISOString(new Date()),
  end: getLocalISOString(new Date(Date.now() + 4 * 60 * 60 * 1000)),
};

export type Form = Omit<
  FirestoreShow,
  "id" | "createdAt" | "scheduledStart" | "scheduledStop"
> & {
  venue?: FSQVenue;
  scheduledStart?: Timestamp;
  scheduledStop?: Timestamp;
};

type Field = {
  city?: string;
  state?: string;
  venueInput?: string;
};

type VenueSuggestion = {
  id?: string; // Foursquare ID
  name: string; // Name of the venue
  address: string; // Formatted address
};

const init: Field = {
  city: "Lenexa",
  state: "KS",
  venueInput: "",
};

const initForm: Form = {
  title: "Test Show",
  scheduledStart: Timestamp.fromDate(new Date(localSchedule.start)),
  scheduledStop: Timestamp.fromDate(new Date(localSchedule.end)),
};

export const CalForm = () => {
  const { shows, addShow, removeShow, artist, isLoading, error } = useShows();
  const { isAuthenticated } = useAuth();
  const router = useRouter();
  const [form, setForm] = useState<Form>({
    title: initForm.title,
    scheduledStart: initForm.scheduledStart,
    scheduledStop: initForm.scheduledStop,
  });
  const [city, setCity] = useState(init.city);
  const [state, setState] = useState(init.state);
  const [venueInput, setVenueInput] = useState(init.venueInput);
  const [venueSuggestions, setVenueSuggestions] = useState<FSQVenue[]>([]);
  const [venueSuggestionSelected, setVenueSuggestionSelected] =
    useState<boolean>(false);
  const debounceRef = useRef<NodeJS.Timeout | null>(null);

  const artistId = artist?.id ?? "";

  useEffect(() => {
    if (!isAuthenticated) {
      router.push("/login");
    } else {
      router.push("/calendar");
    }
  }, [isAuthenticated]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleVenueSelect = (venue: FSQVenue) => {
    setVenueInput(venue.name);
    setForm({
      ...form,
      venue,
    });
    setVenueSuggestions([]);
  };

  const formattedVenueList = useCallback(
    () =>
      venueSuggestions.map((v) => ({
        id: v.fsq_id,
        name: v.name,
        address: v.location.formatted_address,
      })),
    [venueSuggestions]
  );

  useEffect(() => {
    if (
      (venueInput?.trim() ?? "").length > 2 &&
      city &&
      state &&
      !venueSuggestionSelected
    ) {
      if (debounceRef.current) clearTimeout(debounceRef.current);
      debounceRef.current = setTimeout(async () => {
        const near = `${city}, ${state}`;
        const venues = await fetchVenues({ query: venueInput!, near });

        if (venues.length === 1) {
          handleVenueSelect(venues[0]);
        } else {
          setVenueSuggestions(venues);
        }
      }, 300);
    } else {
      setVenueSuggestions([]);
    }
  }, [venueInput, city, state]);

  const handleSubmit = useCallback(
    async (e: React.FormEvent) => {
      e.preventDefault();
      try {
        await addShow(form);
        setForm({ ...initForm });
        setVenueInput("");
      } catch (error) {
        console.error("Error adding show:", error);
      }
    },
    [form, artistId]
  );

  const handleVenueDropdownSelect =
    (venue: VenueSuggestion, index: number) => () => {
      setVenueSuggestionSelected(true);
      handleVenueSelect(
        venueSuggestions.find(
          (v) => v.fsq_id === venue.id || venueSuggestions[index] === v
        ) as FSQVenue
      );
    };

  const handleDelete = (showId: string) => {
    removeShow({ showId, artistId });
  };

  const onVenueInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setVenueInput(e.target.value);
    setVenueSuggestionSelected(false);
    // if (debounceRef.current) clearTimeout(debounceRef.current);
    // setVenueSuggestions([]);
    // debounceRef.current = setTimeout(() => {
    //   if (e.target.value.trim().length > 2) {
    //     setVenueInput(e.target.value);
    //   } else {
    //     setVenueSuggestions([]);
    //   }
    // }, 300);
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
            selected={form.scheduledStart?.toDate() ?? null}
            onChange={(date) =>
              setForm({
                ...form,
                scheduledStart: date ? Timestamp.fromDate(date) : undefined,
              })
            }
            showTimeSelect
            timeIntervals={15}
            dateFormat="Pp"
            placeholderText="Start time"
            className="w-full px-3 py-2 border rounded"
          />
          <ReactDatePicker
            selected={form.scheduledStop ? form.scheduledStop.toDate() : null}
            onChange={(date) =>
              setForm({
                ...form,
                scheduledStop: date ? Timestamp.fromDate(date) : undefined,
              })
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
          onChange={onVenueInputChange}
          className="w-full px-3 py-2 border rounded"
        />
        {venueSuggestions.length > 0 && (
          <ul className="absolute z-20 bg-white border w-full rounded max-h-60 overflow-y-auto">
            {formattedVenueList().map((venue: VenueSuggestion, i) => (
              <li
                key={i}
                onClick={handleVenueDropdownSelect(venue, i)}
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
          {isLoading ? "Adding Show..." : "Add Show"}
        </button>
      </form>
      <div>
        <h3 className="text-gray-500 text-xl font-semibold mb-2">
          Upcoming Shows
        </h3>
        <ul className="max-h-60 overflow-y-auto space-y-3">
          {shows.map((show) => {
            return (
              <li
                key={show.id}
                className="flex justify-between items-center bg-gray-100 p-3 rounded"
              >
                <div>
                  <p className="font-medium text-black">{show.showTitle}</p>
                  <p className="text-sm text-gray-500">{show.venueName}</p>
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
