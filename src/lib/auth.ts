import { createClient, SupabaseClient, User, Session } from '@supabase/supabase-js';
import { create } from 'zustand';

// Types
export interface Profile {
  id: string;
  first_name?: string;
  last_name?: string;
  email: string;
  role: 'candidate' | 'recruiter';
  created_at: string;
  updated_at: string;
}

interface AuthState {
  user: User | null;
  profile: Profile | null;
  session: Session | null;
  isLoading: boolean;
  isInitializing: boolean;
  isAuthenticated: boolean;
  error: string | null;
  initialize: () => Promise<void>;
  login: (email: string, password: string) => Promise<void>;
  signup: (email: string, password: string, firstName?: string, lastName?: string) => Promise<void>;
  logout: () => Promise<void>;
  sendPasswordResetEmail: (email: string) => Promise<void>;
  createProfile: (userId: string, email: string, firstName?: string, lastName?: string) => Promise<Profile | null>;
}

// Global Supabase client
let supabaseClient: SupabaseClient | null = null;

export const initializeSupabase = (url: string, anonKey: string) => {
  supabaseClient = createClient(url, anonKey);
  return supabaseClient;
};

export const getSupabaseClient = (): SupabaseClient => {
  if (!supabaseClient) {
    throw new Error('Supabase client not initialized. Call initializeSupabase first.');
  }
  return supabaseClient;
};

// Auth store
export const useAuthStore = create<AuthState>((set, get) => ({
  user: null,
  profile: null,
  session: null,
  isLoading: false,
  isInitializing: true,
  isAuthenticated: false,
  error: null,

  createProfile: async (userId: string, email: string, firstName?: string, lastName?: string) => {
    try {
      const supabase = getSupabaseClient();
      
      const { data, error } = await supabase
        .from('profiles')
        .insert({
          user_id: userId,
          email: email,
          first_name: firstName || null,
          last_name: lastName || null,
          role: 'candidate' as const,
        })
        .select()
        .single();

      if (error) {
        console.error('Profile creation error:', error);
        return null;
      }

      return data;
    } catch (error) {
      console.error('Profile creation error:', error);
      return null;
    }
  },

  initialize: async () => {
    try {
      set({ isInitializing: true, error: null });
      const supabase = getSupabaseClient();
      
      // Get initial session
      const { data: { session }, error: sessionError } = await supabase.auth.getSession();
      if (sessionError) throw sessionError;

      if (session?.user) {
        // Fetch profile
        const { data: profiles, error: profileError } = await supabase
          .from('profiles')
          .select('*')
          .eq('user_id', session.user.id)
          .limit(1);

        let profile = profiles && profiles.length > 0 ? profiles[0] : null;

        // If profile doesn't exist, create it
        if (!profile && session.user.email) {
          console.log('Profile not found, creating new profile...');
          profile = await get().createProfile(
            session.user.id,
            session.user.email,
            session.user.user_metadata?.first_name,
            session.user.user_metadata?.last_name
          );
        }

        if (profileError && profileError.code !== 'PGRST116') {
          console.error('Profile fetch error:', profileError);
        }

        set({
          user: session.user,
          session,
          profile,
          isAuthenticated: true,
          isInitializing: false,
        });
      } else {
        set({
          user: null,
          session: null,
          profile: null,
          isAuthenticated: false,
          isInitializing: false,
        });
      }

      // Listen for auth changes
      supabase.auth.onAuthStateChange(async (event, session) => {
        if (session?.user) {
          const { data: profiles } = await supabase
            .from('profiles')
            .select('*')
            .eq('user_id', session.user.id)
            .limit(1);

          let profile = profiles && profiles.length > 0 ? profiles[0] : null;

          // If profile doesn't exist, create it
          if (!profile && session.user.email) {
            console.log('Profile not found during auth change, creating new profile...');
            profile = await get().createProfile(
              session.user.id,
              session.user.email,
              session.user.user_metadata?.first_name,
              session.user.user_metadata?.last_name
            );
          }

          set({
            user: session.user,
            session,
            profile,
            isAuthenticated: true,
          });
        } else {
          set({
            user: null,
            session: null,
            profile: null,
            isAuthenticated: false,
          });
        }
      });
    } catch (error) {
      set({
        error: error instanceof Error ? error.message : 'Initialization failed',
        isInitializing: false,
      });
    }
  },

  login: async (email: string, password: string) => {
    try {
      set({ isLoading: true, error: null });
      const supabase = getSupabaseClient();
      
      const { error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) throw error;
    } catch (error) {
      set({ error: error instanceof Error ? error.message : 'Login failed' });
    } finally {
      set({ isLoading: false });
    }
  },

  signup: async (email: string, password: string, firstName?: string, lastName?: string) => {
    try {
      set({ isLoading: true, error: null });
      const supabase = getSupabaseClient();
      
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            first_name: firstName,
            last_name: lastName,
          },
        },
      });

      if (error) throw error;

      // Create profile record if user was created successfully
      if (data.user && data.user.email) {
        const profile = await get().createProfile(
          data.user.id,
          data.user.email,
          firstName,
          lastName
        );

        if (!profile) {
          console.warn('Profile creation failed during signup, but user account was created');
        }
      }
    } catch (error) {
      set({ error: error instanceof Error ? error.message : 'Signup failed' });
    } finally {
      set({ isLoading: false });
    }
  },

  logout: async () => {
    try {
      set({ isLoading: true, error: null });
      const supabase = getSupabaseClient();
      
      const { error } = await supabase.auth.signOut();
      if (error) throw error;
    } catch (error) {
      set({ error: error instanceof Error ? error.message : 'Logout failed' });
    } finally {
      set({ isLoading: false });
    }
  },

  sendPasswordResetEmail: async (email: string) => {
    try {
      set({ isLoading: true, error: null });
      const supabase = getSupabaseClient();
      
      const { error } = await supabase.auth.resetPasswordForEmail(email);
      if (error) throw error;
    } catch (error) {
      set({ error: error instanceof Error ? error.message : 'Password reset failed' });
    } finally {
      set({ isLoading: false });
    }
  },
}));