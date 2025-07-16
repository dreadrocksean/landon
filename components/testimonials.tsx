"use client";

import { testimonials } from "@/data/data";
import Container from "./container";
import SectionHeading from "./section-heading";
import Image from "next/image";
import "../styles/testimonials.css";
import { twMerge } from "tailwind-merge";
import useEmblaCarousel, { UseEmblaCarouselType } from "embla-carousel-react";
import useEmblaDotButton from "@/hooks/useEmblaDotButton";
import Autoplay from "embla-carousel-autoplay";
import { useLayout } from "@/app/LayoutProvider";

type Testimonial = {
  id: string | number;
  image: string;
  quote: string;
  signature: string;
};

const Testimonials: React.FC = () => {
  const { isRTL } = useLayout();

  const [emblaRef, emblaApi] = useEmblaCarousel(
    {
      dragFree: true,
      containScroll: "trimSnaps",
    },
    [Autoplay()]
  );

  const { selectedIndex, onDotButtonClick } = useEmblaDotButton(
    emblaApi as UseEmblaCarouselType | undefined
  );

  return (
    <div dir="ltr" className="bg-bg-dark">
      <Container className="py-section">
        <SectionHeading>
          <h2 className="uppercase">THEY SAID</h2>
        </SectionHeading>
        <div className="embla_testimonial px-container" ref={emblaRef}>
          <div className="flex gap-4 embla__container_testimonial">
            {testimonials.map((testimonial: Testimonial) => (
              <div
                dir={isRTL ? "rtl" : "ltr"}
                key={testimonial.id}
                className="embla__slide_testimonial"
              >
                <article className="flex flex-col md:flex-row gap-6 md:gap-12 md:items-start lg:pl-28 items-center">
                  <div className="flex items-center">
                    <Image
                      src={"/img/home/quote.png"}
                      width={149}
                      height={146}
                      alt=""
                      className="mt-0 -mr-14 sm:-mr-10 md:-mr-6  lg:-mr-6"
                    />
                    <Image
                      className="rounded-full object-cover w-[168px] h-[168px]"
                      src={testimonial.image}
                      width={168}
                      height={168}
                      alt=""
                    />
                  </div>
                  <div>
                    <h4 className="text-center ml-auto sm:ml-0 sm:text-start font-semibold text-xl mt-8 max-w-2xl mb-6">
                      {testimonial.quote}
                    </h4>
                    <span className=" text-2xl block w-fit ml-auto md:ml-0 font-signature text-rose">
                      {testimonial.signature}
                    </span>
                  </div>
                </article>
              </div>
            ))}
          </div>
        </div>
        <div className="flex gap-4 mt-5 sm:mt-1 justify-center sm:justify-end">
          {testimonials.map((item: Testimonial, index: number) => (
            <button
              key={index}
              onClick={() => onDotButtonClick(index)}
              className={twMerge(
                "text-lg",
                index === selectedIndex ? "text-rose" : "text-white"
              )}
            >
              {index + 1}
            </button>
          ))}
        </div>
      </Container>
    </div>
  );
};

export default Testimonials;
