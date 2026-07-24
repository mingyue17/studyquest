import type { Module, PlannedSession, Task } from '@/types';
import { calculatePriorityScore, detectDeadlineClashes, hoursUntil } from './priority';

export interface PlannerPreferences {
  availableHoursPerDay: number[];   // index 0 = Monday
  preferredStartHour: number;       // e.g. 20 for "night owl"
  weakModuleCodes: string[];
  sessionMinutes: number;           // block size, default 60
}

export const DEFAULT_PREFERENCES: PlannerPreferences = {
  availableHoursPerDay: [2, 3, 2, 3, 2, 4, 4],
  preferredStartHour: 20,
  weakModuleCodes: [],
  sessionMinutes: 60,
};

/**
 * Greedy scheduler. Tasks are ranked by priorityScore (with a boost for weak
 * modules), then their remaining hours are poured into the earliest day that
 * still has capacity and lands before the deadline.
 */
export function generateWeeklySchedule(
  tasks: Task[],
  modules: Module[],
  prefs: PlannerPreferences = DEFAULT_PREFERENCES,
  weekStart: Date = startOfWeek(new Date()),
): PlannedSession[] {
  const moduleCode = (id: string | null) =>
    modules.find((m) => m.moduleId === id)?.moduleCode ?? 'GEN';

  const ranked = tasks
    .filter((t) => t.status !== 'Submitted')
    .map((t) => {
      const code = moduleCode(t.moduleId);
      const weakBoost = prefs.weakModuleCodes.includes(code) ? 8 : 0;
      return { task: t, code, score: calculatePriorityScore(t) + weakBoost };
    })
    .sort((a, b) => b.score - a.score);

  const capacity = [...prefs.availableHoursPerDay];
  const sessions: PlannedSession[] = [];
  const blockHours = prefs.sessionMinutes / 60;

  for (const { task, code } of ranked) {
    let remaining = task.estimatedHours * (1 - task.progress / 100);
    const deadlineDay = dayIndexWithinWeek(task.deadline, weekStart);

    for (let day = 0; day < 7 && remaining > 0.01; day += 1) {
      // Never schedule after the deadline; overdue work goes today.
      if (deadlineDay !== null && day > deadlineDay) break;
      while (capacity[day] >= blockHours && remaining > 0.01) {
        const usedBlocks = sessions.filter((s) => s.day === day).length;
        sessions.push({
          sessionId: crypto.randomUUID(),
          taskId: task.taskId,
          title: task.title,
          moduleCode: code,
          day,
          startHour: prefs.preferredStartHour + usedBlocks * blockHours,
          durationMinutes: prefs.sessionMinutes,
          completed: false,
        });
        capacity[day] -= blockHours;
        remaining -= blockHours;
      }
    }
  }
  return sessions;
}

/** Days where planned load exceeds stated availability by more than 25%. */
export function detectOverloadedDays(sessions: PlannedSession[], prefs: PlannerPreferences): number[] {
  const overloaded: number[] = [];
  for (let day = 0; day < 7; day += 1) {
    const planned = sessions.filter((s) => s.day === day)
      .reduce((sum, s) => sum + s.durationMinutes, 0) / 60;
    if (planned > prefs.availableHoursPerDay[day] * 1.25) overloaded.push(day);
  }
  return overloaded;
}

/** "What should I study tonight?" — the single highest-value next block. */
export function recommendTonight(tasks: Task[], modules: Module[], prefs = DEFAULT_PREFERENCES) {
  const open = tasks.filter((t) => t.status !== 'Submitted');
  if (open.length === 0) return null;

  const top = open
    .map((t) => ({ task: t, score: calculatePriorityScore(t) }))
    .sort((a, b) => b.score - a.score)[0];

  const code = modules.find((m) => m.moduleId === top.task.moduleId)?.moduleCode ?? 'GEN';
  const hours = hoursUntil(top.task.deadline);
  const reason =
    hours < 24 ? 'it is due within a day'
    : top.task.weightage >= 25 ? `it is worth ${top.task.weightage}% of ${code}`
    : top.task.progress < 25 ? 'it is barely started and the runway is short'
    : 'it carries the highest combined urgency and weight';

  return {
    task: top.task,
    moduleCode: code,
    minutes: prefs.sessionMinutes,
    reason,
    startHour: prefs.preferredStartHour,
  };
}

/** Tasks that should have been started already, given remaining work vs runway. */
export function suggestEarlierStarts(tasks: Task[]) {
  return tasks
    .filter((t) => t.status === 'To Do')
    .map((t) => {
      const remaining = t.estimatedHours * (1 - t.progress / 100);
      const runwayDays = Math.max(0.5, hoursUntil(t.deadline) / 24);
      return { task: t, hoursPerDay: remaining / runwayDays };
    })
    .filter((r) => r.hoursPerDay > 2.5)
    .sort((a, b) => b.hoursPerDay - a.hoursPerDay);
}

/** Pushes unfinished sessions from past days into the next day with capacity. */
export function rescheduleIncomplete(sessions: PlannedSession[], todayIndex: number, prefs = DEFAULT_PREFERENCES): PlannedSession[] {
  const used = Array(7).fill(0);
  sessions.forEach((s) => { if (s.day >= todayIndex) used[s.day] += s.durationMinutes / 60; });

  return sessions.map((s) => {
    if (s.completed || s.day >= todayIndex) return s;
    for (let day = todayIndex; day < 7; day += 1) {
      if (used[day] + s.durationMinutes / 60 <= prefs.availableHoursPerDay[day]) {
        used[day] += s.durationMinutes / 60;
        return { ...s, day };
      }
    }
    return { ...s, day: todayIndex };
  });
}

export const plannerClashes = detectDeadlineClashes;

export function startOfWeek(d: Date): Date {
  const date = new Date(d);
  const day = (date.getDay() + 6) % 7; // Monday = 0
  date.setDate(date.getDate() - day);
  date.setHours(0, 0, 0, 0);
  return date;
}

function dayIndexWithinWeek(deadline: string, weekStart: Date): number | null {
  const diff = Math.floor((+new Date(deadline) - +weekStart) / 86_400_000);
  if (diff < 0) return 0;      // already overdue — schedule immediately
  if (diff > 6) return null;   // beyond this week — free to place anywhere
  return diff;
}

export const DAY_NAMES = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
