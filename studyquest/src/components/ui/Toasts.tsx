'use client';
import { useEffect } from 'react';
import { useStore } from '@/store/useStore';

const TONES = {
  xp: 'border-neon-green text-neon-green',
  level: 'border-neon-yellow text-neon-yellow',
  badge: 'border-neon-pink text-neon-pink',
  warn: 'border-neon-red text-neon-red',
} as const;

export function Toasts() {
  const toasts = useStore((s) => s.toasts);
  const dismissToast = useStore((s) => s.dismissToast);

  useEffect(() => {
    if (toasts.length === 0) return;
    const timer = setTimeout(() => dismissToast(toasts[0].id), 3200);
    return () => clearTimeout(timer);
  }, [toasts, dismissToast]);

  return (
    <div className="pointer-events-none fixed bottom-4 right-4 z-[60] flex flex-col gap-2" aria-live="polite">
      {toasts.map((t) => (
        <div key={t.id} className={`pixel-border ${TONES[t.tone]} animate-pop bg-navy-950/95 px-4 py-3`}>
          <p className="font-pixel text-[10px]">{t.title}</p>
          <p className="mt-1 text-xs text-slate-400">{t.body}</p>
        </div>
      ))}
    </div>
  );
}
