"use client";

import React, { useEffect } from "react";
import { useRouter } from "next/navigation";
import useAuth from "@/hooks/useAuth";
import { signOut } from "firebase/auth";
import { auth } from "@/lib/gcp/client";

export const Login: React.FC = () => {
  const router = useRouter();
  const { isAuthenticated } = useAuth();

  useEffect(() => {
    signOut(auth);
  }, []);

  useEffect(() => {
    if (isAuthenticated) {
      router.push("/calendar");
    } else {
      router.push("/login");
    }
  }, [router, isAuthenticated]);

  return null;
};

export default Login;
