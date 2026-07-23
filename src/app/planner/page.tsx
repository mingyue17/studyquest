'use client';

import { useMemo, useState } from 'react';
import { RefreshCw, Moon, AlertTriangle, ArrowRight } from 'lucide-react';
import { PixelPanel } from '@/components/ui/PixelPanel';
import { PixelButton } from '@/components/ui/PixelButton';
import { useStore } from '@/store/useStore';
import {
  DAY_NAMES, detectOverloadedDays, recommendTonight, suggestEarlierStarts,
} from '@/lib/planner';
import { detectDeadlineClashes } from '@/lib/priority';
import { SOURCE_STYLES } from '@/lib/formatters';

const START_HOUR = 14; // grid begins at 2pm, runs to midnight
const END_HOUR = 24;

export default function PlannerPage() {
  const { tasks, modules, plannedSessions, plannerPreferences } = useStore();
  const regenerateSchedule = useStore((s) => s.regenerateSchedule);
  const movePlannedSession = useStore((s) => s.movePlannedSession);
  const togglePlannedSession = useStore((s) => s.togglePlannedSession);
  const setPreferences = useStore((s) => s.setPreferences);

  const [draggingId, setDraggingId] = useState<string | null>(null);

  const tonight = useMemo(() => recommendTonight(tasks, modules, plannerPreferences), [tasks, modules, plannerPreferences]);
  const overloadedDays = useMemo(() => detectOverloadedDays(plannedSessions, plannerPreferences), [plannedSessions, plannerPreferences]);
  const clashes = useMemo(() => detectDeadlineClashes(tasks), [tasks]);
  const earlierStarts = useMemo(() => suggestEarlierStarts(tasks), [tasks]);

  const moduleCode = (id: string | null) => modules.find((m) => m.moduleId === id)?.moduleCode ?? 'GEN';

  const hours = Array.from({ length: END_HOUR - START_HOUR }, (_, i) => START_HOUR + i);

  return (
    <div className="space-y-6">
      <header className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="pixel-heading text-base text-neon-green sm:text-lg">AI Planner</h1>
          <p className="mt-2 text-sm text-slate-400">
            A week built from what's due, what it's worth, and how far along you are.
          </p>
        </div>
        <PixelButton tone="cyan" onClick={regenerateSchedule}>
          <RefreshCw className="mr-1.5 inline h-3 w-3" aria-hidden />Regenerate schedule
        </PixelButton>
      </header>

      {tonight && (
        <PixelPanel title="Study tonight" accent="yellow">
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div className="flex items-start gap-3">
              <Moon className="mt-0.5 h-5 w-5 shrink-0 text-neon-yellow" aria-hidden />
              <div>
                <p className="text-sm text-slate-100">
                  <span className="font-medium">{tonight.task.title}</span> · {tonight.moduleCode}
                </p>
                <p className="mt-1.5 text-xs text-slate-400">
                  {tonight.minutes} minutes at {tonight.startHour}:00 — {tonight.reason}.
                </p>
              </div>
            </div>
          </div>
        </PixelPanel>
      )}

      {(overloadedDays.length > 0 || clashes.length > 0) && (
        <div className="grid gap-4 sm:grid-cols-2">
          {overloadedDays.length > 0 && (
            <div className="pixel-border border-neon-red bg-neon-red/10 p-4">
              <div className="flex items-start gap-3">
                <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-neon-red" aria-hidden />
                <p className="text-xs text-slate-300">
                  <span className="font-pixel text-[9px] text-neon-red">OVERLOADED: </span>
                  {overloadedDays.map((d) => DAY_NAMES[d]).join(', ')} — more planned than your stated availability. Drag a block to a lighter day.
                </p>
              </div>
            </div>
          )}
          {clashes.length > 0 && (
            <div className="pixel-border border-neon-pink bg-neon-pink/10 p-4">
              <div className="flex items-start gap-3">
                <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-neon-pink" aria-hidden />
                <p className="text-xs text-slate-300">
                  <span className="font-pixel text-[9px] text-neon-pink">CLASH: </span>
                  {clashes[0].titles.join(' + ')} need about {clashes[0].totalHours}h combined with little runway between them.
                </p>
              </div>
            </div>
          )}
        </div>
      )}

      <PixelPanel title="This week" accent="cyan">
        <div className="overflow-x-auto">
          <div className="grid min-w-[640px] grid-cols-7 gap-2">
            {DAY_NAMES.map((day, dayIndex) => {
              const dayLoad = plannedSessions
                .filter((p) => p.day === dayIndex)
                .reduce((sum, p) => sum + p.durationMinutes, 0) / 60;
              const overloaded = overloadedDays.includes(dayIndex);
              return (
                <div
                  key={day}
                  onDragOver={(e) => e.preventDefault()}
                  onDrop={() => { if (draggingId) { movePlannedSession(draggingId, dayIndex); setDraggingId(null); } }}
                  className={`min-h-[240px] border-2 p-2 ${overloaded ? 'border-neon-red/60 bg-neon-red/5' : 'border-navy-700 bg-navy-950/60'}`}
                >
                  <p className={`mb-2 text-center font-pixel text-[9px] ${overloaded ? 'text-neon-red' : 'text-slate-400'}`}>
                    {day} · {dayLoad}h
                  </p>
                  <div className="space-y-1.5">
                    {plannedSessions.filter((p) => p.day === dayIndex).map((session) => (
                      <div
                        key={session.sessionId}
                        draggable
                        onDragStart={() => setDraggingId(session.sessionId)}
                        onClick={() => togglePlannedSession(session.sessionId)}
                        role="button"
                        tabIndex={0}
                        onKeyDown={(e) => e.key === 'Enter' && togglePlannedSession(session.sessionId)}
                        title="Drag to another day, or click to mark complete"
                        className={`focus-ring cursor-grab border-2 p-1.5 text-[10px] leading-tight transition-opacity active:cursor-grabbing ${
                          session.completed
                            ? 'border-neon-green/50 bg-neon-green/10 text-slate-500 line-through'
                            : 'border-navy-600 bg-navy-900 text-slate-200 hover:border-neon-cyan/60'
                        }`}
                      >
                        <p className="font-pixel text-[8px] text-neon-cyan">{session.moduleCode}</p>
                        <p className="mt-0.5 truncate">{session.title}</p>
                        <p className="mt-0.5 text-slate-500">{session.startHour}:00 · {session.durationMinutes}m</p>
                      </div>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
        <p className="mt-3 text-[11px] text-slate-500">
          Drag a block onto another day to reschedule it. Click a block to mark it complete and log the XP.
        </p>
      </PixelPanel>

      <div className="grid gap-6 lg:grid-cols-2">
        <PixelPanel title="Preferences" accent="plain">
          <div className="space-y-4">
            <div>
              <label className="mb-1.5 block font-pixel text-[8px] uppercase text-slate-500" htmlFor="startHour">
                Preferred start time
              </label>
              <select
                id="startHour"
                value={plannerPreferences.preferredStartHour}
                onChange={(e) => setPreferences({ preferredStartHour: Number(e.target.value) })}
                className="focus-ring w-full border-2 border-navy-600 bg-navy-950 px-3 py-2 text-sm text-slate-200"
              >
                {[14, 16, 18, 19, 20, 21, 22].map((h) => <option key={h} value={h}>{h}:00</option>)}
              </select>
            </div>
            <div>
              <label className="mb-1.5 block font-pixel text-[8px] uppercase text-slate-500" htmlFor="sessionLength">
                Session block length
              </label>
              <select
                id="sessionLength"
                value={plannerPreferences.sessionMinutes}
                onChange={(e) => setPreferences({ sessionMinutes: Number(e.target.value) })}
                className="focus-ring w-full border-2 border-navy-600 bg-navy-950 px-3 py-2 text-sm text-slate-200"
              >
                {[30, 45, 60, 90].map((m) => <option key={m} value={m}>{m} minutes</option>)}
              </select>
            </div>
            <p className="text-[11px] text-slate-500">
              Weak modules ({modules.filter((m) => m.isWeak).map((m) => m.moduleCode).join(', ') || 'none flagged'}) get a priority boost automatically.
            </p>
          </div>
        </PixelPanel>

        <PixelPanel title="Start these earlier" accent="pink">
          {earlierStarts.length === 0 ? (
            <p className="text-sm text-slate-400">Nothing is running behind its runway right now.</p>
          ) : (
            <ul className="space-y-2">
              {earlierStarts.slice(0, 4).map(({ task, hoursPerDay }) => (
                <li key={task.taskId} className="flex items-center justify-between gap-3 border-2 border-navy-700 bg-navy-950 p-3">
                  <div className="min-w-0">
                    <p className="truncate text-xs text-slate-200">{task.title}</p>
                    <p className="mt-0.5 text-[11px] text-slate-500">{moduleCode(task.moduleId)}</p>
                  </div>
                  <span className="shrink-0 flex items-center gap-1 font-pixel text-[8px] text-neon-red">
                    {Math.round(hoursPerDay * 10) / 10}h/day needed <ArrowRight className="h-3 w-3" aria-hidden />
                  </span>
                </li>
              ))}
            </ul>
          )}
        </PixelPanel>
      </div>
    </div>
  );
}
