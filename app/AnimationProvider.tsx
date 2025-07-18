"use client";
import React from "react";
import { useEffect, ReactNode } from "react";
import AOS from "aos";

interface AnimationProviderProps {
  children: ReactNode;
}

const AnimationProvider = ({ children }: AnimationProviderProps) => {
  useEffect(() => {
    AOS.init({
      duration: 1200,
    });
  }, []);

  return <div>{children}</div>;
};

export default AnimationProvider;
