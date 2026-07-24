const TONES = {
  green: 'bg-neon-green', cyan: 'bg-neon-cyan',
  pink: 'bg-neon-pink', yellow: 'bg-neon-yellow', red: 'bg-neon-red',
} as const;

/** Segmented arcade bar — 20 chunks so it reads as pixels, not a smooth gradient. */
export function ProgressBar({
  value, tone = 'green', label, showValue = true,
}: { value: number; tone?: keyof typeof TONES; label?: string; showValue?: boolean }) {
  const clamped = Math.max(0, Math.min(100, value));
  const filled = Math.round((clamped / 100) * 20);
  return (
    <div>
      {(label || showValue) && (
        <div className="mb-1.5 flex items-baseline justify-between font-pixel text-[9px] text-slate-400">
          {label && <span>{label}</span>}
          {showValue && <span className="text-slate-200">{clamped}%</span>}
        </div>
      )}
      <div
        className="flex gap-[2px] border-2 border-navy-600 bg-navy-950 p-[3px]"
        role="progressbar" aria-valuenow={clamped} aria-valuemin={0} aria-valuemax={100} aria-label={label}
      >
        {Array.from({ length: 20 }, (_, i) => (
          <span key={i} className={`h-3 flex-1 ${i < filled ? TONES[tone] : 'bg-navy-800'}`} />
        ))}
      </div>
    </div>
  );
}
