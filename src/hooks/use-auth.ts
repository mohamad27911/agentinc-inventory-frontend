'use client';

import { useEffect, useState, useCallback } from 'react';
import { createClient } from '@/lib/supabase/client';
import type { Profile } from '@/types';
import type { User } from '@supabase/supabase-js';

export function useAuth() {
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);

  const supabase = createClient();

  const fetchProfile = useCallback(async (userId: string) => {
    const res = await fetch('/api/auth/me');
    if (res.ok) {
      const data = await res.json();
      setProfile(data.profile || null);
    }
  }, []);

  useEffect(() => {
    const getInitialSession = async () => {
      const {
        data: { user: currentUser },
      } = await supabase.auth.getUser();
      setUser(currentUser);
      if (currentUser) {
        await fetchProfile(currentUser.id);
      }
      setLoading(false);
    };

    getInitialSession();

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (event, session) => {
      const currentUser = session?.user ?? null;
      setUser(currentUser);
      if (currentUser) {
        await fetchProfile(currentUser.id);
      } else {
        setProfile(null);
      }
      setLoading(false);
    });

    return () => {
      subscription.unsubscribe();
    };
  }, [supabase, fetchProfile]);

  const signIn = useCallback(
    async (email: string, password: string) => {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Login failed');

      // Also sign in on the client side so the session cookie is set
      const { error } = await supabase.auth.signInWithPassword({ email, password });
      if (error) throw error;

      return data;
    },
    [supabase]
  );

  const signUp = useCallback(
    async (email: string, password: string, full_name: string) => {
      const res = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password, full_name }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Registration failed');

      // Also sign in on the client side
      const { error } = await supabase.auth.signInWithPassword({ email, password });
      if (error) throw error;

      return data;
    },
    [supabase]
  );

  const signOut = useCallback(async () => {
    await supabase.auth.signOut();
    setUser(null);
    setProfile(null);
    window.location.href = '/login';
  }, [supabase]);

  return { user, profile, loading, signIn, signUp, signOut };
}
