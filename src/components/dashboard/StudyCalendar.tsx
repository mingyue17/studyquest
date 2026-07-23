'use client';
import { useStore } from '@/store/useStore';
import { buildStudyCalendar, toDateKey } from '@/lib/streaks';

const INTENSITY = ['bg-navy-800', 'bg-neon-green/25', 'bg-neon-green/50', 'bg-neon-green/75', 'bg-neon-green'];

/** One square per day, 20 weeks back. Frozen days show as cyan, not empty. */
export function StudyCalendar() {
  const sessions = useStore((s) => s.sessions);
  const streakRecords = useStore((s) => s.streakRecords);

  const minutesByDate: Record<string, number> = {};
  sessions.forEach((s) => {
    if (!s.completedAt) return;
    const key = toDateKey(s.completedAt);
    minutesByDate[key] = (minutesByDate[key] ?? 0) + s.durationMinutes;
  });

  const cells = buildStudyCalendar(streakRecords, minutesByDate);

  // Group into columns of 7 (weeks) for the grid layout.
  const weeks: (typeof cells)[] = [];
  for (let i = 0; i < cells.length; i += 7) weeks.push(cells.slice(i, i + 7));

  return (
    <div>
      <div className="flex gap-[3px] overflow-x-auto pb-2">
        {weeks.map((week, wi) => (
          <div key={wi} className="flex flex-col gap-[3px]">
            {week.map((cell) => (
              <span
                key={cell.date}
                title={`${cell.date} — ${cell.minutes} min${cell.freezeUsed ? ' (freeze used)' : ''}`}
                className={`h-3 w-3 shrink-0 border border-navy-950 ${
                  cell.freezeUsed ? 'bg-neon-cyan/70' : INTENSITY[cell.intensity]
                }`}
              />
            ))}
          </div>
        ))}
      </div>
      <div className="mt-2 flex items-center gap-2 text-[11px] text-slate-500">
        <span>Less</span>
        {INTENSITY.map((c) => <span key={c} className={`h-3 w-3 border border-navy-950 ${c}`} />)}
        <span>More</span>
        <span className="ml-3 flex items-center gap-1.5">
          <span className="h-3 w-3 border border-navy-950 bg-neon-cyan/70" /> freeze
        </span>
      </div>
    </div>
  );
}
