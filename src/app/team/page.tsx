'use client';

import { useMemo, useState } from 'react';
import { Flame, AlertTriangle, UserPlus, Plus, MessageCircleWarning, Sparkles } from 'lucide-react';
import { PixelPanel } from '@/components/ui/PixelPanel';
import { PixelButton } from '@/components/ui/PixelButton';
import { useStore } from '@/store/useStore';
import { formatDeadline } from '@/lib/formatters';
import { initialsForName } from '@/lib/team';
import type { TeamTaskStatus } from '@/types';

const COLUMNS: TeamTaskStatus[] = ['Backlog', 'In Progress', 'Review', 'Merged'];

const COLUMN_TONE: Record<TeamTaskStatus, string> = {
  Backlog: 'border-slate-600',
  'In Progress': 'border-neon-cyan',
  Review: 'border-neon-yellow',
  Merged: 'border-neon-green',
};

/** Small AI-style initials avatar — deterministic colour per teammate, no image asset. */
function Avatar({ name, color, size = 8 }: { name: string; color: string; size?: number }) {
  return (
    <span
      className="flex shrink-0 items-center justify-center border-2 font-pixel"
      style={{
        width: size * 4, height: size * 4, borderColor: color, color,
        backgroundColor: `${color}22`, fontSize: size,
      }}
      aria-hidden
    >
      {initialsForName(name)}
    </span>
  );
}

