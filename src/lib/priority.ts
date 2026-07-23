import type { DeadlineClash, Task } from '@/types';

export const hoursUntil = (deadline: string, now = new Date()): number =>
  (new Date(deadline).getTime() - now.getTime()) / 3_600_000;

/**
 * priorityScore = urgencyScore + weightageScore + workloadScore + progressRiskScore
 * Each component is normalised to 0–25 so a task tops out around 100.
 */
export function calculatePriorityScore(task: Task, now = new Date()): number {
  const hours = hoursUntil(task.deadline, now);

  // Urgency: overdue and same-day work pins to the top, then decays over 14 days.
  const urgencyScore =
    hours <= 0 ? 25 : hours <= 24 ? 24 : Math.max(0, 25 * (1 - hours / (14 * 24)));

  // Weightage: a 40% project outranks a 5% quiz.
  const weightageScore = Math.min(25, (task.weightage / 40) * 25);

  // Workload: how much sitting-down time is still ahead of the student.
  const remainingHours = task.estimatedHours * (1 - task.progress / 100);
  const workloadScore = Math.min(25, (remainingHours / 12) * 25);

  // Progress risk: barely-started work with little runway is the real danger.
  const runwayDays = Math.max(0.25, hours / 24);
  const hoursPerDayNeeded = remainingHours / runwayDays;
  const progressRiskScore = Math.min(25, (hoursPerDayNeeded / 4) * 25);

  const total = urgencyScore + weightageScore + workloadScore + progressRiskScore;
  // Finals carry a flat multiplier — they're the boss fight.
  return Math.round((task.isFinal ? total * 1.15 : total) * 100) / 100;
}

export function priorityLabel(score: number): { label: string; tone: 'critical' | 'high' | 'medium' | 'low' } {
  if (score >= 70) return { label: 'CRITICAL', tone: 'critical' };
  if (score >= 50) return { label: 'HIGH', tone: 'high' };
  if (score >= 30) return { label: 'MEDIUM', tone: 'medium' };
  return { label: 'LOW', tone: 'low' };
}

/**
 * A clash is two or more unfinished tasks landing within `windowHours`
 * of each other that together need more hours than the student has runway for.
 */
export function detectDeadlineClashes(tasks: Task[], windowHours = 36): DeadlineClash[] {
  const open = tasks
    .filter((t) => t.status !== 'Submitted' && !t.parentTaskId)
    .sort((a, b) => +new Date(a.deadline) - +new Date(b.deadline));

  const clashes: DeadlineClash[] = [];
  const claimed = new Set<string>();

  for (let i = 0; i < open.length; i += 1) {
    if (claimed.has(open[i].taskId)) continue;
    const group = [open[i]];
    for (let j = i + 1; j < open.length; j += 1) {
      const gap =
        (+new Date(open[j].deadline) - +new Date(open[i].deadline)) / 3_600_000;
      if (gap <= windowHours) group.push(open[j]);
      else break;
    }
    if (group.length < 2) continue;

    const totalHours = group.reduce(
      (sum, t) => sum + t.estimatedHours * (1 - t.progress / 100),
      0,
    );
    // Only flag when the combined work realistically can't fit (>4h/day of runway).
    const runwayDays = Math.max(0.5, hoursUntil(group[0].deadline) / 24);
    if (totalHours / runwayDays < 4) continue;

    group.forEach((t) => claimed.add(t.taskId));
    clashes.push({
      date: group[0].deadline,
      taskIds: group.map((t) => t.taskId),
      titles: group.map((t) => t.title),
      totalHours: Math.round(totalHours * 10) / 10,
    });
  }
  return clashes;
}

export const isClashing = (taskId: string, clashes: DeadlineClash[]): boolean =>
  clashes.some((c) => c.taskIds.includes(taskId));

/**
 * Splits a heavy task into subquests. Anything over 3 estimated hours gets
 * broken into ~2 hour chunks with a type-aware naming scheme.
 */
export function generateSubquests(task: Task): Task[] {
  if (task.estimatedHours <= 3) return [];

  const templates: Record<string, string[]> = {
    Assignment: ['Read brief & plan', 'Draft main section', 'Build examples', 'Review & submit'],
    Project: ['Scope & split work', 'Build core feature', 'Integrate parts', 'Test', 'Write report'],
    Exam: ['Review lecture notes', 'Tutorial practice', 'Past-year paper', 'Mock test'],
    Lab: ['Read lab sheet', 'Run experiments', 'Analyse results', 'Write up'],
  };
  const steps = templates[task.taskType] ?? ['Plan', 'Do the work', 'Review & submit'];
  const chunkHours = Math.round((task.estimatedHours / steps.length) * 10) / 10;
  const deadlineMs = +new Date(task.deadline);
  const startMs = Date.now();
  const span = Math.max(deadlineMs - startMs, 86_400_000);

  return steps.map((step, i) => ({
    ...task,
    taskId: crypto.randomUUID(),
    parentTaskId: task.taskId,
    title: `${step}`,
    estimatedHours: chunkHours,
    weightage: 0,
    progress: 0,
    status: 'To Do' as const,
    isFinal: false,
    xpReward: 30,
    // Stagger subquest deadlines evenly before the parent deadline.
    deadline: new Date(startMs + (span * (i + 1)) / (steps.length + 1)).toISOString(),
  }));
}
