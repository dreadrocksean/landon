import { useEffect, useState } from "react";
import { onAuthStateChanged, User } from "firebase/auth";
import { auth } from "@/lib/gcp/client";

const useAuth = (): {
  user: User | null;
  isAuthenticated: boolean;
  loading: boolean;
} => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true); // <-- track loading state

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (authUser: User | null) => {
      setUser(authUser);
      setLoading(false); // <-- done loading once Firebase responds
    });

    return () => unsubscribe();
  }, []);

  return { user, isAuthenticated: !!user, loading };
};

export default useAuth;
