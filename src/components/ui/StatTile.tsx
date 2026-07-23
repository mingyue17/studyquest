import type { LucideIcon } from 'lucide-react';

export function StatTile({
  icon: Icon, label, value, sub, tone = 'text-neon-cyan',
}: { icon: LucideIcon; label: string; value: string | number; sub?: string; tone?: string }) {
  return (
    <div className="pixel-border border-navy-600 bg-navy-900/80 p-3">
      <div className="flex items-center gap-2 text-slate-400">
        <Icon className={`h-4 w-4 ${tone}`} aria-hidden />
        <span className="font-pixel text-[8px] uppercase tracking-wider">{label}</span>
      </div>
      <p className={`mt-2 font-pixel text-lg ${tone}`}>{value}</p>
      {sub && <p className="mt-1 text-xs text-slate-500">{sub}</p>}
    </div>
  );
}
