import { twMerge } from "tailwind-merge";
import { ReactNode, HTMLAttributes } from "react";

interface SectionHeadingProps extends HTMLAttributes<HTMLElement> {
  children: ReactNode;
  className?: string;
}

const SectionHeading = ({
  children,
  className,
  ...props
}: SectionHeadingProps) => {
  return (
    <header
      {...props}
      data-aos="fade-up"
      className={twMerge("mb-16 lg:mb-20", className)}
    >
      {children}
    </header>
  );
};

export default SectionHeading;
