"use client";
import {
  createContext,
  useContext,
  useState,
  ReactNode,
  Dispatch,
  SetStateAction,
} from "react";

type LayoutContextType = {
  isRTL: boolean;
  setIsRTL: Dispatch<SetStateAction<boolean>>;
};

const LayoutContext = createContext<LayoutContextType | undefined>(undefined);

export const useLayout = () => {
  const context = useContext(LayoutContext);
  if (!context) {
    throw new Error("useLayout must be used within a LayoutProvider");
  }
  return context;
};

type LayoutProviderProps = {
  children: ReactNode;
};

const LayoutProvider = ({ children }: LayoutProviderProps) => {
  const [isRTL, setIsRTL] = useState<boolean>(false);

  const value: LayoutContextType = {
    isRTL,
    setIsRTL,
  };

  return (
    <LayoutContext.Provider value={value}>
      <div dir={isRTL ? "rtl" : "ltr"}>{children}</div>
    </LayoutContext.Provider>
  );
};

export default LayoutProvider;
