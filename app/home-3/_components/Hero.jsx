// Main container wrapper 1170px d31448

import Container from "@/components/container";

//method call
const Hero = () => {
  return (
    <section className="min-h-screen relative isolate  py-10">
      <video
        className="absolute inset-0 w-full h-full object-cover"
        src="/video/hero.mp4"
        autoPlay
        loop
        muted
        playsInline
      />

      <div className="absolute z-20 inset-0 bg-bg-overly bg-opacity-40"></div>

      <Container className="relative z-30 flex flex-col justify-center min-h-screen">
        <div className="flex flex-col pt-20 pb-10 sm:pb-0 sm:pt-0 justify-center md:justify-start items-center md:items-start text-center md:text-start">
          <h1 className="capitalize mt-10 leading-[90px] font-poppins text-7xl sm:text-8xl md:text-[120px] font-extrabold text-white mb-10">
            Unleash <br />
            <span className="text-4xl sm:text-6xl md:text-8xl">
              the Rhythm Within
            </span>
          </h1>
          <p className="max-w-[600px] mb-10">
            Discover the heartbeat of our music brand. We bring passion,
            creativity, and rhythm together to create unforgettable soundscapes.
            Whether you re an artist looking for inspiration or a listener
            searching for the next anthem
          </p>
          <button className="h-16 w-[245px] rounded-full text-base font-normal font-poppins bg-rose grid place-content-center  hover:bg-white  duration-500 hover:text-bg-dark transition-all">
            Read More
          </button>
        </div>
      </Container>
    </section>
  );
};

export default Hero;
