"use client";
// mock member data
import { members } from "@/data/data";
import SectionHeading from "./section-heading";
import Image from "next/image";
import useEmblaCarousel from "embla-carousel-react";
import "../styles/members.css";

import { FaFacebookF, FaTwitter, FaInstagram } from "react-icons/fa6";
import Link from "next/link";

type MemberType = {
  id: string | number;
  image: string;
  name: string;
  position: string;
  // Add other member fields if needed
};

const Members = () => {
  const [emblaRef] = useEmblaCarousel({
    dragFree: true,
    containScroll: "trimSnaps",
  });

  return (
    <div className="bg-bg-dark">
      <div className="py-section">
        <SectionHeading className="mb-12 lg:mb-16">
          <h2 className="uppercase text-center">our TALENTED MEMBERS</h2>
        </SectionHeading>
        <div className="embla_member px-container" ref={emblaRef}>
          <div className="flex gap-4 embla__container_member">
            {members.map((member: MemberType) => (
              <div key={member.id} className="embla__slide_member">
                <Member member={member} />
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

type MemberProps = {
  member: MemberType;
};

const Member: React.FC<MemberProps> = ({ member }) => (
  <article className="isolate relative group h-[440px] w-[358px] ">
    <div>
      <Image width={358} height={440} src={member.image} alt="" />
    </div>
    <div className="bg-light-rose z-10 transition-all ease-linear duration-300 opacity-0 group-hover:opacity-90 absolute inset-0 flex flex-col text-center items-center p-2 pb-14 text-white justify-end font-kumbhSans">
      <h6 className="text-lg font-bold">{member.name ?? "David Backhum"}</h6>
      <p className="text-base mb-5">{member.position ?? "CEO & Founder"}</p>
      <div className="flex gap-4 text-base">
        <Link href="/">
          <FaFacebookF />
        </Link>
        <Link href="/">
          <FaInstagram />
        </Link>
        <Link href="/">
          <FaTwitter />
        </Link>
      </div>
    </div>
  </article>
);

export default Members;
