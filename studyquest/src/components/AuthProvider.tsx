'use client';
import { createContext, useContext, useEffect, useState, type ReactNode } from 'react';
import type { Session } from '@supabase/supabase-js';
import { supabase, isSupabaseConfigured } from '@/lib/supabaseClient';
import { useStore } from '@/store/useStore';

interface AuthContextValue {
  configured: boolean;
  session: Session | null;
  /** True while the initial session check (or a post-login data hydrate) is in flight. */
  loading: boolean;
}

const AuthContext = createContext<AuthContextValue>({ configured: false, session: null, loading: false });

export function useAuth() {
  return useContext(AuthContext);
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<Session | null>(null);
  // Start "loading" only when there's actually a session to check — offline/demo mode skips straight past this.
  const [loading, setLoading] = useState(isSupabaseConfigured);
  const hydrate = useStore((s) => s.hydrate);
  const signOutLocal = useStore((s) => s.signOutLocal);
  const hydrated = useStore((s) => s.hydrated);

  useEffect(() => {
    if (!isSupabaseConfigured || !supabase) {
      setLoading(false);
      return;
    }

    supabase.auth.getSession().then(({ data }) => setSession(data.session));

    const { data: listener } = supabase.auth.onAuthStateChange((_event, next) => {
      setSession(next);
      if (!next) signOutLocal();
    });

    return () => listener.subscription.unsubscribe();
  }, [signOutLocal]);

  useEffect(() => {
    if (!session) {
      if (isSupabaseConfigured) setLoading(false);
      return;
    }
    setLoading(true);
    hydrate(session.user.id, session.user.email ?? '', session.user.user_metadata?.name)
      .finally(() => setLoading(false));
    // Only re-run when the account itself changes, not on every store update.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [session?.user.id]);

  return (
    <AuthContext.Provider value={{ configured: isSupabaseConfigured, session, loading: loading || (Boolean(session) && !hydrated) }}>
      {children}
    </AuthContext.Provider>
  );
}
