import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || '';
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || '';

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

/** Sign in with email and password */
export async function signIn(email: string, password: string) {
  return supabase.auth.signInWithPassword({ email, password });
}

/** Sign up with email, password, and metadata (name, role) */
export async function signUp(
  email: string,
  password: string,
  metadata: { name: string; role: 'student' | 'teacher' }
) {
  return supabase.auth.signUp({
    email,
    password,
    options: {
      data: metadata,
    },
  });
}

/** Sign out the current user */
export async function signOut() {
  return supabase.auth.signOut();
}

/** Get the current session */
export async function getSession() {
  return supabase.auth.getSession();
}

/** Get the current user */
export async function getCurrentUser() {
  const { data: { session } } = await supabase.auth.getSession();
  return session?.user ?? null;
}

/** Get the current user's role from metadata */
export async function getCurrentUserRole(): Promise<'teacher' | 'student' | null> {
  const user = await getCurrentUser();
  return (user?.user_metadata?.role as 'teacher' | 'student') ?? null;
}
