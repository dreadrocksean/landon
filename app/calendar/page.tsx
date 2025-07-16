"use client";

import React, { FC } from "react";
import CalForm from "./CalForm";
import Header from "@/components/header";
import Hero from "@/components/hero";
import Footer from "@/components/footer";

const Calendar: FC = () => (
  <main className="bg-bg-dark text-white text-base">
    <Header />
    <Hero basic={true} />
    <CalForm />
    <Footer />
  </main>
);

export default Calendar;
