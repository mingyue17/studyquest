'use client';

import { useMemo, useState } from 'react';
import { Search, ChevronRight, Split, Users, User as UserIcon, Plus, Trash2, X } from 'lucide-react';
import { PixelPanel } from '@/components/ui/PixelPanel';
import { PixelButton } from '@/components/ui/PixelButton';
import { ProgressBar } from '@/components/ui/ProgressBar';
import { useStore } from '@/store/useStore';
import { detectDeadlineClashes, priorityLabel } from '@/lib/priority';
import { formatDeadline, countdown, SOURCE_STYLES } from '@/lib/formatters';
import type { SourcePlatform, TaskStatus } from '@/types';

const TASK_TYPES = [
  'Assignment', 'Quiz', 'Practical Assessment', 'Continuous Assessment',
  'Final Assessment', 'Team Project', 'Reflection', 'Reading', 'Other',
];

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
  const addTask = useStore((s) => s.addTask);
  const deleteTask = useStore((s) => s.deleteTask);

  const [query, setQuery] = useState('');
  const [sourceFilter, setSourceFilter] = useState<SourcePlatform | 'All'>('All');
  const [statusFilter, setStatusFilter] = useState<TaskStatus | 'All'>('All');
  const [sortBy, setSortBy] = useState<'priority' | 'deadline'>('priority');
  const [expanded, setExpanded] = useState<string | null>(null);
  const [showAddForm, setShowAddForm] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState<string | null>(null);

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
      <header className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="pixel-heading text-base text-neon-green sm:text-lg">Quests</h1>
          <p className="mt-2 text-sm text-slate-400">
            Everything from SNAPP, PoliteMall and Teams, in one queue.
          </p>
        </div>
        <PixelButton tone={showAddForm ? 'ghost' : 'green'} onClick={() => setShowAddForm((v) => !v)}>
          {showAddForm ? <><X className="mr-1.5 inline h-3 w-3" aria-hidden />Cancel</> : <><Plus className="mr-1.5 inline h-3 w-3" aria-hidden />Add quest</>}
        </PixelButton>
      </header>

      {showAddForm && <AddTaskForm modules={modules} onAdd={addTask} onDone={() => setShowAddForm(false)} />}

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

                  <div className="mt-4 flex flex-wrap items-center gap-2">
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

                    <span className="ml-auto flex items-center gap-2">
                      {confirmDelete === task.taskId ? (
                        <>
                          <span className="text-[11px] text-slate-400">Delete this quest?</span>
                          <PixelButton tone="ghost" onClick={() => { deleteTask(task.taskId); setConfirmDelete(null); }} className="!border-neon-red !text-neon-red">
                            Yes, delete
                          </PixelButton>
                          <PixelButton tone="ghost" onClick={() => setConfirmDelete(null)}>Cancel</PixelButton>
                        </>
                      ) : (
                        <button
                          onClick={() => setConfirmDelete(task.taskId)}
                          aria-label="Delete quest"
                          title="Delete quest"
                          className="focus-ring border-2 border-transparent p-1.5 text-slate-500 transition-colors hover:border-neon-red/60 hover:text-neon-red"
                        >
                          <Trash2 className="h-3.5 w-3.5" aria-hidden />
                        </button>
                      )}
                    </span>
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

