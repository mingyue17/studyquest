'use client';

import { useMemo, useState } from 'react';
import { Search, ChevronRight, Split, Users, User as UserIcon } from 'lucide-react';
import { PixelPanel } from '@/components/ui/PixelPanel';
import { PixelButton } from '@/components/ui/PixelButton';
import { ProgressBar } from '@/components/ui/ProgressBar';
import { useStore } from '@/store/useStore';
import { detectDeadlineClashes, priorityLabel } from '@/lib/priority';
import { formatDeadline, countdown, SOURCE_STYLES } from '@/lib/formatters';
import type { SourcePlatform, TaskStatus } from '@/types';

const STATUS_TONE: Record<TaskStatus, string> = {
  'To Do': 'text-slate-400 border-slate-600',
  'In Progress': 'text-neon-cyan border-neon-cyan',
  Submitted: 'text-neon-green border-neon-green',
};

const PRIORITY_TONE = {
  critical: 'text-neon-red border-neon-red',
  high: 'text-neon-pink border-neon-pink',
  medium: 'text-neon-yellow border-neon-yellow',
  low: 'text-slate-400 border-slate-600',
} as const;

export default function QuestsPage() {
  const { tasks, modules, boss } = useStore();
  const setTaskStatus = useStore((s) => s.setTaskStatus);
  const splitIntoSubquests = useStore((s) => s.splitIntoSubquests);
  const damageBoss = useStore((s) => s.damageBoss);

  const [query, setQuery] = useState('');
  const [sourceFilter, setSourceFilter] = useState<SourcePlatform | 'All'>('All');
  const [statusFilter, setStatusFilter] = useState<TaskStatus | 'All'>('All');
  const [sortBy, setSortBy] = useState<'priority' | 'deadline'>('priority');
  const [expanded, setExpanded] = useState<string | null>(null);

  const clashes = useMemo(() => detectDeadlineClashes(tasks), [tasks]);
  const moduleCode = (id: string | null) => modules.find((m) => m.moduleId === id)?.moduleCode ?? 'GEN';

  const visible = useMemo(() => {
    const parents = tasks.filter((t) => !t.parentTaskId);
    return parents
      .filter((t) => sourceFilter === 'All' || t.source === sourceFilter)
      .filter((t) => statusFilter === 'All' || t.status === statusFilter)
      .filter((t) =>
        query.trim() === '' ||
        t.title.toLowerCase().includes(query.toLowerCase()) ||
        moduleCode(t.moduleId).toLowerCase().includes(query.toLowerCase()))
      .sort((a, b) =>
        sortBy === 'priority'
          ? b.priorityScore - a.priorityScore
          : +new Date(a.deadline) - +new Date(b.deadline));
  }, [tasks, sourceFilter, statusFilter, query, sortBy, modules]);

  const subquestsOf = (taskId: string) => tasks.filter((t) => t.parentTaskId === taskId);

  return (
    <div className="space-y-6">
      <header>
        <h1 className="pixel-heading text-base text-neon-green sm:text-lg">Quests</h1>
        <p className="mt-2 text-sm text-slate-400">
          Everything from SNAPP, PoliteMall and Teams, in one queue.
        </p>
      </header>

      {/* Boss battle — finals get their own treatment. */}
      <PixelPanel title="Boss battle" accent="pink">
        <div className="grid gap-5 md:grid-cols-2">
          <div>
            <p className="pixel-heading text-[11px] text-neon-red">{boss.bossName}</p>
            <div className="mt-3"><ProgressBar value={boss.health} tone="red" label="Boss health" /></div>
            <p className="mt-3 text-xs text-slate-400">
              {boss.health === 0 ? 'Defeated. Badge unlocked.' : `${boss.xpReward} XP when health hits zero.`}
            </p>
          </div>
          <ul className="space-y-2">
            {boss.checklist.map((item, i) => (
              <li key={item.label}>
                <button
                  onClick={() => damageBoss(i)}
                  disabled={item.done}
                  className="focus-ring flex w-full items-center justify-between gap-3 border-2 border-navy-700 bg-navy-950 p-3 text-left hover:border-neon-red/60 disabled:opacity-60 disabled:hover:border-navy-700"
                >
                  <span className={`text-xs ${item.done ? 'text-slate-500 line-through' : 'text-slate-200'}`}>{item.label}</span>
                  <span className="shrink-0 font-pixel text-[8px] text-neon-red">-{item.damage}%</span>
                </button>
              </li>
            ))}
          </ul>
        </div>
      </PixelPanel>

      {/* Controls */}
      <PixelPanel accent="plain">
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          <label className="relative block">
            <span className="sr-only">Search quests</span>
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-500" aria-hidden />
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search title or module"
              className="focus-ring w-full border-2 border-navy-600 bg-navy-950 py-2.5 pl-9 pr-3 text-sm text-slate-200 placeholder:text-slate-600"
            />
          </label>

          <SelectField label="Platform" value={sourceFilter} onChange={(v) => setSourceFilter(v as SourcePlatform | 'All')}
            options={['All', 'SNAPP', 'PoliteMall', 'Teams']} />
          <SelectField label="Status" value={statusFilter} onChange={(v) => setStatusFilter(v as TaskStatus | 'All')}
            options={['All', 'To Do', 'In Progress', 'Submitted']} />
          <SelectField label="Sort by" value={sortBy} onChange={(v) => setSortBy(v as 'priority' | 'deadline')}
            options={['priority', 'deadline']} />
        </div>
      </PixelPanel>

      {visible.length === 0 ? (
        <PixelPanel accent="plain">
          <p className="text-sm text-slate-400">
            No quests match those filters. Clear the search or switch the platform back to All.
          </p>
        </PixelPanel>
      ) : (
        <ul className="space-y-3">
          {visible.map((task) => {
            const style = SOURCE_STYLES[task.source];
            const priority = priorityLabel(task.priorityScore);
            const clashing = clashes.some((c) => c.taskIds.includes(task.taskId));
            const subs = subquestsOf(task.taskId);
            const isOpen = expanded === task.taskId;

            return (
              <li key={task.taskId} className="pixel-border border-navy-600 bg-navy-900/80">
                <div className="p-4">
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className={`border px-1.5 py-0.5 font-pixel text-[8px] ${style.className}`}>{style.label}</span>
                        <span className={`border px-1.5 py-0.5 font-pixel text-[8px] ${PRIORITY_TONE[priority.tone]}`}>{priority.label}</span>
                        <span className={`border px-1.5 py-0.5 font-pixel text-[8px] ${STATUS_TONE[task.status]}`}>{task.status}</span>
                        {task.isFinal && <span className="font-pixel text-[8px] text-neon-yellow">🚀 FINAL</span>}
                        {clashing && <span className="font-pixel text-[8px] text-neon-red">⚠ CLASH</span>}
                      </div>
                      <h3 className="mt-2.5 text-sm font-medium text-slate-100">{task.title}</h3>
                      <p className="mt-1 text-xs text-slate-500">
                        {moduleCode(task.moduleId)} · {task.taskType} · {task.weightage}% of grade · ~{task.estimatedHours}h
                      </p>
                    </div>

                    <div className="text-right">
                      <p className="font-pixel text-[9px] text-slate-300">{formatDeadline(task.deadline)}</p>
                      <p className="mt-1 text-[11px] text-slate-500">{countdown(task.deadline)} left · +{task.xpReward} XP</p>
                      <p className="mt-1 flex items-center justify-end gap-1 text-[11px] text-slate-500">
                        {task.isGroupTask ? <Users className="h-3 w-3" aria-hidden /> : <UserIcon className="h-3 w-3" aria-hidden />}
                        {task.isGroupTask ? 'Group' : 'Individual'}
                      </p>
                    </div>
                  </div>

                  <div className="mt-4"><ProgressBar value={task.progress} tone={task.status === 'Submitted' ? 'green' : 'cyan'} label="Progress" /></div>

                  <div className="mt-4 flex flex-wrap gap-2">
                    {task.status === 'To Do' && (
                      <PixelButton tone="cyan" onClick={() => setTaskStatus(task.taskId, 'In Progress')}>Start</PixelButton>
                    )}
                    {task.status !== 'Submitted' && (
                      <PixelButton tone="green" onClick={() => setTaskStatus(task.taskId, 'Submitted')}>Mark done</PixelButton>
                    )}
                    {task.status !== 'To Do' && (
                      <PixelButton tone="ghost" onClick={() => setTaskStatus(task.taskId, task.status === 'Submitted' ? 'In Progress' : 'To Do')}>Undo</PixelButton>
                    )}
                    {task.estimatedHours > 3 && subs.length === 0 && (
                      <PixelButton tone="yellow" onClick={() => splitIntoSubquests(task.taskId)}>
                        <Split className="mr-1.5 inline h-3 w-3" aria-hidden />Split into subquests
                      </PixelButton>
                    )}
                    {subs.length > 0 && (
                      <PixelButton tone="ghost" onClick={() => setExpanded(isOpen ? null : task.taskId)} aria-expanded={isOpen}>
                        <ChevronRight className={`mr-1.5 inline h-3 w-3 transition-transform ${isOpen ? 'rotate-90' : ''}`} aria-hidden />
                        {subs.filter((s) => s.status === 'Submitted').length}/{subs.length} subquests
                      </PixelButton>
                    )}
                  </div>
                </div>

                {isOpen && subs.length > 0 && (
                  <ul className="border-t-4 border-navy-700 bg-navy-950/60 p-4 space-y-2">
                    {subs.map((sub) => (
                      <li key={sub.taskId} className="flex items-center justify-between gap-3 border-2 border-navy-700 p-3">
                        <div className="min-w-0">
                          <p className={`truncate text-xs ${sub.status === 'Submitted' ? 'text-slate-500 line-through' : 'text-slate-200'}`}>{sub.title}</p>
                          <p className="mt-0.5 text-[11px] text-slate-500">~{sub.estimatedHours}h · by {formatDeadline(sub.deadline)}</p>
                        </div>
                        <PixelButton
                          tone={sub.status === 'Submitted' ? 'ghost' : 'green'}
                          onClick={() => setTaskStatus(sub.taskId, sub.status === 'Submitted' ? 'To Do' : 'Submitted')}
                        >
                          {sub.status === 'Submitted' ? 'Undo' : 'Done'}
                        </PixelButton>
                      </li>
                    ))}
                  </ul>
                )}
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}

function SelectField({ label, value, onChange, options }: {
  label: string; value: string; onChange: (v: string) => void; options: string[];
}) {
  return (
    <label className="block">
      <span className="mb-1 block font-pixel text-[8px] uppercase text-slate-500">{label}</span>
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="focus-ring w-full border-2 border-navy-600 bg-navy-950 px-3 py-2 text-sm capitalize text-slate-200"
      >
        {options.map((o) => <option key={o} value={o}>{o}</option>)}
      </select>
    </label>
  );
}
