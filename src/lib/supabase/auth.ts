'use client';

import { useState, useEffect, useCallback } from 'react';
import { User } from '@supabase/supabase-js';
import { getSupabaseBrowserClient, isSupabaseConfigured } from './client';

export interface UserProfile {
  id: string;
  full_name: string;
  phone?: string | null;
  role: 'customer' | 'owner' | 'order_manager' | 'production_operator' | 'support' | 'catalog_editor';
  created_at?: string;
}

export interface AuthState {
  user: User | null;
  profile: UserProfile | null;
  isLoading: boolean;
  isStaff: boolean;
  signInWithGoogle: (redirectTo?: string) => Promise<{ error?: string }>;
  signInWithPassword: (email: string, password: string) => Promise<{ error?: string }>;
  signUpWithPassword: (email: string, password: string, fullName: string) => Promise<{ error?: string }>;
  signOut: () => Promise<void>;
}

/**
 * Initiates Google OAuth login via Supabase Auth.
 * Redirects the user to Google consent screen, then back to /auth/callback.
 */
export async function signInWithGoogle(redirectTo = '/account'): Promise<{ error?: string }> {
  const supabase = getSupabaseBrowserClient();
  if (!supabase) {
    return { error: 'Supabase credentials not configured in environment.' };
  }

  const origin = typeof window !== 'undefined' ? window.location.origin : '';
  const redirectUrl = `${origin}/auth/callback?next=${encodeURIComponent(redirectTo)}`;

  const { error } = await supabase.auth.signInWithOAuth({
    provider: 'google',
    options: {
      redirectTo: redirectUrl,
      queryParams: {
        access_type: 'offline',
        prompt: 'consent',
      },
    },
  });

  if (error) {
    return { error: error.message };
  }

  return {};
}

/**
 * Custom React hook for live authentication state, user session, and role profile.
 */
export function useAuthUser(): AuthState {
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const fetchProfile = useCallback(async (userId: string) => {
    const supabase = getSupabaseBrowserClient();
    if (!supabase) return;

    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .single();

      if (!error && data) {
        setProfile(data as UserProfile);
      }
    } catch (err) {
      console.warn('Failed to fetch user profile:', err);
    }
  }, []);

  useEffect(() => {
    const supabase = getSupabaseBrowserClient();
    if (!supabase) {
      setIsLoading(false);
      return;
    }

    // 1. Check existing session
    supabase.auth.getSession().then(({ data: { session } }) => {
      const currentUser = session?.user ?? null;
      setUser(currentUser);
      if (currentUser) {
        fetchProfile(currentUser.id);
      }
      setIsLoading(false);
    });

    // 2. Listen to auth state transitions
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      const currentUser = session?.user ?? null;
      setUser(currentUser);
      if (currentUser) {
        fetchProfile(currentUser.id);
      } else {
        setProfile(null);
      }
      setIsLoading(false);
    });

    return () => {
      subscription.unsubscribe();
    };
  }, [fetchProfile]);

  const handleSignInWithGoogle = async (redirectTo = '/account') => {
    return signInWithGoogle(redirectTo);
  };

  const handleSignInWithPassword = async (email: string, password: string) => {
    const supabase = getSupabaseBrowserClient();
    if (!supabase) {
      return { error: 'Supabase credentials not configured in environment.' };
    }

    const { error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) return { error: error.message };
    return {};
  };

  const handleSignUpWithPassword = async (email: string, password: string, fullName: string) => {
    const supabase = getSupabaseBrowserClient();
    if (!supabase) {
      return { error: 'Supabase credentials not configured in environment.' };
    }

    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          full_name: fullName,
          role: 'customer',
        },
      },
    });

    if (error) return { error: error.message };
    return {};
  };

  const handleSignOut = async () => {
    const supabase = getSupabaseBrowserClient();
    if (supabase) {
      await supabase.auth.signOut();
    }
    setUser(null);
    setProfile(null);
  };

  const isStaff = Boolean(
    profile?.role && ['owner', 'order_manager', 'production_operator', 'support', 'catalog_editor'].includes(profile.role)
  );

  return {
    user,
    profile,
    isLoading,
    isStaff,
    signInWithGoogle: handleSignInWithGoogle,
    signInWithPassword: handleSignInWithPassword,
    signUpWithPassword: handleSignUpWithPassword,
    signOut: handleSignOut,
  };
}
