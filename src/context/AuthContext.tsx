import React, { createContext, useContext, useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';
import type { User } from '@supabase/supabase-js';

interface AuthState {
  user: User | null;
  loading: boolean;
  isGuest: boolean;
  loginAsGuest: () => void;
  updateEmail: (email: string) => Promise<void>;
  updatePassword: (password: string) => Promise<void>;
  convertGuestToPermanent: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthState>({} as AuthState);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [isGuest, setIsGuest] = useState(false);

  useEffect(() => {
    // Check active sessions and sets the user
    supabase.auth.getSession().then(({ data: { session } }) => {
      const u = session?.user ?? null;
      setUser(u);
      setIsGuest(u?.is_anonymous ?? false);
      setLoading(false);
    });

    // Listen for changes on auth state (log in, log out, etc.)
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      const u = session?.user ?? null;
      setUser(u);
      setIsGuest(u?.is_anonymous ?? false);
    });

    return () => subscription.unsubscribe();
  }, []);

  const loginAsGuest = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase.auth.signInAnonymously();
      if (error) throw error;
      setIsGuest(true);
      setUser(data.user);
    } catch (e: any) {
      console.warn("Supabase anonymous sign-in failed, falling back to mock guest:", e.message);
      setIsGuest(true);
      setUser({ id: 'guest', email: 'guest@local', is_anonymous: true } as any);
    } finally {
      setLoading(false);
    }
  };

  const updateEmail = async (newEmail: string) => {
    if (isGuest) throw new Error("Guest users cannot change email.");
    const { error } = await supabase.auth.updateUser({ email: newEmail });
    if (error) throw error;
  };

  const updatePassword = async (newPassword: string) => {
    if (isGuest) throw new Error("Guest users cannot change password.");
    const { error } = await supabase.auth.updateUser({ password: newPassword });
    if (error) throw error;
  };

  const convertGuestToPermanent = async (emailStr: string, passwordStr: string) => {
    const { error } = await supabase.auth.updateUser({
      email: emailStr,
      password: passwordStr,
    });
    if (error) throw error;
  };

  const logout = async () => {
    await supabase.auth.signOut();
    setIsGuest(false);
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, loading, isGuest, loginAsGuest, updateEmail, updatePassword, convertGuestToPermanent, logout }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
