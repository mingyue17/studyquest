import type { ReflectionSummary, StudySession, Task } from '@/types';

/**
 * Rule-based reflection summary, generated from the student's own answers plus
 * their actual task/session data — the same "mocked but structured for a real
 * model later" approach as the AI Assistant.
 */
export function generateAiSummary(params: {
  completedTasks: string;
  delays: string;
  focusModule: string;
  stressLevel: number;
  tasks: Task[];
  sessions: StudySession[];
}): ReflectionSummary {
  const submittedCount = params.tasks.filter((t) => t.status === 'Submitted').length;
  const totalMinutes = params.sessions
    .filter((s) => s.completedAt)
    .reduce((sum, s) => sum + s.durationMinutes, 0);
  const eveningSessions = params.sessions.filter((s) => s.completedAt && new Date(s.completedAt).getHours() >= 19).length;
  const totalSessions = params.sessions.filter((s) => s.completedAt).length || 1;

  const mainAchievement = submittedCount > 0
    ? `Cleared ${submittedCount} task${submittedCount === 1 ? '' : 's'} and logged ${Math.round(totalMinutes / 60 * 10) / 10} hours of study.`
    : 'Held the study habit even without a full submission this week.';

  const mainProblem = params.delays.trim()
    ? params.delays.trim()
    : 'No specific blocker named — worth naming one next week to track patterns.';

  const studyPattern = eveningSessions / totalSessions > 0.6
    ? 'Most sessions happen after 7pm — a consistent night-owl rhythm.'
    : 'Study time is spread across the day rather than clustered in one slot.';

  const suggestedImprovement = params.stressLevel >= 4
    ? 'Stress is running high — protect one lighter evening this week before it compounds.'
    : 'Stress is manageable — a good week to get ahead on the next heavy deadline.';

  return {
    mainAchievement,
    mainProblem,
    studyPattern,
    suggestedImprovement,
    recommendedFocusModule: params.focusModule || 'No module flagged',
  };
}

export function currentWeekStart(): string {
  const d = new Date();
  const day = (d.getDay() + 6) % 7;
  d.setDate(d.getDate() - day);
  return d.toISOString().slice(0, 10);
}
