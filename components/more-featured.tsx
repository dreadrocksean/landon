"use client";
import { feature } from "@/data/data";

const Featured: React.FC = () => (
  <>
    {feature.more.map((paragraph: string, i: number) => (
      <p key={i} className="text-cyan mx-auto lg:mx-0 mt-10 mb-12">
        {paragraph}
      </p>
    ))}
  </>
);

export default Featured;
