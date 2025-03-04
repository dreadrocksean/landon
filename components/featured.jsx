"use client";
import { CiPlay1 } from "react-icons/ci";
import Image from "next/image";
import { useState } from "react";
import dynamic from "next/dynamic";
import Container from "./container";
import MoreFeatured from "./more-featured";

import "@/styles/featured.css";

const LazyReactPlayer = dynamic(() => import("react-player"), {
  ssr: false,
});

//method call
const Featured = () => {
  const [showMore, setShowMore] = useState(false);

  const videoUrl =
    "https://www.youtube.com/embed/6a6TYM3-0EA?si=F2TY-Wcs69c587I6";
  const [play, setPlay] = useState(false);

  const toggleMore = () => {
    setShowMore(!showMore);
  };

  const renderShowMore = () =>
    !showMore ? (
      <div onClick={toggleMore} className="cursor-pointer">
        <div
          className="font-medium text-rose hover:text-white duration-300 transition-all ease-linear"
          href="#"
        >
          MORE ABOUT LANDON &gt;
        </div>
      </div>
    ) : (
      <div onClick={toggleMore} className="cursor-pointer">
        <div
          className="font-medium text-rose hover:text-white duration-300 transition-all ease-linear"
          href="#"
        >
          LESS ABOUT LANDON &gt;
        </div>
      </div>
    );

  return (
    <section
      id="featured_music"
      className="relative isolate bg-featured bg-cover bg-no-repeat"
    >
      <div className="absolute z-10 inset-0 bg-bg-dark bg-opacity-90"></div>
      <Container>
        <div className="relative py-section z-20 flex flex-col lg:flex-row gap-20 lg:items-center px-container">
          <div data-aos="fade-up" className="flex-1 text-center lg:text-start ">
            <h2>
              DISCOVER KANSAS CITY'S
              <br className="hidden lg:block" />
              NEWEST PHENOMENON
            </h2>
            <p className="more text-cyan mx-auto lg:mx-0 mt-10 mb-12 max-w-[533px]">
              Just 12 years old, Landon Bartholomew electrifies audiences
              everywhere he performs. He's not awesome "for his age". He's
              simply awesome! Performing professionally since he was 10, his
              confidence and audience participation defies his years. He's a
              cutie too!
            </p>
            {renderShowMore()}
          </div>
          <div data-aos="fade-up" className="flex-1 relative isolate">
            {!play && (
              <div className="absolute pointer-events-none inset-0 flex flex-col justify-center items-center pt-10">
                <div className="cursor-pointer w-20 h-20 rounded-full bg-gradient-to-r from-pink-500 text-xl grid place-content-center to-purple-600 mb-[-30px]">
                  <CiPlay1 />
                </div>
                <Image
                  src={"/img/home/WATCH.png"}
                  width={242}
                  height={95}
                  alt=""
                />
              </div>
            )}
            <div className="flex justify-center">
              <LazyReactPlayer
                url={videoUrl}
                style={{ maxWidth: "640px" }}
                width="100%"
                height="540px"
                controls
                onPlay={() => {
                  setPlay(true);
                }}
                onPause={() => {
                  setPlay(false);
                }}
              />
            </div>
          </div>
        </div>
        {showMore && (
          <div class="more relative z-20 lg:items-center px-container">
            <MoreFeatured />
            {renderShowMore()}
          </div>
        )}
      </Container>
    </section>
  );
};
export default Featured;
