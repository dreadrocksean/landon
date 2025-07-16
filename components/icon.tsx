import { twMerge } from "tailwind-merge";
import { ComponentType, HTMLAttributes } from "react";

interface IconProps extends HTMLAttributes<HTMLDivElement> {
  Icon: ComponentType;
  className?: string;
}

const Icon: React.FC<IconProps> = ({ Icon, className, ...props }) => {
  return (
    <div
      {...props}
      className={twMerge(
        "text-base text-white duration-300 ease-linear transition-all hover:text-rose",
        className
      )}
    >
      <Icon />
    </div>
  );
};

export default Icon;