export default function TeamPage() {
  const { team, teamMembers, teamTasks, teammateAdvice } = useStore();
  const moveTeamTask = useStore((s) => s.moveTeamTask);
  const addTeamMember = useStore((s) => s.addTeamMember);
  const addChecklistItem = useStore((s) => s.addChecklistItem);
  const toggleChecklistItem = useStore((s) => s.toggleChecklistItem);
  const askTeammateAdvice = useStore((s) => s.askTeammateAdvice);

  const [draggingId, setDraggingId] = useState<string | null>(null);
  const [showAddMember, setShowAddMember] = useState(false);
  const [newName, setNewName] = useState('');
  const [newRole, setNewRole] = useState('');
  const [checklistDrafts, setChecklistDrafts] = useState<Record<string, string>>({});
  const [complaint, setComplaint] = useState('');

  const memberById = (id: string | null) => teamMembers.find((m) => m.teamMemberId === id);

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

  const handleAddMember = () => {
    if (!newName.trim()) return;
    addTeamMember(newName, newRole);
    setNewName('');
    setNewRole('');
    setShowAddMember(false);
  };

  return (
    <div className="space-y-6">
      <header>
        <h1 className="pixel-heading text-base text-neon-green sm:text-lg">{team.teamName}</h1>
        <p className="mt-2 text-sm text-slate-400">C240 AI Essentials and Innovations · Project: StudyQuest</p>
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

      <PixelPanel
        title="Members"
        accent="plain"
        action={
          <PixelButton tone="cyan" onClick={() => setShowAddMember((v) => !v)}>
            <UserPlus className="mr-1.5 inline h-3 w-3" aria-hidden />Add teammate
          </PixelButton>
        }
      >
        {showAddMember && (
          <div className="mb-4 grid gap-2 border-2 border-navy-700 bg-navy-950 p-3 sm:grid-cols-[1fr_1fr_auto]">
            <input
              value={newName}
              onChange={(e) => setNewName(e.target.value)}
              placeholder="Name"
              className="focus-ring border-2 border-navy-600 bg-navy-900 px-3 py-2 text-sm text-slate-200 placeholder:text-slate-600"
            />
            <input
              value={newRole}
              onChange={(e) => setNewRole(e.target.value)}
              placeholder="Role (e.g. Media Lead)"
              className="focus-ring border-2 border-navy-600 bg-navy-900 px-3 py-2 text-sm text-slate-200 placeholder:text-slate-600"
            />
            <PixelButton tone="green" onClick={handleAddMember}>Add</PixelButton>
          </div>
        )}

        <ul className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {teamMembers.map((m) => (
            <li key={m.teamMemberId} className="flex items-center gap-3 border-2 border-navy-700 bg-navy-950 p-3">
              <Avatar name={m.displayName} color={m.avatarColor} size={9} />
              <div className="min-w-0 flex-1">
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
                  {items.map((task) => {
                    const assignee = memberById(task.assignedUserId);
                    const doneCount = task.checklist.filter((c) => c.done).length;
                    return (
                      <div
                        key={task.teamTaskId}
                        draggable
                        onDragStart={() => setDraggingId(task.teamTaskId)}
                        className="cursor-grab border-2 border-navy-700 bg-navy-950 p-3 active:cursor-grabbing"
                      >
                        <p className="text-xs text-slate-200">{task.title}</p>
                        {assignee && (
                          <div className="mt-1.5 flex items-center gap-1.5">
                            <Avatar name={assignee.displayName} color={assignee.avatarColor} size={6} />
                            <span className="text-[11px] text-slate-500">{assignee.displayName}</span>
                          </div>
                        )}
                        {task.deadline && <p className="mt-1 text-[11px] text-slate-500">{formatDeadline(task.deadline)}</p>}
                        {task.blocker && (
                          <p className="mt-2 border-2 border-neon-red/50 bg-neon-red/10 p-1.5 text-[10px] text-neon-red">
                            ⚠ {task.blocker}
                          </p>
                        )}

                        {task.checklist.length > 0 && (
                          <ul className="mt-2 space-y-1 border-t border-navy-800 pt-2">
                            {task.checklist.map((item) => (
                              <li key={item.itemId}>
                                <button
                                  onClick={() => toggleChecklistItem(task.teamTaskId, item.itemId)}
                                  className="focus-ring flex w-full items-center gap-1.5 text-left text-[10px] text-slate-400 hover:text-neon-cyan"
                                >
                                  <span className={`h-3 w-3 shrink-0 border ${item.done ? 'border-neon-green bg-neon-green/40' : 'border-navy-600'}`} />
                                  <span className={item.done ? 'text-slate-500 line-through' : ''}>{item.label}</span>
                                </button>
                              </li>
                            ))}
                          </ul>
                        )}
                        <p className="mt-1.5 text-[10px] text-slate-600">{doneCount}/{task.checklist.length} checklist items</p>

                        <div className="mt-2 flex gap-1">
                          <input
                            value={checklistDrafts[task.teamTaskId] ?? ''}
                            onChange={(e) => setChecklistDrafts((d) => ({ ...d, [task.teamTaskId]: e.target.value }))}
                            onKeyDown={(e) => {
                              if (e.key === 'Enter') {
                                addChecklistItem(task.teamTaskId, checklistDrafts[task.teamTaskId] ?? '');
                                setChecklistDrafts((d) => ({ ...d, [task.teamTaskId]: '' }));
                              }
                            }}
                            placeholder="Add checklist item"
                            className="focus-ring w-full border border-navy-700 bg-navy-900 px-2 py-1 text-[10px] text-slate-200 placeholder:text-slate-700"
                          />
                          <button
                            onClick={() => {
                              addChecklistItem(task.teamTaskId, checklistDrafts[task.teamTaskId] ?? '');
                              setChecklistDrafts((d) => ({ ...d, [task.teamTaskId]: '' }));
                            }}
                            className="focus-ring shrink-0 border border-navy-700 px-1.5 text-slate-400 hover:border-neon-cyan/60 hover:text-neon-cyan"
                            aria-label="Add checklist item"
                          >
                            <Plus className="h-3 w-3" aria-hidden />
                          </button>
                        </div>

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
                    );
                  })}
                  {items.length === 0 && <p className="text-[11px] text-slate-600">No tasks here.</p>}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      <PixelPanel title="Something bugging you about the team?" accent="pink">
        <div className="flex items-start gap-3">
          <MessageCircleWarning className="mt-2.5 h-4 w-4 shrink-0 text-neon-pink" aria-hidden />
          <div className="flex-1 space-y-3">
            <textarea
              value={complaint}
              onChange={(e) => setComplaint(e.target.value)}
              rows={2}
              placeholder="e.g. Firdaus hasn't replied about the sprint task in 3 days..."
              className="focus-ring w-full resize-y border-2 border-navy-600 bg-navy-950 px-3 py-2 text-sm text-slate-200 placeholder:text-slate-600"
            />
            <PixelButton tone="pink" onClick={() => { askTeammateAdvice(complaint); }} disabled={!complaint.trim()}>
              Get advice
            </PixelButton>
          </div>
        </div>

        {teammateAdvice && (
          <div className="mt-4 border-2 border-neon-pink/50 bg-neon-pink/10 p-4">
            <div className="mb-2 flex items-center gap-2 text-neon-pink">
              <Sparkles className="h-3.5 w-3.5" aria-hidden />
              <p className="font-pixel text-[8px]">Suggestion</p>
            </div>
            <p className="text-sm text-slate-200">{teammateAdvice.text}</p>
          </div>
        )}
      </PixelPanel>
    </div>
  );
}
