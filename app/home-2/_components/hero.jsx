// Main container wrapper 1170px
import Container from "@/components/container";
//method call
const Hero = () => {
  return (
    <section className="min-h-screen relative isolate bg-hero2 bg-cover bg-no-repeat py-10 overflow-hidden ">
      <div
        className="bg-hero2-text absolute inset-0 bg-no-repeat bg-bottom right-[-75%]"
        style={{ backgroundSize: "1078px" }}
      ></div>
      <div className="absolute z-10 inset-0 bg-bg-overly bg-opacity-10"></div>
      <Container className="relative z-20 flex flex-col justify-center min-h-screen sm:pt-32   md:pt-60 sm:pb-24   md:pb-56">
        <h1
          data-aos="fade-up"
          className=" text-7xl sm:text-9xl md:text-[160px] lg:text-[180px] uppercase mb-9 text-center md:text-start leading-snug md:leading-[160px] font-bold mt-20 "
        >
          STREM <br />
          YOUR MUSIC
        </h1>
        <div
          data-aos="zoom-in"
          className="flex justify-center md:justify-start text-md font-bold gap-5 items-center"
        >
          <span>Slide Band</span>
          <h5 className="text-[24px] uppercase leading-7"> 25.APRIL.2023 </h5>
          <span> Slide Show</span>
        </div>
      </Container>
    </section>
  );
};

export default Hero;
