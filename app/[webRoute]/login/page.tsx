"use client";

import React, { FC } from "react";
import Header from "@/components/header";
import Hero from "@/components/hero";
import LoginForm from "./login-form";
import Footer from "@/components/footer";

const Login: FC = () => (
  <main className="bg-bg-dark text-white text-base">
    <LoginForm />
  </main>
);

export default Login;
