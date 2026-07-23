export const SOURCE_STYLES: Record<string, { label: string; className: string }> = {
  SNAPP:      { label: 'SNAPP',      className: 'text-neon-cyan border-neon-cyan' },
  PoliteMall: { label: 'PoliteMall', className: 'text-neon-pink border-neon-pink' },
  Teams:      { label: 'Teams',      className: 'text-neon-yellow border-neon-yellow' },
  Manual:     { label: 'Manual',     className: 'text-slate-300 border-slate-500' },
};

export function formatDeadline(iso: string): string {
  const d = new Date(iso);
  const hours = (d.getTime() - Date.now()) / 3_600_000;
  const time = d.toLocaleTimeString('en-SG', { hour: 'numeric', minute: '2-digit' });
  if (hours < 0) return `Overdue · ${d.toLocaleDateString('en-SG', { day: 'numeric', month: 'short' })}`;
  if (hours < 24) return `Today ${time}`;
  if (hours < 48) return `Tomorrow ${time}`;
  return `${d.toLocaleDateString('en-SG', { weekday: 'short', day: 'numeric', month: 'short' })} ${time}`;
}

/** Compact "24/7, 2359" style — used on the study calendar where space is tight. */
export function formatDeadlineCompact(iso: string): string {
  const d = new Date(iso);
  const day = d.getDate();
  const month = d.getMonth() + 1;
  const time = `${String(d.getHours()).padStart(2, '0')}${String(d.getMinutes()).padStart(2, '0')}`;
  return `${day}/${month}, ${time}`;
}

export function countdown(iso: string): string {
  const ms = new Date(iso).getTime() - Date.now();
  if (ms <= 0) return 'now';
  const days = Math.floor(ms / 86_400_000);
  const hours = Math.floor((ms % 86_400_000) / 3_600_000);
  return days > 0 ? `${days}d ${hours}h` : `${hours}h`;
}
