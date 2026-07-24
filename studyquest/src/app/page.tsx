'use client';

import { useEffect, useMemo } from 'react';
import Link from 'next/link';
import { Flame, Snowflake, Zap, Trophy, AlertTriangle, Timer, CheckCircle2, Circle } from 'lucide-react';
import { PixelPanel } from '@/components/ui/PixelPanel';
import { PixelButton } from '@/components/ui/PixelButton';
import { ProgressBar } from '@/components/ui/ProgressBar';
import { StatTile } from '@/components/ui/StatTile';
import { PetDisplay } from '@/components/pet/PetDisplay';
import { StudyCalendar } from '@/components/dashboard/StudyCalendar';
import { StudyTimeChart } from '@/components/dashboard/StudyTimeChart';
import { useStore } from '@/store/useStore';
import { levelProgress } from '@/lib/gamification';
import { detectDeadlineClashes, hoursUntil } from '@/lib/priority';
import { formatDeadline, countdown, SOURCE_STYLES } from '@/lib/formatters';
import { toDateKey } from '@/lib/streaks';

export default function DashboardPage() {
  const { user, tasks, sessions, dailyQuests, boss, modules } = useStore();
  const logStudyBlock = useStore((s) => s.logStudyBlock);
  const completeDailyQuest = useStore((s) => s.completeDailyQuest);
  const setPetMood = useStore((s) => s.setPetMood);

  const progress = levelProgress(user.totalXp);
  const clashes = useMemo(() => detectDeadlineClashes(tasks), [tasks]);

  const upcoming = useMemo(
    () => tasks
      .filter((t) => t.status !== 'Submitted' && !t.parentTaskId)
      .sort((a, b) => +new Date(a.deadline) - +new Date(b.deadline))
      .slice(0, 5),
    [tasks]);

  const finals = useMemo(
    () => tasks.filter((t) => t.isFinal).sort((a, b) => +new Date(a.deadline) - +new Date(b.deadline)),
    [tasks]);

  const weekMinutes = useMemo(() => {
    const cutoff = Date.now() - 7 * 86_400_000;
    return sessions
      .filter((s) => s.completedAt && +new Date(s.completedAt) >= cutoff)
      .reduce((sum, s) => sum + s.durationMinutes, 0);
  }, [sessions]);

  const todayMinutes = useMemo(() => {
    const key = toDateKey(new Date());
    return sessions
      .filter((s) => s.completedAt && toDateKey(s.completedAt) === key)
      .reduce((sum, s) => sum + s.durationMinutes, 0);
  }, [sessions]);

  // Pet reacts to context: worried when something is due within a day.
  useEffect(() => {
    const urgent = tasks.some((t) => t.status !== 'Submitted' && hoursUntil(t.deadline) < 24 && hoursUntil(t.deadline) > 0);
    if (urgent) setPetMood('worried');
    else if (todayMinutes === 0) setPetMood('sleeping');
  }, [tasks, todayMinutes, setPetMood]);

  const moduleCode = (id: string | null) => modules.find((m) => m.moduleId === id)?.moduleCode ?? 'GEN';

  return (
    <div className="space-y-6">
      <header>
        <h1 className="pixel-heading text-base text-neon-green sm:text-lg">Welcome back, {user.name}</h1>
        <p className="mt-2 text-sm text-slate-400">
          {upcoming.length} open quests · {clashes.length > 0 ? `${clashes.length} clash ahead` : 'no clashes ahead'}
        </p>
      </header>

      {/* Clash warning sits above everything — it's the thing that ruins weeks. */}
      {clashes.map((clash) => (
        <div key={clash.date} className="pixel-border border-neon-red bg-neon-red/10 p-4">
          <div className="flex items-start gap-3">
            <AlertTriangle className="mt-0.5 h-5 w-5 shrink-0 text-neon-red" aria-hidden />
            <div>
              <p className="pixel-heading text-[10px] text-neon-red">Deadline clash</p>
              <p className="mt-2 text-sm text-slate-300">
                {clash.titles.join(' and ')} land within 36 hours of each other, and still need about{' '}
                {clash.totalHours} hours between them.
              </p>
              <Link href="/planner" className="focus-ring mt-3 inline-block font-pixel text-[9px] text-neon-cyan underline underline-offset-4">
                Open the planner to spread them out
              </Link>
            </div>
          </div>
        </div>
      ))}

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatTile icon={Flame} label="Streak" value={`${user.currentStreak}d`} sub={`${todayMinutes} min today`} tone="text-neon-yellow" />
        <StatTile icon={Snowflake} label="Freeze tokens" value={user.freezeTokens} sub="Max 2 · auto-used" tone="text-neon-cyan" />
        <StatTile icon={Zap} label="Total XP" value={user.totalXp.toLocaleString()} sub={user.currentRank} tone="text-neon-green" />
        <StatTile icon={Timer} label="This week" value={`${Math.round(weekMinutes / 60 * 10) / 10}h`} sub={`${sessions.filter((s) => s.completedAt).length} sessions logged`} tone="text-neon-pink" />
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="space-y-6 lg:col-span-2">
          <PixelPanel
            title="Study calendar"
            accent="green"
            action={
              <PixelButton tone="green" onClick={() => logStudyBlock(30)}>
                Log 30 min study
              </PixelButton>
            }
          >
            <StudyCalendar />
          </PixelPanel>

          <PixelPanel title="Level progress" accent="cyan">
            <div className="mb-3 flex items-baseline justify-between">
              <p className="pixel-heading text-sm text-neon-cyan">Level {user.currentLevel}</p>
              <p className="font-pixel text-[9px] text-neon-yellow">{user.currentRank}</p>
            </div>
            <ProgressBar value={progress.percent} tone="cyan" label={`${progress.xpIntoLevel} / ${progress.xpForNext} XP`} showValue={false} />
            <p className="mt-2 text-xs text-slate-500">
              {progress.xpRemaining} XP until level {user.currentLevel + 1}.
            </p>
          </PixelPanel>

          <PixelPanel title="Closest deadlines" accent="pink">
            <ul className="divide-y-2 divide-navy-800">
              {upcoming.map((task) => {
                const style = SOURCE_STYLES[task.source];
                const clashing = clashes.some((c) => c.taskIds.includes(task.taskId));
                return (
                  <li key={task.taskId} className="flex items-start justify-between gap-3 py-3">
                    <div className="min-w-0">
                      <p className="truncate text-sm text-slate-200">{task.title}</p>
                      <div className="mt-1.5 flex flex-wrap items-center gap-2 text-[11px]">
                        <span className={`border px-1.5 py-0.5 font-pixel text-[8px] ${style.className}`}>{style.label}</span>
                        <span className="text-slate-500">{moduleCode(task.moduleId)} · {task.weightage}%</span>
                        {task.isFinal && <span className="font-pixel text-[8px] text-neon-yellow">🚀 FINAL</span>}
                        {clashing && <span className="font-pixel text-[8px] text-neon-red">⚠ CLASH</span>}
                      </div>
                    </div>
                    <span className={`shrink-0 font-pixel text-[9px] ${hoursUntil(task.deadline) < 24 ? 'text-neon-red' : 'text-slate-400'}`}>
                      {formatDeadline(task.deadline)}
                    </span>
                  </li>
                );
              })}
            </ul>
          </PixelPanel>

          <PixelPanel title="Study time · last 14 days" accent="green">
            <StudyTimeChart />
          </PixelPanel>
        </div>

        <div className="space-y-6">
          <PetDisplay size="lg" />

          <PixelPanel title="Daily quests" accent="yellow">
            <ul className="space-y-2">
              {dailyQuests.map((quest) => (
                <li key={quest.questId}>
                  <button
                    onClick={() => completeDailyQuest(quest.questId)}
                    disabled={quest.done}
                    className="focus-ring flex w-full items-center gap-3 border-2 border-navy-700 bg-navy-950 p-3 text-left transition-colors hover:border-neon-yellow/60 disabled:opacity-60 disabled:hover:border-navy-700"
                  >
                    {quest.done
                      ? <CheckCircle2 className="h-4 w-4 shrink-0 text-neon-green" aria-hidden />
                      : <Circle className="h-4 w-4 shrink-0 text-slate-600" aria-hidden />}
                    <span className={`flex-1 text-xs ${quest.done ? 'text-slate-500 line-through' : 'text-slate-200'}`}>
                      {quest.label}
                    </span>
                    <span className="font-pixel text-[8px] text-neon-yellow">+{quest.xpReward}</span>
                  </button>
                </li>
              ))}
            </ul>
            <p className="mt-3 text-[11px] text-slate-500">
              Clear all three for a 25 XP bonus.
            </p>
          </PixelPanel>

          <PixelPanel title="Boss battle" accent="pink">
            <p className="pixel-heading text-[10px] text-neon-red">{boss.bossName}</p>
            <div className="mt-3">
              <ProgressBar value={boss.health} tone="red" label="Boss health" />
            </div>
            <p className="mt-3 text-xs text-slate-400">
              {countdown(finals[0]?.deadline ?? boss.bossId)} remaining · {boss.xpReward} XP on defeat
            </p>
            <Link href="/quests" className="focus-ring mt-3 inline-block font-pixel text-[9px] text-neon-cyan underline underline-offset-4">
              Open preparation checklist
            </Link>
          </PixelPanel>

          <PixelPanel title="Final assessments" accent="yellow">
            <ul className="space-y-3">
              {finals.map((task) => (
                <li key={task.taskId} className="flex items-baseline justify-between gap-2">
                  <span className="truncate text-xs text-slate-300">{moduleCode(task.moduleId)} {task.taskType}</span>
                  <span className="shrink-0 font-pixel text-[10px] text-neon-yellow">{countdown(task.deadline)}</span>
                </li>
              ))}
            </ul>
          </PixelPanel>

          <PixelPanel title="Weekly summary" accent="cyan">
            <dl className="space-y-2 text-xs">
              <div className="flex justify-between"><dt className="text-slate-500">Studied</dt><dd className="text-slate-200">{Math.round(weekMinutes / 60 * 10) / 10} hours</dd></div>
              <div className="flex justify-between"><dt className="text-slate-500">Tasks submitted</dt><dd className="text-slate-200">{tasks.filter((t) => t.status === 'Submitted').length}</dd></div>
              <div className="flex justify-between"><dt className="text-slate-500">In progress</dt><dd className="text-slate-200">{tasks.filter((t) => t.status === 'In Progress').length}</dd></div>
              <div className="flex justify-between"><dt className="text-slate-500">Longest session</dt><dd className="text-slate-200">{Math.max(0, ...sessions.filter((s) => s.completedAt).map((s) => s.durationMinutes))} min</dd></div>
            </dl>
          </PixelPanel>
        </div>
      </div>

      <PixelPanel accent="plain">
        <div className="flex items-center gap-3 text-slate-400">
          <Trophy className="h-4 w-4 text-neon-yellow" aria-hidden />
          <p className="text-xs">
            XP is only ever added — nothing you have earned can be taken away, and Byte never gets sick or disappears.
          </p>
        </div>
      </PixelPanel>
    </div>
  );
}
