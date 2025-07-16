import { twMerge } from "tailwind-merge";
import React, { ReactNode, HTMLAttributes } from "react";

interface ContainerProps extends HTMLAttributes<HTMLDivElement> {
  children: ReactNode;
  className?: string;
}

const Container: React.FC<ContainerProps> = ({
  children,
  className,
  ...props
}) => {
  return (
    <div
      {...props}
      className={twMerge("max-w-container mx-auto px-container", className)}
    >
      {children}
    </div>
  );
};

export default Container;
