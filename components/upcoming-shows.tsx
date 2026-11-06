import React from "react";
import { useState, useEffect } from "react";
import Link from "next/link";
import Container from "./container";
import SectionHeading from "./section-heading";
import useShows from "@/hooks/useShows";
import CalendarSwitch from "./calendar-switch";
import Image from "next/image";
import { useLayout } from "@/app/LayoutProvider";
import { twMerge } from "tailwind-merge";

import "@/styles/shows.css";
import { ClientShow, Show } from "@/lib/schema";
import { Timestamp } from "firebase/firestore";

type Schedule = {
  start: {
    day: number;
    hr: string;
    month: string;
    week: string;
    min: string;
  };
  end: {
    day: number;
    hr: string;
    month: string;
    week: string;
    min: string;
  };
};

const parseDate = (date: Date) => ({
  day: date.getDate(),
  hr: date.toLocaleString("default", { timeStyle: "short" }),
  month: date.toLocaleString("default", { month: "short" }),
  week: date.toLocaleString("default", { weekday: "short" }),
  min: date.toLocaleString("default", { minute: "numeric" }),
});

const getScheduleFromTimestamps = ({
  start,
  stop,
}: {
  start: number;
  stop: number;
}): Schedule => {
  const startDate = Timestamp.fromMillis(start).toDate();
  const endDate = Timestamp.fromMillis(stop).toDate();
  return {
    start: parseDate(startDate),
    end: parseDate(endDate),
  };
};

type Props = {
  shows: ClientShow[] | undefined | null;
  /** False while the dates below are samples rather than the artist's own. */
  live?: boolean;
};

const UpcomingShows: React.FC<Props> = ({ shows, live = true }: Props) => {
  const empty = !shows?.length;
  return (
    <div id="shows" className="bg-bg-dark">
      <Container className="py-section">
        <SectionHeading>
          <h2 className="uppercase text-center">upcoming shows</h2>
        </SectionHeading>
        {/* Labelled on the section itself, not only in the page notice.
            Every other placeholder on this page costs a visitor nothing if
            they take it at face value; a made-up date at a made-up venue can
            put a real person outside a real door on a night when nothing is
            happening. That is worth saying twice. */}
        {!live && (
          <p className="-mt-10 mb-10 text-center text-sm font-bold uppercase tracking-[0.3em] text-rose">
            Sample dates
          </p>
        )}

        {/* Only reachable once the calendar is live, since the sample set is
            never empty. An artist with a live calendar and a quiet month
            gets this rather than the blank the section used to collapse to. */}
        {live && empty && (
          <p
            data-aos="fade-up"
            className="text-center text-cyan text-lg mx-auto max-w-xl"
          >
            No dates announced yet — check back soon.
          </p>
        )}
        <div className="flex divide-y divide-light-dark flex-col">
          {(shows ?? []).map((show) => {
            const schedule = getScheduleFromTimestamps({
              start: show.scheduledStart,
              stop: show.scheduledStop,
            });
            const cancelled = show.showStatus === "cancelled";
            const passed = show.scheduledStop < Date.now();
            // Private gigs keep their date/time public but hide the venue name
            // and address. Driven by the gig's own "Mark as Private" flag
            // (show.isPrivate); a private venue also counts.
            const isPrivate =
              show.isPrivate === true || show.venue?.isPrivate === true;

            return (
              <div
                key={show.id}
                className={`${
                  cancelled || passed ? "disabled" : ""
                } flex gap-4 flex-col md:flex-row group transition-all relative isolate py-8 items-center justify-between`}
              >
                <div className="flex flex-col md:flex-row items-center gap-6 md:gap-16">
                  <div className="flex gap-10">
                    <span className="text-5xl font-bold">
                      {schedule.start.day}
                    </span>
                    <div className="flex flex-col font-medium">
                      <span className="uppercase">{schedule.start.month}</span>
                      <span>{schedule.start.week}</span>
                    </div>
                  </div>
                  <h4
                    className={`${
                      cancelled
                        ? "strike"
                        : "transition-all duration-300 ease-linear group-hover:text-rose"
                    } font-bold text-xl text-center md:text-start md:line-clamp-1`}
                  >
                    {isPrivate ? "Private Event" : show.venueName}
                  </h4>
                  <h4
                    className={`${
                      cancelled
                        ? "strike"
                        : "transition-all duration-300 ease-linear group-hover:text-rose"
                    }  text-center md:text-start md:line-clamp-1`}
                  >
                    {isPrivate
                      ? ""
                      : (show.venue?.location?.formatted_address ||
                          show.showTitle) ??
                        show.title ??
                        ""}
                  </h4>
                </div>

                {cancelled ? (
                  <span className="cancelled">CANCELLED</span>
                ) : (
                  <span className="font-medium uppercase text-rose">{`${schedule.start.hr} - ${schedule.end.hr}`}</span>
                )}
              </div>
            );
          })}
        </div>
        {!live && <CalendarSwitch />}
      </Container>
    </div>
  );
};
export default UpcomingShows;
