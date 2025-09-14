import Image from "next/image";
import React, { FC } from "react";

type Props = {
  images?: string[];
};

const FeaturedGrid: FC<Props> = ({ images }) =>
  images?.length ? (
    <section
      id="gallery"
      className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4"
    >
      {images.map((url, index) => (
        <div key={index} className="relative h-[480px] sm:h-96 lg:h-[520px]">
          <Image
            fill
            className="w-full object-cover"
            src={url}
            sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
            alt=""
          />
        </div>
      ))}
    </section>
  ) : null;

export default FeaturedGrid;