function AddTaskForm({
  modules, onAdd, onDone,
}: {
  modules: { moduleId: string; moduleCode: string }[];
  onAdd: (input: {
    title: string; moduleId: string | null; deadline: string; taskType: string;
    weightage: number; estimatedHours: number; difficulty: number; isFinal: boolean; isGroupTask: boolean;
  }) => void;
  onDone: () => void;
}) {
  const addModule = useStore((s) => s.addModule);

  const [title, setTitle] = useState('');
  const [moduleId, setModuleId] = useState(modules[0]?.moduleId ?? '');
  const [addingModule, setAddingModule] = useState(modules.length === 0);
  const [newModuleCode, setNewModuleCode] = useState('');
  const [newModuleName, setNewModuleName] = useState('');
  const [newModuleCredits, setNewModuleCredits] = useState(3);
  const [taskType, setTaskType] = useState(TASK_TYPES[0]);
  const [deadline, setDeadline] = useState('');
  const [weightage, setWeightage] = useState(10);
  const [estimatedHours, setEstimatedHours] = useState(2);
  const [difficulty, setDifficulty] = useState(2);
  const [isFinal, setIsFinal] = useState(false);
  const [isGroupTask, setIsGroupTask] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) { setError('Give the quest a title.'); return; }
    if (!deadline) { setError('Pick a deadline.'); return; }

    let finalModuleId: string | null = moduleId || null;
    if (addingModule) {
      if (!newModuleCode.trim() || !newModuleName.trim()) { setError('Fill in the module code and name, or switch back to an existing module.'); return; }
      finalModuleId = addModule({ moduleCode: newModuleCode, moduleName: newModuleName, moduleCredits: newModuleCredits }).moduleId;
    }

    onAdd({
      title, moduleId: finalModuleId, deadline: new Date(deadline).toISOString(), taskType,
      weightage, estimatedHours, difficulty, isFinal, isGroupTask,
    });
    onDone();
  };

  return (
    <PixelPanel title="New quest" accent="green">
      <form onSubmit={submit} className="space-y-4">
        <label className="block">
          <span className="mb-1 block font-pixel text-[8px] uppercase text-slate-500">Title</span>
          <input
            value={title} onChange={(e) => setTitle(e.target.value)}
            placeholder="e.g. C240 Peer Review Draft"
            className="focus-ring w-full border-2 border-navy-600 bg-navy-950 px-3 py-2 text-sm text-slate-200 placeholder:text-slate-600"
          />
        </label>

        <div>
          <span className="mb-1 block font-pixel text-[8px] uppercase text-slate-500">Module</span>
          {!addingModule ? (
            <div className="flex flex-wrap items-center gap-2">
              <select
                value={moduleId} onChange={(e) => setModuleId(e.target.value)}
                className="focus-ring flex-1 border-2 border-navy-600 bg-navy-950 px-3 py-2 text-sm text-slate-200"
              >
                {modules.map((m) => <option key={m.moduleId} value={m.moduleId}>{m.moduleCode}</option>)}
              </select>
              <PixelButton type="button" tone="ghost" onClick={() => setAddingModule(true)}>+ New module</PixelButton>
            </div>
          ) : (
            <div className="grid gap-2 border-2 border-navy-700 bg-navy-950 p-3 sm:grid-cols-3">
              <input value={newModuleCode} onChange={(e) => setNewModuleCode(e.target.value)} placeholder="Code, e.g. C299"
                className="focus-ring border-2 border-navy-600 bg-navy-900 px-2 py-1.5 text-sm text-slate-200 placeholder:text-slate-600" />
              <input value={newModuleName} onChange={(e) => setNewModuleName(e.target.value)} placeholder="Module name"
                className="focus-ring border-2 border-navy-600 bg-navy-900 px-2 py-1.5 text-sm text-slate-200 placeholder:text-slate-600 sm:col-span-2" />
              <label className="flex items-center gap-2 text-xs text-slate-400 sm:col-span-3">
                Module Credits (MC)
                <input type="number" min={1} max={10} value={newModuleCredits} onChange={(e) => setNewModuleCredits(Number(e.target.value))}
                  className="focus-ring w-20 border-2 border-navy-600 bg-navy-900 px-2 py-1 text-sm text-slate-200" />
                {modules.length > 0 && (
                  <button type="button" onClick={() => setAddingModule(false)} className="focus-ring ml-auto text-neon-cyan underline-offset-2 hover:underline">
                    Use an existing module instead
                  </button>
                )}
              </label>
            </div>
          )}
        </div>

        <div className="grid gap-3 sm:grid-cols-2">
          <label className="block">
            <span className="mb-1 block font-pixel text-[8px] uppercase text-slate-500">Deadline</span>
            <input
              type="datetime-local" value={deadline} onChange={(e) => setDeadline(e.target.value)}
              className="focus-ring w-full border-2 border-navy-600 bg-navy-950 px-3 py-2 text-sm text-slate-200"
            />
          </label>
          <label className="block">
            <span className="mb-1 block font-pixel text-[8px] uppercase text-slate-500">Type</span>
            <select value={taskType} onChange={(e) => setTaskType(e.target.value)}
              className="focus-ring w-full border-2 border-navy-600 bg-navy-950 px-3 py-2 text-sm text-slate-200">
              {TASK_TYPES.map((t) => <option key={t} value={t}>{t}</option>)}
            </select>
          </label>
        </div>

        <div className="grid gap-3 sm:grid-cols-3">
          <label className="block">
            <span className="mb-1 block font-pixel text-[8px] uppercase text-slate-500">% of grade</span>
            <input type="number" min={0} max={100} value={weightage} onChange={(e) => setWeightage(Number(e.target.value))}
              className="focus-ring w-full border-2 border-navy-600 bg-navy-950 px-3 py-2 text-sm text-slate-200" />
          </label>
          <label className="block">
            <span className="mb-1 block font-pixel text-[8px] uppercase text-slate-500">Est. hours</span>
            <input type="number" min={0.5} step={0.5} value={estimatedHours} onChange={(e) => setEstimatedHours(Number(e.target.value))}
              className="focus-ring w-full border-2 border-navy-600 bg-navy-950 px-3 py-2 text-sm text-slate-200" />
          </label>
          <label className="block">
            <span className="mb-1 block font-pixel text-[8px] uppercase text-slate-500">Difficulty</span>
            <select value={difficulty} onChange={(e) => setDifficulty(Number(e.target.value))}
              className="focus-ring w-full border-2 border-navy-600 bg-navy-950 px-3 py-2 text-sm text-slate-200">
              {[1, 2, 3, 4, 5].map((d) => <option key={d} value={d}>{d}</option>)}
            </select>
          </label>
        </div>

        <div className="flex flex-wrap gap-4">
          <label className="flex items-center gap-2 text-sm text-slate-300">
            <input type="checkbox" checked={isGroupTask} onChange={(e) => setIsGroupTask(e.target.checked)} className="h-4 w-4 accent-[#22e0ff]" />
            Group task
          </label>
          <label className="flex items-center gap-2 text-sm text-slate-300">
            <input type="checkbox" checked={isFinal} onChange={(e) => setIsFinal(e.target.checked)} className="h-4 w-4 accent-[#ff5470]" />
            Final assessment
          </label>
        </div>

        {error && <p className="border-2 border-neon-red bg-neon-red/10 p-2 text-xs text-neon-red">{error}</p>}

        <div className="flex gap-2">
          <PixelButton type="submit" tone="green">Add quest</PixelButton>
          <PixelButton type="button" tone="ghost" onClick={onDone}>Cancel</PixelButton>
        </div>
      </form>
    </PixelPanel>
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
