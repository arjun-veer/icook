import { create } from 'zustand';
import { User } from '@/types';
import { supabase } from '@/services/supabase';
import * as SecureStore from 'expo-secure-store';
import * as Google from 'expo-auth-session/providers/google';
import * as WebBrowser from 'expo-web-browser';
import ENV from '@/config/env';

WebBrowser.maybeCompleteAuthSession();

interface AuthState {
  user: User | null;
  session: any;
  isLoading: boolean;
  isAuthenticated: boolean;
  signInWithEmail: (email: string, password: string) => Promise<void>;
  signUpWithEmail: (email: string, password: string, fullName: string) => Promise<void>;
  signInWithGoogle: () => Promise<void>;
  signOut: () => Promise<void>;
  refreshUser: () => Promise<void>;
  updateProfile: (updates: Partial<User>) => Promise<void>;
  initialize: () => Promise<void>;
}

export const useAuthStore = create<AuthState>((set, get) => ({
  user: null,
  session: null,
  isLoading: true,
  isAuthenticated: false,

  initialize: async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      
      if (session) {
        const { data: user } = await supabase
          .from('users')
          .select('*')
          .eq('id', session.user.id)
          .single();

        set({
          session,
          user: user || null,
          isAuthenticated: !!user,
          isLoading: false,
        });
      } else {
        set({ isLoading: false });
      }

      supabase.auth.onAuthStateChange(async (_event, session) => {
        if (session) {
          const { data: user } = await supabase
            .from('users')
            .select('*')
            .eq('id', session.user.id)
            .single();

          set({
            session,
            user: user || null,
            isAuthenticated: !!user,
          });
        } else {
          set({
            session: null,
            user: null,
            isAuthenticated: false,
          });
        }
      });
    } catch (error) {
      console.error('Initialize auth error:', error);
      set({ isLoading: false });
    }
  },

  signInWithEmail: async (email: string, password: string) => {
    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) throw error;

      if (data.user) {
        const { data: user } = await supabase
          .from('users')
          .select('*')
          .eq('id', data.user.id)
          .single();

        set({
          session: data.session,
          user: user || null,
          isAuthenticated: !!user,
        });
      }
    } catch (error) {
      console.error('Sign in with email error:', error);
      throw error;
    }
  },

  signUpWithEmail: async (email: string, password: string, fullName: string) => {
    try {
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            full_name: fullName,
          },
        },
      });

      if (error) throw error;

      if (data.user) {
        // Create user profile
        const { error: insertError } = await supabase
          .from('users')
          .insert({
            id: data.user.id,
            email: data.user.email!,
            full_name: fullName,
            avatar_url: null,
          });

        if (insertError) throw insertError;

        // Auto sign in after signup
        const { data: signInData, error: signInError } = await supabase.auth.signInWithPassword({
          email,
          password,
        });

        if (signInError) throw signInError;

        if (signInData.user) {
          const { data: user } = await supabase
            .from('users')
            .select('*')
            .eq('id', signInData.user.id)
            .single();

          set({
            session: signInData.session,
            user: user || null,
            isAuthenticated: !!user,
          });
        }
      }
    } catch (error) {
      console.error('Sign up with email error:', error);
      throw error;
    }
  },

  signInWithGoogle: async () => {
    try {
      const redirectUrl = 'icook://';
      
      const { data, error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: redirectUrl,
          queryParams: {
            access_type: 'offline',
            prompt: 'consent',
          },
        },
      });

      if (error) throw error;

      if (data.url) {
        const result = await WebBrowser.openAuthSessionAsync(
          data.url,
          redirectUrl
        );

        if (result.type === 'success') {
          const url = result.url;
          const params = new URLSearchParams(url.split('#')[1] || url.split('?')[1]);
          const accessToken = params.get('access_token');
          const refreshToken = params.get('refresh_token');

          if (accessToken && refreshToken) {
            const { data: sessionData, error: sessionError } = await supabase.auth.setSession({
              access_token: accessToken,
              refresh_token: refreshToken,
            });

            if (sessionError) throw sessionError;

            if (sessionData.user) {
              const { data: existingUser } = await supabase
                .from('users')
                .select('*')
                .eq('id', sessionData.user.id)
                .single();

              if (!existingUser) {
                const { error: insertError } = await supabase
                  .from('users')
                  .insert({
                    id: sessionData.user.id,
                    email: sessionData.user.email!,
                    full_name: sessionData.user.user_metadata.full_name || sessionData.user.email!.split('@')[0],
                    avatar_url: sessionData.user.user_metadata.avatar_url,
                    google_id: sessionData.user.user_metadata.sub,
                  });

                if (insertError) throw insertError;
              }

              await get().refreshUser();
            }
          }
        }
      }
    } catch (error) {
      console.error('Sign in error:', error);
      throw error;
    }
  },

  signOut: async () => {
    try {
      await supabase.auth.signOut();
      await SecureStore.deleteItemAsync('auth_token');
      set({
        user: null,
        session: null,
        isAuthenticated: false,
      });
    } catch (error) {
      console.error('Sign out error:', error);
      throw error;
    }
  },

  refreshUser: async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      
      if (session) {
        const { data: user } = await supabase
          .from('users')
          .select('*')
          .eq('id', session.user.id)
          .single();

        set({
          user: user || null,
          isAuthenticated: !!user,
        });
      }
    } catch (error) {
      console.error('Refresh user error:', error);
    }
  },

  updateProfile: async (updates: Partial<User>) => {
    try {
      const { user } = get();
      if (!user) throw new Error('No user logged in');

      const { error } = await supabase
        .from('users')
        .update(updates)
        .eq('id', user.id);

      if (error) throw error;

      await get().refreshUser();
    } catch (error) {
      console.error('Update profile error:', error);
      throw error;
    }
  },
}));
