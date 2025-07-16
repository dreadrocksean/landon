import Image from "next/image";
import type { FC } from "react";

const FeaturedGrid: FC = () => (
  <section
    id="gallery"
    className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4"
  >
    <div className="relative h-[480px] sm:h-96 lg:h-[520px] md:col-span-2">
      <Image
        fill
        className="w-full object-cover"
        src={"/img/landon/9.jpg"}
        sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
        alt=""
      />
    </div>
    <div className="relative h-[480px] sm:h-96 lg:h-[520px]">
      <Image
        fill
        className="w-full object-cover"
        src={"/img/landon/12.jpg"}
        sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
        alt=""
      />
    </div>
    <div className="relative h-[480px] sm:h-96 lg:h-[520px]">
      <Image
        fill
        className="w-full object-cover"
        src={"/img/landon/13.jpg"}
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
        src={"/img/landon/25.jpg"}
        sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
        alt=""
      />
    </div>
    <div className="relative  md:col-span-3 lg:col-span-2 h-[480px] sm:h-96 lg:h-[520px]">
      <Image
        fill
        className="w-full object-cover"
        src={"/img/landon/19.jpg"}
        sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
        alt=""
      />
    </div>
  </section>
);

export default FeaturedGrid;
