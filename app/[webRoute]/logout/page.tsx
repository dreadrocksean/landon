"use client";

import React, { useEffect } from "react";
import { useRouter } from "next/navigation";
import useAuth from "@/hooks/useAuth";
import { signOut } from "firebase/auth";
import { auth } from "@/lib/gcp/client";
import { useStore } from "@/store/useStore";

const Login: React.FC = () => {
  const router = useRouter();
  const { isAuthenticated } = useAuth();
  const webRoute = useStore((state) => state.webRoute);

  useEffect(() => {
    signOut(auth);
  }, []);

  useEffect(() => {
    if (isAuthenticated) {
      router.push(`/${webRoute}/calendar`);
    } else {
      router.push(`/${webRoute}/login`);
    }
  }, [router, isAuthenticated]);

  return null;
};

export default Login;
