"use client";
import { CiPlay1 } from "react-icons/ci";
import Link from "next/link";
import Image from "next/image";
import { useState } from "react";
import dynamic from "next/dynamic";
import Container from "./container";

const LazyReactPlayer = dynamic(() => import("react-player"), {
  ssr: false,
});

//method call
const Featured = () => (
  <div>
    {/* <h2>MORE ABOUT LANDON</h2> */}
    <p className="text-cyan mx-auto lg:mx-0 mt-10 mb-12 max-w-[533px]">
      For his 5th birthday, Landon received an electronic piano. The same one he
      plays till today. We soon found a teacher, John, who had a lot of other
      things going on, and was soon too busy to teach Landon. He suggested we
      try another teacher, Tatiana Kuleshova, his wife. Though thoroughly
      booked, Tatiana squeezed Landon in just for her husband and never looked
      back. The boy has since become one of her star pupils.
    </p>
    <p className="text-cyan mx-auto lg:mx-0 mt-10 mb-12 max-w-[533px]">
      At 6, he wanted to play his favorite pop songs and stop the classics to
      which he was met with - "No". The only way he got to play pop was if he
      met his classical training requirements.
    </p>
    <p className="text-cyan mx-auto lg:mx-0 mt-10 mb-12 max-w-[533px]">
      By the time Landon was 7, he had gravitated toward singing, which was fun
      for him but was obviously a piano first, singing second deal. We
      encouraged him to practice singing without the piano. We explained that
      the singing should not be the accompaniment to the piano but the other way
      round. It instantly clicked and it changed everything. He still sings at
      the top of his lungs in the shower. This is when he first learnt Bohemian
      Rhapsody, the short version.
    </p>
    <p className="text-cyan mx-auto lg:mx-0 mt-10 mb-12 max-w-[533px]">
      At 10, we asked Mike Rounkles, the owner of Jerry's Bait Shop, a
      successful and long running local music bar, if Landon could do an hour
      long show there. The performance impressed Mike so much that he offered
      Landon every last Wed for an hour before their famous Jam Night. Paid him
      50 bucks and a Landon negotiated Pizza, his favourite food.
    </p>
    <p className="text-cyan mx-auto lg:mx-0 mt-10 mb-12 max-w-[533px]">
      This is where Landon learnt to perform. Jerry's was his stomping ground.
      He started out terrified to play. Terrified to takl to the audience. We
      worked out creative ways of segueing one song to another, what he would
      say after every other song and rehearsed those things the weekend before
      every show. He kept adding songs to his repertoire and when it got to 40
      songs we started to accept private gigs. He experimented at Jerry's,
      showcased everywhere else.
    </p>
    <p className="text-cyan mx-auto lg:mx-0 mt-10 mb-12 max-w-[533px]">
      He's now up to 60+ songs and, though he's still only 12, no one can
      believe the level of maturity and comfort with which he holds rapport and
      laughs at himself on and off the stage.
    </p>
    <p className="text-cyan mx-auto lg:mx-0 mt-10 mb-12 max-w-[533px]">
      Landon would love to be invited to perform at other schools so that he
      could meet new kids and also hopefully inspire other youngs aspiring
      artists to work at their dreams. <br />
      He's a well rounded, compassionate and cool, easy going lad with a superb
      sense of humor. <br />
      He's straight A's already acing calculus. Striker and captain of his club
      soccer team. As a track athlete, the 400m is his pet distance (the soccer
      advantage). Built his own powerful gaming computer from scratch with the
      money he earned. Loves weight training with his older buddies and is a
      great big brother to his little sister.
    </p>
    <p className="text-cyan mx-auto lg:mx-0 mt-10 mb-12 max-w-[533px]">
      We wish him the best!
    </p>
  </div>
);
export default Featured;
