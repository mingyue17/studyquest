'use client';

import { useMemo, useState } from 'react';
import { Flame, Users, AlertTriangle } from 'lucide-react';
import { PixelPanel } from '@/components/ui/PixelPanel';
import { useStore } from '@/store/useStore';
import { formatDeadline } from '@/lib/formatters';
import type { TeamTaskStatus } from '@/types';

const COLUMNS: TeamTaskStatus[] = ['Backlog', 'In Progress', 'Review', 'Merged'];

const COLUMN_TONE: Record<TeamTaskStatus, string> = {
  Backlog: 'border-slate-600',
  'In Progress': 'border-neon-cyan',
  Review: 'border-neon-yellow',
  Merged: 'border-neon-green',
};

export default function TeamPage() {
  const { team, teamMembers, teamTasks } = useStore();
  const moveTeamTask = useStore((s) => s.moveTeamTask);
  const [draggingId, setDraggingId] = useState<string | null>(null);

  const memberName = (id: string | null) => teamMembers.find((m) => m.teamMemberId === id)?.displayName ?? 'Unassigned';

  // Workload balance: flag if one member carries notably more open work than the team average.
  const workload = useMemo(() => {
    const counts: Record<string, number> = {};
    teamMembers.forEach((m) => { counts[m.teamMemberId] = 0; });
    teamTasks.filter((t) => t.status !== 'Merged').forEach((t) => {
      if (t.assignedUserId) counts[t.assignedUserId] = (counts[t.assignedUserId] ?? 0) + 1;
    });
    const values = Object.values(counts);
    const avg = values.reduce((s, v) => s + v, 0) / (values.length || 1);
    const overloaded = teamMembers.filter((m) => counts[m.teamMemberId] > avg + 1.5);
    return { counts, avg, overloaded };
  }, [teamMembers, teamTasks]);

  return (
    <div className="space-y-6">
      <header>
        <h1 className="pixel-heading text-base text-neon-green sm:text-lg">{team.teamName}</h1>
        <p className="mt-2 text-sm text-slate-400">Click or drag a card between columns to update its status.</p>
      </header>

      <div className="grid gap-4 sm:grid-cols-3">
        <PixelPanel accent="green">
          <p className="font-pixel text-[8px] uppercase text-slate-500">Team XP</p>
          <p className="mt-2 font-pixel text-lg text-neon-green">{team.totalXp.toLocaleString()}</p>
        </PixelPanel>
        <PixelPanel accent="cyan">
          <p className="font-pixel text-[8px] uppercase text-slate-500">Team level</p>
          <p className="mt-2 font-pixel text-lg text-neon-cyan">{team.currentLevel}</p>
        </PixelPanel>
        <PixelPanel accent="yellow">
          <div className="flex items-center gap-2 text-slate-500">
            <Flame className="h-3.5 w-3.5" aria-hidden />
            <p className="font-pixel text-[8px] uppercase">Team streak</p>
          </div>
          <p className="mt-2 font-pixel text-lg text-neon-yellow">{team.currentStreak}d</p>
        </PixelPanel>
      </div>

      {workload.overloaded.length > 0 && (
        <div className="pixel-border border-neon-red bg-neon-red/10 p-4">
          <div className="flex items-start gap-3">
            <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-neon-red" aria-hidden />
            <p className="text-xs text-slate-300">
              <span className="font-pixel text-[9px] text-neon-red">WORKLOAD: </span>
              {workload.overloaded.map((m) => m.displayName).join(', ')} carrying noticeably more open work than the rest of the team.
              Worth rebalancing before the next sprint.
            </p>
          </div>
        </div>
      )}

      <PixelPanel title="Members" accent="plain">
        <ul className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {teamMembers.map((m) => (
            <li key={m.teamMemberId} className="flex items-center justify-between gap-3 border-2 border-navy-700 bg-navy-950 p-3">
              <div className="min-w-0">
                <p className="truncate text-sm text-slate-200">{m.displayName}</p>
                <p className="text-[11px] text-slate-500">{m.role}</p>
              </div>
              <span className="shrink-0 font-pixel text-[9px] text-slate-400">
                {workload.counts[m.teamMemberId] ?? 0} open
              </span>
            </li>
          ))}
        </ul>
      </PixelPanel>

      <div className="overflow-x-auto">
        <div className="grid min-w-[900px] grid-cols-4 gap-3">
          {COLUMNS.map((status) => {
            const items = teamTasks.filter((t) => t.status === status);
            return (
              <div
                key={status}
                onDragOver={(e) => e.preventDefault()}
                onDrop={() => { if (draggingId) { moveTeamTask(draggingId, status); setDraggingId(null); } }}
                className={`min-h-[420px] border-2 bg-navy-900/60 p-3 ${COLUMN_TONE[status]}`}
              >
                <p className="mb-3 font-pixel text-[9px] uppercase text-slate-300">{status} · {items.length}</p>
                <div className="space-y-2">
                  {items.map((task) => (
                    <div
                      key={task.teamTaskId}
                      draggable
                      onDragStart={() => setDraggingId(task.teamTaskId)}
                      className="cursor-grab border-2 border-navy-700 bg-navy-950 p-3 active:cursor-grabbing"
                    >
                      <p className="text-xs text-slate-200">{task.title}</p>
                      <p className="mt-1.5 flex items-center gap-1 text-[11px] text-slate-500">
                        <Users className="h-3 w-3" aria-hidden />{memberName(task.assignedUserId)}
                      </p>
                      {task.deadline && <p className="mt-1 text-[11px] text-slate-500">{formatDeadline(task.deadline)}</p>}
                      {task.blocker && (
                        <p className="mt-2 border-2 border-neon-red/50 bg-neon-red/10 p-1.5 text-[10px] text-neon-red">
                          ⚠ {task.blocker}
                        </p>
                      )}
                      <div className="mt-2 flex flex-wrap gap-1">
                        {COLUMNS.filter((c) => c !== status).map((c) => (
                          <button
                            key={c}
                            onClick={() => moveTeamTask(task.teamTaskId, c)}
                            className="focus-ring border border-navy-600 px-1.5 py-0.5 font-pixel text-[7px] text-slate-400 hover:border-neon-cyan/60 hover:text-neon-cyan"
                          >
                            {c}
                          </button>
                        ))}
                      </div>
                    </div>
                  ))}
                  {items.length === 0 && <p className="text-[11px] text-slate-600">No tasks here.</p>}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
