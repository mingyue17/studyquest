'use client';
import { useMemo } from 'react';
import { CalendarClock } from 'lucide-react';
import { useStore } from '@/store/useStore';
import { buildStudyCalendar, toDateKey, type CalendarDeadline } from '@/lib/streaks';
import { formatDeadlineCompact } from '@/lib/formatters';

const INTENSITY = ['bg-navy-800', 'bg-neon-green/25', 'bg-neon-green/50', 'bg-neon-green/75', 'bg-neon-green'];

/** One square per day: 20 weeks of study history, then 3 weeks ahead so deadlines have somewhere to land. */
export function StudyCalendar() {
  const sessions = useStore((s) => s.sessions);
  const streakRecords = useStore((s) => s.streakRecords);
  const tasks = useStore((s) => s.tasks);
  const modules = useStore((s) => s.modules);

  const moduleCode = (id: string | null) => modules.find((m) => m.moduleId === id)?.moduleCode ?? 'GEN';

  const minutesByDate: Record<string, number> = {};
  sessions.forEach((s) => {
    if (!s.completedAt) return;
    const key = toDateKey(s.completedAt);
    minutesByDate[key] = (minutesByDate[key] ?? 0) + s.durationMinutes;
  });

  const deadlines: CalendarDeadline[] = useMemo(
    () => tasks
      .filter((t) => t.status !== 'Submitted' && !t.parentTaskId)
      .map((t) => ({ moduleCode: moduleCode(t.moduleId), title: t.title, deadline: t.deadline })),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [tasks, modules],
  );

  const cells = buildStudyCalendar(streakRecords, minutesByDate, 20, deadlines, 3);

  // Group into columns of 7 (weeks) for the grid layout.
  const weeks: (typeof cells)[] = [];
  for (let i = 0; i < cells.length; i += 7) weeks.push(cells.slice(i, i + 7));

  const upcoming = useMemo(
    () => [...deadlines].sort((a, b) => +new Date(a.deadline) - +new Date(b.deadline)).slice(0, 4),
    [deadlines],
  );

  return (
    <div>
      <div className="flex gap-[3px] overflow-x-auto pb-2">
        {weeks.map((week, wi) => (
          <div key={wi} className="flex flex-col gap-[3px]">
            {week.map((cell) => {
              const hasDeadline = cell.deadlines.length > 0;
              const tooltip = [
                `${cell.date}${cell.isToday ? ' (today)' : ''}`,
                cell.isFuture ? null : `${cell.minutes} min studied${cell.freezeUsed ? ' (freeze used)' : ''}`,
                ...cell.deadlines.map((d) => `Due: ${d.moduleCode} — ${d.title} · ${formatDeadlineCompact(d.deadline)}`),
              ].filter(Boolean).join('\n');

              return (
                <span
                  key={cell.date}
                  title={tooltip}
                  className={`relative h-3 w-3 shrink-0 border ${
                    hasDeadline
                      ? 'border-neon-red ring-1 ring-neon-red'
                      : cell.isToday
                        ? 'border-neon-cyan'
                        : 'border-navy-950'
                  } ${
                    cell.freezeUsed
                      ? 'bg-neon-cyan/70'
                      : cell.isFuture
                        ? hasDeadline ? 'bg-neon-red/30' : 'bg-transparent'
                        : INTENSITY[cell.intensity]
                  }`}
                />
              );
            })}
          </div>
        ))}
      </div>

      <div className="mt-2 flex flex-wrap items-center gap-2 text-[11px] text-slate-500">
        <span>Less</span>
        {INTENSITY.map((c) => <span key={c} className={`h-3 w-3 border border-navy-950 ${c}`} />)}
        <span>More</span>
        <span className="ml-3 flex items-center gap-1.5">
          <span className="h-3 w-3 border border-navy-950 bg-neon-cyan/70" /> freeze
        </span>
        <span className="ml-3 flex items-center gap-1.5">
          <span className="h-3 w-3 border border-neon-red ring-1 ring-neon-red bg-neon-red/30" /> deadline
        </span>
      </div>

      {upcoming.length > 0 && (
        <div className="mt-4 border-t-2 border-navy-700 pt-3">
          <p className="mb-2 flex items-center gap-1.5 font-pixel text-[8px] uppercase tracking-wide text-slate-400">
            <CalendarClock className="h-3.5 w-3.5 text-neon-red" aria-hidden /> Upcoming deadlines
          </p>
          <ul className="space-y-1.5">
            {upcoming.map((d, i) => (
              <li key={`${d.moduleCode}-${i}`} className="flex items-center justify-between gap-3 text-xs text-slate-300">
                <span className="truncate">
                  <span className="font-pixel text-[9px] text-neon-red">{d.moduleCode}</span>{' '}
                  <span className="text-slate-400">{d.title}</span>
                </span>
                <span className="shrink-0 font-pixel text-[9px] text-slate-200">{formatDeadlineCompact(d.deadline)}</span>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
