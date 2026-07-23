import { supabase } from './supabaseClient';

export interface AuthResult {
  ok: boolean;
  /** True when sign-up succeeded but Supabase is waiting on email confirmation before there's a session. */
  needsEmailConfirmation?: boolean;
  error?: string;
}

export async function signUp(email: string, password: string, name: string): Promise<AuthResult> {
  if (!supabase) return { ok: false, error: 'Auth is not configured.' };
  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: { data: { name } }, // stashed in auth.users metadata; bootstrapNewUser reads it as a fallback display name
  });
  if (error) return { ok: false, error: error.message };
  if (!data.session) return { ok: true, needsEmailConfirmation: true };
  return { ok: true };
}

export async function signIn(email: string, password: string): Promise<AuthResult> {
  if (!supabase) return { ok: false, error: 'Auth is not configured.' };
  const { error } = await supabase.auth.signInWithPassword({ email, password });
  if (error) return { ok: false, error: error.message };
  return { ok: true };
}

export async function signOut(): Promise<void> {
  if (!supabase) return;
  await supabase.auth.signOut();
}
