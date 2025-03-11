"use client";

import Link from "next/link";
import Container from "./container";
import SectionHeading from "./section-heading";
// Mock data for upcoming shows
import { shows } from "@/data/data";
import Image from "next/image";
import { useLayout } from "@/app/LayoutProvider";
import { twMerge } from "tailwind-merge";

const parseDate = (date) => ({
  day: date.getDate(),
  hr: date.toLocaleString("default", { timeStyle: "short" }),
  month: date.toLocaleString("default", { month: "short" }),
  week: date.toLocaleString("default", { weekday: "short" }),
  min: date.toLocaleString("default", { minute: "numeric" }),
});

const getSchedule = (date, duration) => {
  const start = new Date(date);
  const end = new Date(start.getTime() + duration * 60 * 60 * 1000);

  return {
    start: parseDate(start),
    end: parseDate(end),
  };
};

//method call
const UpcomingShows = () => {
  const { isRTL } = useLayout();

  return (
    <div id="shows" className="bg-bg-dark">
      <Container className="py-section">
        <SectionHeading>
          <h2 className="uppercase text-center">upcoming shows</h2>
        </SectionHeading>
        <div className="flex divide-y divide-light-dark flex-col">
          {shows.map((show) => {
            const schedule = getSchedule(show.date, show.duration);

            return (
              <div
                key={show.id}
                // href="/"
                className="flex gap-4 flex-col md:flex-row group transition-all relative isolate py-8 items-center justify-between"
              >
                <div className="flex flex-col md:flex-row items-center gap-6 md:gap-16">
                  <div className="flex gap-10">
                    <span className="text-5xl font-bold">
                      {schedule.start.day}
                    </span>
                    <div className="flex flex-col font-medium">
                      <span>{schedule.start.month}</span>
                      <span>{schedule.start.week}</span>
                    </div>
                  </div>
                  <h4 className="font-bold transition-all duration-300 ease-linear group-hover:text-rose  text-xl text-center md:text-start md:line-clamp-1">
                    {show.venue}
                  </h4>
                </div>

                <Image
                  src={show.image}
                  className={twMerge(
                    "absolute  scale-0 group-hover:scale-100 left-1/3  duration-500 transition-all top-5 md:top-[-40px] rotate-0  w-[13rem] h-[17rem] object-cover",
                    isRTL
                      ? "md:right-2/3 group-hover:-rotate-45"
                      : "md:left-2/3 group-hover:rotate-45"
                  )}
                  width={220}
                  height={195}
                  alt={show.title}
                />
                <span className="font-medium uppercase text-rose">{`${schedule.start.hr} - ${schedule.end.hr}`}</span>
              </div>
            );
          })}
        </div>
      </Container>
    </div>
  );
};
export default UpcomingShows;
