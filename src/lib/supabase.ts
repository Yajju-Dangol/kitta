import { createClient } from '@supabase/supabase-js';

// Setup these environment variables in your frontend .env file:
// VITE_SUPABASE_URL=your_project_url
// VITE_SUPABASE_ANON_KEY=your_anon_key

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || '';
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || '';

if (!supabaseUrl || !supabaseAnonKey) {
  console.warn('Supabase URL or Anon Key is missing. Please set VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY.');
}

/**
 * Standard Supabase client for frontend operations.
 * Uses the anon key. RLS policies will enforce user data security.
 */
export const supabase = createClient(supabaseUrl, supabaseAnonKey);

/**
 * Initiates Google OAuth login.
 * Redirects the user to Google's consent screen.
 */
export async function signInWithGoogle() {
  const { data, error } = await supabase.auth.signInWithOAuth({
    provider: 'google',
    options: {
      redirectTo: `${window.location.origin}/`,
    },
  });
  
  if (error) {
    console.error('Error logging in with Google:', error.message);
    throw error;
  }
  return data;
}

/**
 * Signs the user out.
 */
export async function signOut() {
  const { error } = await supabase.auth.signOut();
  if (error) {
    console.error('Error logging out:', error.message);
    throw error;
  }
}
