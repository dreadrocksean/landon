import React from "react";
import Container from "./container";
import Image from "next/image";
import "@/styles/hero.css";

// Sizing and framing both used to go wrong on a phone, in ways that looked
// like one bug:
//
//  - `bg-cover` with no `bg-center`. background-position defaults to 0% 0%,
//    so a wide photo in a tall viewport showed its top-LEFT corner and
//    nothing else. On the stock stage shot that is empty haze: the band the
//    picture is of was off-screen entirely.
//
//  - 100vh of section plus py-10 plus a second 100vh on the Container
//    inside it, which made the hero exactly 80px taller than the screen it
//    was supposed to fill. The padding now lives on the inner element, which
//    grows to fill rather than adding to the total.
//
// svh rather than vh because on a phone `vh` is measured against the viewport
// with the browser chrome retracted, so a `100vh` hero is always taller than
// what you can actually see when the page first loads.
interface HeroProps {
  basic?: boolean;
  title?: string;
  artistName?: string;
  image?: string;
}

/* const init = {
  title: "CHECKOUT KC'S NEWEST PHENOMENON",
  artistName: "Landon",
  image: "/img/home/home-hero-bg-2.jpg",
  basic: false,
}; */

const Hero: React.FC<HeroProps> = ({
  artistName /* = init.artistName */,
  title /* = init.title */,
  basic /* = init.basic */,
  image /* = init.image */,
}) => (
  <section
    className={`${
      !basic
        ? "min-h-[calc(100svh-var(--notice-h,0px))] flex flex-col "
        : "short-hero "
    }relative isolate bg-cover bg-center bg-no-repeat`}
    style={{
      backgroundImage: `url(${image})`,
    }}
  >
    <div
      className="z-10 absolute inset-0 left-[0%] right-[0%] bg-center bg-contain bg-no-repeat"
      style={{ backgroundColor: "#110127aa" }}
    ></div>

    <div className="absolute z-20 inset-0 bg-bg-overly bg-opacity-20"></div>

    {!basic && (
      <Container className="relative z-30 flex flex-1 flex-col justify-center py-10">
        <>
          <h1
            data-aos="fade-up"
            /* One fluid size instead of a four-step ramp, because the
               headline is an artist's NAME and names do not agree to be
               short. The fixed ramp overflowed at two different widths:
               "CHRISTOPHER MICHAEL FOGLIO" rendered its longest word 465px
               wide in a 390px phone, and at the md step's 160px it pushed a
               768px tablet sideways by 296px.

               12vw keeps an eleven-character word inside the viewport at
               every width, and the 11.25rem ceiling is the lg size the
               design already used, so nothing shrinks on a desktop.
               break-words is the backstop for a name longer than any of
               this anticipated: ugly beats a page that scrolls sideways. */
            className="hero-text text-[clamp(2.5rem,12vw,11.25rem)] uppercase text-center break-words leading-snug md:leading-[0.95] font-bold my-20 sm:my-32 md:my-40"
          >
            {artistName?.toUpperCase()}
          </h1>
          <div className="flex flex-col lg:flex-row gap-10 items-center justify-between">
            <p className="text-base text-center lg:text-start font-medium uppercase">
              {title?.toUpperCase()}
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
      </Container>
    )}
  </section>
);

export default Hero;
