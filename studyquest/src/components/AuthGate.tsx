'use client';
import { useState, type ReactNode } from 'react';
import { Loader2 } from 'lucide-react';
import { useAuth } from './AuthProvider';
import { PixelPanel } from './ui/PixelPanel';
import { PixelButton } from './ui/PixelButton';
import { signIn, signUp } from '@/lib/auth';

function LoadingScreen() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-navy-950">
      <div className="flex items-center gap-3 text-slate-400">
        <Loader2 className="h-5 w-5 animate-spin" aria-hidden />
        <span className="font-pixel text-[10px] uppercase tracking-wide">Loading your data…</span>
      </div>
    </div>
  );
}

function LoginScreen() {
  const [mode, setMode] = useState<'signin' | 'signup'>('signin');
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setNotice(null);
    setBusy(true);
    const result = mode === 'signin' ? await signIn(email, password) : await signUp(email, password, name);
    setBusy(false);
    if (!result.ok) { setError(result.error ?? 'Something went wrong.'); return; }
    if (result.needsEmailConfirmation) { setNotice('Account created — check your email to confirm, then sign in.'); setMode('signin'); return; }
    // On success the AuthProvider's onAuthStateChange listener picks up the new session automatically.
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-navy-950 px-4 py-10">
      <div className="w-full max-w-sm">
        <div className="mb-6 text-center">
          <p className="pixel-heading text-sm text-neon-green">Study</p>
          <p className="pixel-heading text-sm text-neon-pink">Quest</p>
          <p className="mt-2 text-xs text-slate-500">Sign in to sync your own deadlines, XP and streak.</p>
        </div>

        <PixelPanel accent="cyan">
          <form onSubmit={submit} className="space-y-4">
            <div className="flex border-2 border-navy-600">
              {(['signin', 'signup'] as const).map((m) => (
                <button
                  key={m}
                  type="button"
                  onClick={() => { setMode(m); setError(null); setNotice(null); }}
                  className={`focus-ring flex-1 py-2 font-pixel text-[9px] uppercase tracking-wide transition-colors ${
                    mode === m ? 'bg-neon-cyan/15 text-neon-cyan' : 'text-slate-400 hover:text-slate-200'
                  }`}
                >
                  {m === 'signin' ? 'Sign in' : 'Sign up'}
                </button>
              ))}
            </div>

            {mode === 'signup' && (
              <label className="block">
                <span className="mb-1 block text-xs text-slate-400">Name</span>
                <input
                  value={name} onChange={(e) => setName(e.target.value)} required
                  placeholder="Adam"
                  className="focus-ring w-full border-2 border-navy-600 bg-navy-950 px-3 py-2 text-sm text-slate-200 placeholder:text-slate-600"
                />
              </label>
            )}

            <label className="block">
              <span className="mb-1 block text-xs text-slate-400">RP email</span>
              <input
                type="email" value={email} onChange={(e) => setEmail(e.target.value)} required
                placeholder="you@myrp.edu.sg"
                className="focus-ring w-full border-2 border-navy-600 bg-navy-950 px-3 py-2 text-sm text-slate-200 placeholder:text-slate-600"
              />
            </label>

            <label className="block">
              <span className="mb-1 block text-xs text-slate-400">Password</span>
              <input
                type="password" value={password} onChange={(e) => setPassword(e.target.value)} required minLength={6}
                placeholder="At least 6 characters"
                className="focus-ring w-full border-2 border-navy-600 bg-navy-950 px-3 py-2 text-sm text-slate-200 placeholder:text-slate-600"
              />
            </label>

            {error && <p className="border-2 border-neon-red bg-neon-red/10 p-2 text-xs text-neon-red">{error}</p>}
            {notice && <p className="border-2 border-neon-green bg-neon-green/10 p-2 text-xs text-neon-green">{notice}</p>}

            <PixelButton type="submit" tone="cyan" disabled={busy} className="w-full">
              {busy ? 'Please wait…' : mode === 'signin' ? 'Sign in' : 'Create account'}
            </PixelButton>
          </form>
        </PixelPanel>
      </div>
    </div>
  );
}

export function AuthGate({ children }: { children: ReactNode }) {
  const { configured, session, loading } = useAuth();

  if (!configured) return <>{children}</>; // no Supabase env vars → offline demo mode, unchanged behaviour
  if (loading) return <LoadingScreen />;
  if (!session) return <LoginScreen />;
  return <>{children}</>;
}
