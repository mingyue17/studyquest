import type { Grade, Module, Task, TeamTask } from '@/types';
import { detectDeadlineClashes } from './priority';
import { recommendTonight, generateWeeklySchedule, DAY_NAMES, DEFAULT_PREFERENCES } from './planner';
import { calculateCgpa, requiredSemesterGpa, explainRequirement } from './gpa';

export interface AssistantContext {
  tasks: Task[];
  modules: Module[];
  grades: Grade[];
  teamTasks: TeamTask[];
  targetCgpa: number;
}

export interface AssistantReply { text: string; sources: string[] }

/**
 * Rule-based answers driven entirely by database state. `answerQuestion` is the
 * single seam — swap its body for a fetch to /api/assistant (which can call
 * Claude with this same context object) and every caller keeps working.
 */
export async function answerQuestion(question: string, ctx: AssistantContext): Promise<AssistantReply> {
  const q = question.toLowerCase();

  if (q.includes('tonight') || q.includes('work on now')) return answerTonight(ctx);
  if (q.includes('clash') || q.includes('conflict')) return answerClashes(ctx);
  if (q.includes('gpa') || q.includes('cgpa') || q.includes('grade')) return answerGpa(ctx);
  if (q.includes('plan') || q.includes('schedule') || q.includes('week')) return answerPlan(ctx);
  if (q.includes('team') || q.includes('block')) return answerTeam(ctx);
  return answerFallback(ctx);
}

export const SUGGESTED_PROMPTS = [
  'What should I work on tonight?',
  'Do I have any deadline clashes?',
  'Can I still reach my target GPA?',
  'Create a study plan for this week.',
  'Which team task is blocking progress?',
];

function answerTonight(ctx: AssistantContext): AssistantReply {
  const rec = recommendTonight(ctx.tasks, ctx.modules);
  if (!rec) return { text: 'Nothing open right now. Log a review session to keep the streak alive.', sources: ['tasks'] };
  const days = Math.max(0, Math.ceil((+new Date(rec.task.deadline) - Date.now()) / 86_400_000));
  return {
    text: `Start with **${rec.task.title}** (${rec.moduleCode}). One ${rec.minutes}-minute block at ${rec.startHour}:00 — ${rec.reason}. It is due in ${days} day${days === 1 ? '' : 's'} and sits at ${rec.task.progress}% done. Finishing the block earns ${rec.minutes / 30 * 20} XP.`,
    sources: ['tasks', 'studySessions'],
  };
}

function answerClashes(ctx: AssistantContext): AssistantReply {
  const clashes = detectDeadlineClashes(ctx.tasks);
  if (clashes.length === 0) return { text: 'No clashes in the next two weeks. Your deadlines are spread out enough to handle one at a time.', sources: ['tasks'] };
  const c = clashes[0];
  return {
    text: `Yes — ${c.titles.join(' and ')} land within 36 hours of each other on ${new Date(c.date).toDateString()}. Together they still need about ${c.totalHours} hours. Pull the lighter one forward by two days and the week stops being a wall.`,
    sources: ['tasks'],
  };
}

function answerGpa(ctx: AssistantContext): AssistantReply {
  const current = calculateCgpa(ctx.grades);
  const req = requiredSemesterGpa({ pastGrades: ctx.grades, currentModules: ctx.modules, targetCgpa: ctx.targetCgpa });
  return {
    text: `Your CGPA is ${current.toFixed(2)} and your target is ${ctx.targetCgpa.toFixed(2)}. This semester needs roughly a ${req.required.toFixed(2)} GPA. ${explainRequirement(req.required, req.achievable, req.alreadyThere)}`,
    sources: ['grades', 'modules'],
  };
}

function answerPlan(ctx: AssistantContext): AssistantReply {
  const sessions = generateWeeklySchedule(ctx.tasks, ctx.modules);
  const byDay = DAY_NAMES.map((name, day) => {
    const hours = sessions.filter((s) => s.day === day).reduce((sum, s) => sum + s.durationMinutes, 0) / 60;
    return hours ? `${name} ${hours}h` : null;
  }).filter(Boolean);
  return {
    text: `Here is the week: ${byDay.join(' · ')}. That is ${sessions.length} blocks of ${DEFAULT_PREFERENCES.sessionMinutes} minutes, weighted toward whatever is closest and heaviest. Open the AI Planner to drag any block to a different evening.`,
    sources: ['tasks', 'studySessions'],
  };
}

function answerTeam(ctx: AssistantContext): AssistantReply {
  const blocked = ctx.teamTasks.filter((t) => t.blocker && t.status !== 'Merged');
  if (blocked.length === 0) return { text: 'Nothing is blocked. Review column is where to look next if you want to keep things moving.', sources: ['teamTasks'] };
  const t = blocked[0];
  return {
    text: `**${t.title}** is the blocker — it is sitting in ${t.status} with the note: "${t.blocker}". Everything downstream of it waits, so clear that one before picking up anything new.`,
    sources: ['teamTasks'],
  };
}

function answerFallback(ctx: AssistantContext): AssistantReply {
  const open = ctx.tasks.filter((t) => t.status !== 'Submitted').length;
  return {
    text: `I can only answer from your StudyQuest data for now. You have ${open} open tasks across ${ctx.modules.length} modules — try one of the suggested prompts below.`,
    sources: [],
  };
}
