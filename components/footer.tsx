import Image from "next/image";
import Container from "./container";
import Link from "next/link";
import {
  FaFacebookF,
  FaTwitter,
  FaInstagram,
  FaPinterestP,
} from "react-icons/fa6";
import SocialIcon from "./icon";
import { ReactNode, AnchorHTMLAttributes } from "react";

//method call
const Footer: React.FC = () => {
  return (
    <div className="relative bg-footer bg-cover bg-no-repeat">
      <div className="absolute z-10 inset-0 bg-bg-overly bg-opacity-85"></div>
      <Container className="pt-section relative z-20">
        {/* <header>
          <h3 className="text-2xl text-center sm:text-start mx-auto sm:mx-0 font-bold mb-12 max-w-[250px]">
            Follow Me On Instagram
          </h3>
        </header> */}
        {/*<div className="flex gap-16 md:gap-20 lg:gap-28 mb-20 flex-wrap">
          <div className="basis-[250px] mx-auto sm:mx-0 ">
            <div className="grid gap-4 grid-cols-3 ">
              <Image
                src={"/img/home/g1.jpg"}
                width={70}
                height={70}
                className="object-cover h-[70px]"
                alt=""
              />
              <Image
                src={"/img/home/g2.jpg"}
                width={70}
                height={70}
                className="object-cover h-[70px]"
                alt=""
              />
              <Image
                src={"/img/home/g4.jpg"}
                width={70}
                height={70}
                className="object-cover h-[70px]"
                alt=""
              />
              <Image
                src={"/img/home/g5.jpg"}
                width={70}
                height={70}
                className="object-cover h-[70px]"
                alt=""
              />
              <Image
                src={"/img/home/g6.jpg"}
                width={70}
                height={70}
                className="object-cover h-[70px]"
                alt=""
              />
              <Image
                src={"/img/home/g8.jpg"}
                width={70}
                height={70}
                className="object-cover h-[70px]"
                alt=""
              />
            </div>
          </div>
          <div className="sm:flex-1 mx-auto sm:mx-0 lg:justify-around gap-10 flex">
            <div className="flex flex-col gap-2">
              <div>Bouvet Island Jeanetteside</div>
              <div>53 Brannon Falls Suite</div>
              <div>NY, USA</div>

              <div className="flex pt-4 gap-10">
                <Link target="_blank" href="https://www.facebook.com/">
                  <SocialIcon Icon={FaFacebookF} />
                </Link>
                <Link target="_blank" href="https://twitter.com/">
                  <SocialIcon Icon={FaTwitter} />
                </Link>
                <Link target="_blank" href="https://www.instagram.com/">
                  <SocialIcon Icon={FaInstagram} />
                </Link>
                <Link target="_blank" href="https://www.pinterest.com/">
                  <SocialIcon Icon={FaPinterestP} />
                </Link>
              </div>
            </div>
            <div className="flex flex-col gap-2">
              <FooterLink href="/"> Home </FooterLink>
              <FooterLink href="/"> About </FooterLink>
              <FooterLink href="/"> Tour </FooterLink>
              <FooterLink href="/"> Gallery </FooterLink>
              <FooterLink href="/"> Shop </FooterLink>
            </div>
          </div>
          <div className="basis-[250px] mx-auto sm:mx-0 text-center sm:text-start flex flex-col gap-2 font-medium">
            <FooterLink href="/"> Others Demos </FooterLink>
            <FooterLink href="/"> View Themes </FooterLink>
            <FooterLink href="/"> Purchase Theme </FooterLink>
          </div>
        </div>*/}
        <div className="py-5 border-t flex-col md:flex-row font-bold text-center md:text-start gap-2 border-cyan flex justify-center md:justify-between">
          <div>
            <div>Book Landon Today! (913) 680-9050</div>
            <div>
              <a href="mailto:adrian@bartholomusic.com">
                adrian@bartholomusic.com
              </a>
            </div>
          </div>
          <div>Site is Powered by Dreadrock Software ©2022 </div>
        </div>
      </Container>
    </div>
  );
};

// Footer Item Link Component
type FooterLinkProps = AnchorHTMLAttributes<HTMLAnchorElement> & {
  children: ReactNode;
  href?: string;
};

const FooterLink: React.FC<FooterLinkProps> = ({
  children,
  href = "/",
  ...props
}) => {
  return (
    <Link
      {...props}
      className="text-white hover:text-rose transition-all ease-linear duration-300"
      href={href}
    >
      {children}
    </Link>
  );
};

export default Footer;
