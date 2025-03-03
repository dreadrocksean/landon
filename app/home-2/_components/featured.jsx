"use client";
import { CiPlay1 } from "react-icons/ci";
import Link from "next/link";
import Image from "next/image";
import { useState } from "react";
import dynamic from "next/dynamic";
import Container from "@/components/container";

const LazyReactPlayer = dynamic(() => import("react-player"), {
  ssr: false,
});

//method call
const Featured = () => {
  const videoUrl =
    "https://www.youtube.com/embed/K4DyBUG242c?si=y05o4Db44jM4XZRV";
  const [play, setPlay] = useState(false);

  return (
    <section className="bg-white text-bg-dark">
      <Container>
        <div className=" py-section flex flex-col lg:flex-row gap-20 lg:items-center px-container">
          <div data-aos="fade-up" className="flex-1 text-center lg:text-start ">
            <h2>
              SOMETIMES WE RISE <br className="hidden lg:block" />
              TO THE OCCASION
            </h2>
            <p className="text-cyan  mx-auto lg:mx-0 mt-10 mb-12 max-w-[533px]">
              Velit egestas dui id ornare arcu. Nibh sit amet commodo nulla
              nullam vehicula. Arcu dictum varius duis at consectetur. Faucibus
              nisl tincidunt eget nullam facilisis gravida neque.
            </p>
            <Link
              className="font-medium text-bg-dark hover:text-lime duration-300 transition-all ease-linear"
              href="/"
            >
              MORE ABOUT US
            </Link>
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
      </Container>
    </section>
  );
};
export default Featured;
