import React from "react";
import { useState, useEffect } from "react";
import Link from "next/link";
import Container from "./container";
import SectionHeading from "./section-heading";
import useShows from "@/hooks/useShows";
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

const getSchedule = (
  date: string | number | Date,
  duration: number
): Schedule => {
  const start = new Date(date);
  const end = new Date(start.getTime() + duration * 60 * 60 * 1000);

  return {
    start: parseDate(start),
    end: parseDate(end),
  };
};

type Props = {
  shows: ClientShow[] | undefined | null;
};

const UpcomingShows: React.FC<Props> = ({ shows }: Props) => {
  // const { isRTL } = useLayout();
  if (!shows?.length) return null;
  // console.log("🚀 ~ UpcomingShows ~ shows:", shows[0]);
  return (
    <div id="shows" className="bg-bg-dark">
      <Container className="py-section">
        <SectionHeading>
          <h2 className="uppercase text-center">upcoming shows</h2>
        </SectionHeading>
        <div className="flex divide-y divide-light-dark flex-col">
          {shows.map((show) => {
            const schedule = getScheduleFromTimestamps({
              start: show.scheduledStart,
              stop: show.scheduledStop,
            });
            const cancelled = show.showStatus === "cancelled";
            const passed = show.scheduledStop < Date.now();

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
                    {show.venueName}
                  </h4>
                  <h4
                    className={`${
                      cancelled
                        ? "strike"
                        : "transition-all duration-300 ease-linear group-hover:text-rose"
                    }  text-center md:text-start md:line-clamp-1`}
                  >
                    {(show.venue?.location?.formatted_address ||
                      show.showTitle) ??
                      show.title ??
                      ""}
                  </h4>
                </div>

                {!cancelled && (
                  <Image
                    src={
                      show.image ??
                      `/img/landon/${Math.floor(Math.random() * 25) + 1}.jpg`
                    }
                    className={twMerge(
                      "absolute  scale-0 group-hover:scale-100 left-1/3  duration-500 transition-all top-5 md:top-[-40px] rotate-0  w-[13rem] h-[17rem] object-cover",
                      "md:left-2/3 group-hover:rotate-45"
                    )}
                    width={220}
                    height={195}
                    alt={show.showTitle ?? show.title ?? "Show Image"}
                  />
                )}
                {cancelled ? (
                  <span className="cancelled">CANCELLED</span>
                ) : (
                  <span className="font-medium uppercase text-rose">{`${schedule.start.hr} - ${schedule.end.hr}`}</span>
                )}
              </div>
            );
          })}
        </div>
      </Container>
    </div>
  );
};
export default UpcomingShows;
