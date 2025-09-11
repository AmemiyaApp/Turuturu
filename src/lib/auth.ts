// src\lib\auth.ts
import { supabase } from '@/lib/supabase/client';
import { logger } from '@/lib/logger';
import type { User } from '@supabase/supabase-js';

interface AuthResponse {
  user: User | null;
  error: string | null;
}

interface OAuthResponse {
  error: string | null;
}

export async function signUp(email: string, password: string, name?: string): Promise<AuthResponse> {
  try {
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: { name, isAdmin: false },
      },
    });

    if (error) {
      logger.error('SignUp error', { email, error: error.message });
      return { user: null, error: error.message };
    }

    logger.info('User signed up successfully', { email });
    return { user: data.user, error: null };
  } catch (err) {
    logger.error('Unexpected signup error', { error: String(err) });
    return { user: null, error: 'Unexpected error during signup' };
  }
}

export async function signIn(email: string, password: string): Promise<AuthResponse> {
  try {
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) {
      logger.error('SignIn error', { email, error: error.message });
      return { user: null, error: error.message };
    }

    logger.info('User signed in successfully', { email });
    return { user: data.user, error: null };
  } catch (err) {
    logger.error('Unexpected signin error', { error: String(err) });
    return { user: null, error: 'Unexpected error during signin' };
  }
}

export async function signInWithGoogle(): Promise<OAuthResponse> {
  try {
    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: `${window.location.origin}/auth/callback`,
      },
    });

    if (error) {
      logger.error('Google OAuth error', { error: error.message });
      return { error: error.message };
    }

    logger.info('Google OAuth initiated');
    return { error: null };
  } catch (err) {
    logger.error('Unexpected Google OAuth error', { error: String(err) });
    return { error: 'Unexpected error during Google sign-in' };
  }
}

export async function signOut(): Promise<{ error: string | null }> {
  try {
    const { error } = await supabase.auth.signOut();
    if (error) {
      logger.error('SignOut error', { error: error.message });
      return { error: error.message };
    }

    logger.info('User signed out successfully');
    return { error: null };
  } catch (err) {
    logger.error('Unexpected signout error', { error: String(err) });
    return { error: 'Unexpected error during signout' };
  }
}