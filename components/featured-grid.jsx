import Image from "next/image";
//method call
const FeaturedGrid = () => {
  return (
    <section
      id="gallery"
      className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4"
    >
      <div className="relative h-[480px] sm:h-96 lg:h-[520px] md:col-span-2">
        <Image
          fill
          className="w-full object-cover"
          src={"/img/landon/1.jpg"}
          sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
          alt=""
        />
      </div>
      <div className="relative h-[480px] sm:h-96 lg:h-[520px]">
        <Image
          fill
          className="w-full object-cover"
          src={"/img/landon/2.jpg"}
          sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
          alt=""
        />
      </div>
      <div className="relative h-[480px] sm:h-96 lg:h-[520px]">
        <Image
          fill
          className="w-full object-cover"
          src={"/img/landon/3.jpg"}
          sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
          alt=""
        />
      </div>
      <div className="relative h-[480px] sm:h-96 lg:h-[520px]">
        <Image
          fill
          className="w-full object-cover"
          src={"/img/landon/4.jpg"}
          sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
          alt=""
        />
      </div>
      <div className="relative h-[480px] sm:h-96 lg:h-[520px]">
        <Image
          fill
          className="w-full object-cover"
          src={"/img/landon/5.jpg"}
          sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
          alt=""
        />
      </div>
      <div className="relative  md:col-span-3 lg:col-span-2 h-[480px] sm:h-96 lg:h-[520px]">
        <Image
          fill
          className="w-full object-cover"
          src={"/img/home/grid6.png"}
          sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
          alt=""
        />
      </div>
    </section>
  );
};
export default FeaturedGrid;
