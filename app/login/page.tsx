"use client";

import React from "react";
import Header from "@/components/header";
import Hero from "@/components/hero";
import LoginForm from "@/app/login/login-form";
import Footer from "@/components/footer";

export const Login = () => (
  <main className="bg-bg-dark text-white text-base">
    <Header />
    <Hero basic={true} />
    <LoginForm />
    <Footer />
  </main>
);

export default Login;
