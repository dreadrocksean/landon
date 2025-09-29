import React from "react";
import Container from "./container";
import Image from "next/image";
import "@/styles/hero.css";

interface HeroProps {
  basic?: boolean;
  title?: string;
  artistName?: string;
  image?: string;
}

const init = {
  title: "CHECKOUT KC'S NEWEST PHENOMENON",
  artistName: "Landon",
  image: "/img/home/home-hero-bg-2.jpg",
  basic: false,
};

const Hero: React.FC<HeroProps> = ({
  artistName = init.artistName,
  title = init.title,
  basic = init.basic,
  image = init.image,
}) => {
  // console.log("🚀 ~ Hero ~ image:", image);
  return (
    <section
      className={`${
        !basic ? "min-h-screen " : "short-hero "
      }relative isolate bg-cover bg-no-repeat py-10`}
      style={{
        backgroundImage: `url(${image})`,
      }}
    >
      <div
        className="z-10 absolute inset-0 left-[0%] right-[0%] bg-center bg-contain bg-no-repeat"
        style={{ backgroundColor: "#110127aa" }}
      ></div>

      <div className="absolute z-20 inset-0 bg-bg-overly bg-opacity-20"></div>

      <Container className="relative z-30 flex flex-col justify-center min-h-screen">
        {!basic && (
          <>
            <h1
              data-aos="fade-up"
              className="hero-text text-7xl sm:text-9xl md:text-[160px] lg:text-[180px] uppercase text-center leading-snug md:leading-[160px] font-bold my-20 sm:my-32 md:my-60"
            >
              {artistName.toUpperCase()}
            </h1>
            <div className="flex flex-col lg:flex-row gap-10 items-center justify-between">
              <p className="text-base text-center lg:text-start font-medium uppercase">
                {title.toUpperCase()}
              </p>
              <div className="trigger animate-bounce">
                <a href="#featured_music" className="">
                  <Image
                    src={"/img/home/scroll-down arrow.png"}
                    width={20}
                    height={42}
                    alt=""
                  />
                </a>
              </div>
            </div>
          </>
        )}
      </Container>
    </section>
  );
};

export default Hero;
