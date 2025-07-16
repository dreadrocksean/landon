import { useEffect, useState } from "react";
import { onAuthStateChanged, User } from "firebase/auth";
import { auth } from "@/lib/gcp/client";

const useAuth = (): { user: User | null; isAuthenticated: boolean } => {
  const [user, setUser] = useState<User | null>(null);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (authUser: User | null) => {
      setUser(authUser);
    });

    return () => unsubscribe();
  }, []);

  return { user, isAuthenticated: !!user };
};

export default useAuth;
