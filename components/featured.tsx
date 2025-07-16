"use client";
import { CiPlay1 } from "react-icons/ci";
import Image from "next/image";
import { useState } from "react";
import dynamic from "next/dynamic";
import Container from "./container";
import MoreFeatured from "./more-featured";
import { feature } from "@/data/data";

import "@/styles/featured.css";

const LazyReactPlayer = dynamic(() => import("react-player"), {
  ssr: false,
});

interface FeatureData {
  heading: string;
  about: string;
}

const Featured: React.FC = () => {
  const [showMore, setShowMore] = useState<boolean>(false);

  const videoUrl: string =
    "https://www.youtube.com/embed/6a6TYM3-0EA?si=F2TY-Wcs69c587I6";
  const [play, setPlay] = useState<boolean>(false);

  const toggleMore = (): void => {
    setShowMore(!showMore);
  };

  const renderShowMore = (): JSX.Element =>
    !showMore ? (
      <div onClick={toggleMore} className="cursor-pointer">
        <div className="font-medium text-rose hover:text-white duration-300 transition-all ease-linear">
          MORE ABOUT LANDON &gt;
        </div>
      </div>
    ) : (
      <div onClick={toggleMore} className="cursor-pointer">
        <div className="font-medium text-rose hover:text-white duration-300 transition-all ease-linear">
          LESS ABOUT LANDON &gt;
        </div>
      </div>
    );

  const featureData: FeatureData = feature;
  const heading: string = featureData.heading;
  const words: string[] = heading.split(" ");
  const ln1: string = words?.slice(0, words.length / 2).join(" ");
  const ln2: string = words?.slice(words.length / 2).join(" ");

  return (
    <section
      id="featured_music"
      className="relative isolate bg-featured bg-cover bg-no-repeat"
    >
      <div className="absolute z-10 inset-0 bg-bg-dark bg-opacity-90"></div>
      <Container>
        <div className="relative py-section z-20 flex flex-col lg:flex-row gap-20 lg:items-center px-container">
          <div data-aos="fade-up" className="flex-1 text-center lg:text-start ">
            <h2>{heading}</h2>
            <p className="more text-cyan mx-auto lg:mx-0 mt-10 mb-12 max-w-[533px]">
              {featureData.about}
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
          <div
            data-aos="fade-up"
            className="more relative z-20 lg:items-center px-container"
          >
            <MoreFeatured />
            {renderShowMore()}
          </div>
        )}
      </Container>
    </section>
  );
};

export default Featured;
