"use client";

import React, { useState, useEffect, useCallback } from "react";
import { PrevButton, NextButton } from "./HeroButtons";
import useEmblaCarousel from "embla-carousel-react";

import Fade from "embla-carousel-fade";
import Autoplay from "embla-carousel-autoplay";

const heroSlider = [
  {
    image: "/img/home4/hero/hero2.jpg",
    title: "Feel the Pulse of Music That Moves the World",
    description:
      "Step into the world of rhythm where every beat moves your soul. Experience the power of music like never before.",
  },
  {
    image: "/img/home4/hero/hero2.jpg",
    title: "Unleash Your Creative Genius with Sound That Inspires",
    description:
      "From idea to melody, we help artists turn their inspiration into unforgettable tracks. Let your creativity flow.",
  },
  {
    image: "/img/home4/hero/hero1.jpg",
    title: "Discover the Soundtrack to Every Moment of Your Life",
    description:
      "Find the perfect soundtrack for every moment. Our curated playlists are designed to match your every mood and occasion.",
  },
  {
    image: "/img/home4/hero/hero4.jpg",
    title: "Join a Thriving Community of Music Lovers and Creators",
    description:
      "Connect with fellow music lovers and creators. Share your passion and grow together in our vibrant community.",
  },
];

const Hero = () => {
  const [emblaRef, embla] = useEmblaCarousel(
    {
      align: "center",
      slidesToScroll: 1,
      loop: true,
      containScroll: false,
    },
    [Fade(), Autoplay({ delay: 4000 })]
  );

  const scrollPrev = useCallback(() => embla && embla.scrollPrev(), [embla]);
  const scrollNext = useCallback(() => embla && embla.scrollNext(), [embla]);

  return (
    <>
      <div className="embla">
        <div ref={emblaRef} className="overflow-hidden">
          <div className="flex ">
            {heroSlider.map((hero, index) => (
              <div className="grow-0 shrink-0 basis-full " key={index}>
                <div
                  style={{
                    backgroundImage: `url(${hero.image})`,
                    backgroundPosition: "center",
                    backgroundRepeat: "no-repeat",
                    backgroundSize: "cover ",
                  }}
                  className="min-h-screen duration-300 transition-all relative isolate flex items-center justify-center"
                >
                  <div className="inset-0 absolute bg-bg-dark/50"></div>
                  <div className="max-w-container relative z-10 mx-auto px-container text-center justify-center flex flex-col items-center">
                    <h1 className="font-poppins line-clamp-3 capitalize mt-10 text-3xl sm:text-6xl md:leading-snug md:text-7xl font-extrabold text-white mb-6">
                      {hero.title}
                    </h1>
                    <p className="max-w-[600px] mb-8">{hero.description}</p>
                    <button className="h-16 w-[245px] rounded-full text-base font-normal font-poppins bg-lime text-bg-dark grid place-content-center  hover:bg-white  duration-500 hover:text-bg-dark transition-all">
                      Read More
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        <PrevButton onClick={scrollPrev} />
        <NextButton onClick={scrollNext} />
      </div>
    </>
  );
};

export default Hero;
