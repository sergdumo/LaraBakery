"use client";

import { User, onAuthStateChanged, signInWithPopup, signOut } from "firebase/auth";
import { createContext, useContext, useEffect, useMemo, useState } from "react";
import { auth, googleProvider } from "@/lib/firebase";
import { AppUser, ensureUserProfile, getUserProfile } from "@/lib/firebase-store";

type AuthContextValue = {
  user: User | null;
  profile: AppUser | null;
  loading: boolean;
  isAdmin: boolean;
  signInWithGoogle: () => Promise<void>;
  logout: () => Promise<void>;
  refreshProfile: () => Promise<void>;
};

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<AppUser | null>(null);
  const [loading, setLoading] = useState(true);

  async function loadProfile(nextUser: User | null) {
    if (!nextUser) {
      setProfile(null);
      return;
    }

    await ensureUserProfile(nextUser);
    setProfile(await getUserProfile(nextUser.uid));
  }

  useEffect(() => {
    return onAuthStateChanged(auth, async (nextUser) => {
      setLoading(true);
      setUser(nextUser);
      await loadProfile(nextUser);
      setLoading(false);
    });
  }, []);

  const value = useMemo<AuthContextValue>(
    () => ({
      user,
      profile,
      loading,
      isAdmin: profile?.role === "admin",
      signInWithGoogle: async () => {
        const result = await signInWithPopup(auth, googleProvider);
        setUser(result.user);
        await loadProfile(result.user);
      },
      logout: async () => {
        await signOut(auth);
        setUser(null);
        setProfile(null);
      },
      refreshProfile: async () => loadProfile(user)
    }),
    [loading, profile, user]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const value = useContext(AuthContext);
  if (!value) {
    throw new Error("useAuth must be used inside AuthProvider");
  }
  return value;
}
