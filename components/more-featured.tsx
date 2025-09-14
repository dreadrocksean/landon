"use client";
import React from "react";
import { feature } from "@/data/data";

type Props = {
  text?: string;
};

const Featured: React.FC<Props> = ({ text }) => (
  <>
    {feature.more.map((paragraph: string, i: number) => (
      <p key={i} className="text-cyan mx-auto lg:mx-0 mt-10 mb-12">
        {paragraph}
      </p>
    ))}
  </>
);

export default Featured;
