import { create } from 'zustand';
import { supabase } from '../lib/supabase.ts';
import { getProfile } from '../services/api.ts';
import type { Profile } from '../types/index.ts';

interface AuthState {
  user: Profile | null;
  loading: boolean;
  initialized: boolean;
  login: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  initialize: () => Promise<void>;
}

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  loading: false,
  initialized: false,

  initialize: async () => {
    try {
      set({ loading: true });
      const { data: { session } } = await supabase.auth.getSession();
      if (session) {
        const profile = await getProfile();
        set({ user: profile, initialized: true, loading: false });
      } else {
        set({ user: null, initialized: true, loading: false });
      }
    } catch {
      set({ user: null, initialized: true, loading: false });
    }
  },

  login: async (email: string, password: string) => {
    set({ loading: true });
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) {
      set({ loading: false });
      throw new Error(error.message);
    }
    const profile = await getProfile();
    set({ user: profile, loading: false });
  },

  logout: async () => {
    await supabase.auth.signOut();
    set({ user: null });
  },
}));
