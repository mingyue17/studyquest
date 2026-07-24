import type { ReactNode } from 'react';

const ACCENTS = {
  cyan: 'border-neon-cyan/60',
  green: 'border-neon-green/60',
  pink: 'border-neon-pink/60',
  yellow: 'border-neon-yellow/60',
  plain: 'border-navy-600',
} as const;

export function PixelPanel({
  title, accent = 'plain', action, children, className = '',
}: {
  title?: string;
  accent?: keyof typeof ACCENTS;
  action?: ReactNode;
  children: ReactNode;
  className?: string;
}) {
  return (
    <section className={`pixel-border ${ACCENTS[accent]} bg-navy-900/80 p-4 sm:p-5 ${className}`}>
      {(title || action) && (
        <header className="mb-4 flex items-center justify-between gap-3">
          {title && <h2 className="pixel-heading text-[11px] text-slate-100">{title}</h2>}
          {action}
        </header>
      )}
      {children}
    </section>
  );
}
