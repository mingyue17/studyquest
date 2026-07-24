'use client';
import { useEffect, useState } from 'react';
import { Sun, Moon } from 'lucide-react';

const STORAGE_KEY = 'studyquest-theme';
type Theme = 'dark' | 'light';

/** Reads the theme the inline layout script already set on <html>, so there's no mismatch on mount. */
function getCurrentTheme(): Theme {
  if (typeof document === 'undefined') return 'dark';
  return document.documentElement.getAttribute('data-theme') === 'light' ? 'light' : 'dark';
}

export function ThemeToggle({ compact = false }: { compact?: boolean }) {
  const [theme, setTheme] = useState<Theme>('dark');

  useEffect(() => {
    setTheme(getCurrentTheme());
  }, []);

  const toggle = () => {
    const next: Theme = theme === 'dark' ? 'light' : 'dark';
    setTheme(next);
    document.documentElement.setAttribute('data-theme', next);
    try { localStorage.setItem(STORAGE_KEY, next); } catch { /* storage unavailable — theme still applies for this session */ }
  };

  const label = theme === 'dark' ? 'Switch to light mode' : 'Switch to dark mode';

  return (
    <button
      onClick={toggle}
      aria-label={label}
      title={label}
      className={`focus-ring flex items-center gap-2 border-2 border-navy-600 bg-navy-900 text-slate-300 transition-colors hover:border-neon-yellow hover:text-neon-yellow ${
        compact ? 'p-1.5' : 'w-full justify-center px-3 py-2'
      }`}
    >
      {theme === 'dark' ? <Sun className="h-4 w-4" aria-hidden /> : <Moon className="h-4 w-4" aria-hidden />}
      {!compact && <span className="font-pixel text-[9px] uppercase tracking-wide">{theme === 'dark' ? 'Light mode' : 'Dark mode'}</span>}
    </button>
  );
}
