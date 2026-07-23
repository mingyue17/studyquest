import type { Badge, DailyQuest, StudySession, Task, WeeklyQuest } from '@/types';
import { XP_REWARDS } from './gamification';
import { calculatePriorityScore } from './priority';
import { toDateKey } from './streaks';

export const BADGES: Badge[] = [
  { badgeId: 'b1', badgeName: 'First Step', description: 'Log your very first study session.', conditionType: 'sessionsCompleted', conditionValue: 1, icon: '👣' },
  { badgeId: 'b2', badgeName: 'Deep Focus', description: 'Study 120 minutes in a single day.', conditionType: 'minutesInADay', conditionValue: 120, icon: '🎯' },
  { badgeId: 'b3', badgeName: 'Consistency King', description: 'Hold a 14-day streak.', conditionType: 'streakDays', conditionValue: 14, icon: '👑' },
  { badgeId: 'b4', badgeName: 'Early Bird', description: 'Submit 3 tasks before the deadline day.', conditionType: 'earlySubmissions', conditionValue: 3, icon: '🌅' },
  { badgeId: 'b5', badgeName: 'Clash Survivor', description: 'Clear every task in a deadline clash on time.', conditionType: 'clashesSurvived', conditionValue: 1, icon: '⚔️' },
  { badgeId: 'b6', badgeName: 'Grade Climber', description: 'Raise your projected CGPA by 0.3.', conditionType: 'cgpaGain', conditionValue: 0.3, icon: '📈' },
  { badgeId: 'b7', badgeName: 'Perfect Week', description: 'Finish every planned session in a week.', conditionType: 'perfectWeeks', conditionValue: 1, icon: '💎' },
  { badgeId: 'b8', badgeName: 'Final Boss Defeated', description: 'Bring a boss battle to 0% health.', conditionType: 'bossesDefeated', conditionValue: 1, icon: '🐉' },
  { badgeId: 'b9', badgeName: 'Comeback Student', description: 'Rebuild a 7-day streak after breaking one.', conditionType: 'comebackStreak', conditionValue: 7, icon: '🔁' },
  { badgeId: 'b10', badgeName: 'Team Player', description: 'Finish 5 team tasks.', conditionType: 'teamTasksCompleted', conditionValue: 5, icon: '🤝' },
];

export interface BadgeStats {
  sessionsCompleted: number;
  minutesInADay: number;
  streakDays: number;
  earlySubmissions: number;
  clashesSurvived: number;
  cgpaGain: number;
  perfectWeeks: number;
  bossesDefeated: number;
  comebackStreak: number;
  teamTasksCompleted: number;
}

/** Returns badges that have just been earned but are not yet unlocked. */
export function checkBadgeUnlocks(stats: BadgeStats, unlockedIds: string[]): Badge[] {
  return BADGES.filter((b) => {
    if (unlockedIds.includes(b.badgeId)) return false;
    const value = stats[b.conditionType as keyof BadgeStats] ?? 0;
    return value >= b.conditionValue;
  });
}

/**
 * Three quests a day, seeded off the date so they stay stable until midnight
 * but rotate without a cron job.
 */
export function generateDailyQuests(tasks: Task[], sessions: StudySession[], today = new Date()): DailyQuest[] {
  const key = toDateKey(today);
  const todayMinutes = sessions
    .filter((s) => s.completedAt && toDateKey(s.completedAt) === key)
    .reduce((sum, s) => sum + s.durationMinutes, 0);

  const urgent = [...tasks]
    .filter((t) => t.status !== 'Submitted')
    .sort((a, b) => calculatePriorityScore(b) - calculatePriorityScore(a))[0];

  const completedToday = tasks.filter(
    (t) => t.completedAt && toDateKey(t.completedAt) === key).length;

  return [
    { questId: `${key}-study`, kind: 'study', label: 'Study for 30 minutes', xpReward: XP_REWARDS.logStudyBlock, done: todayMinutes >= 30 },
    { questId: `${key}-urgent`, kind: 'urgentTask', label: urgent ? `Move "${urgent.title}" forward` : 'Complete one urgent task', xpReward: XP_REWARDS.completeSmallQuest, done: completedToday > 0 },
    { questId: `${key}-review`, kind: 'review', label: 'Review one lecture', xpReward: XP_REWARDS.completeSmallQuest, done: todayMinutes >= 60 },
  ];
}

export const DAILY_COMPLETION_BONUS = XP_REWARDS.completeDailyGoal;

export function generateWeeklyQuests(params: {
  plannedSessions: number;
  completedSessions: number;
  urgentTotal: number;
  urgentDone: number;
  reflectionSubmitted: boolean;
}): WeeklyQuest[] {
  const sessionRate = params.plannedSessions
    ? (params.completedSessions / params.plannedSessions) * 100 : 0;
  return [
    { questId: 'w1', label: 'Complete 80% of planned study sessions', xpReward: XP_REWARDS.completeWeeklyGoal, progress: Math.min(100, Math.round((sessionRate / 80) * 100)) },
    { questId: 'w2', label: 'Complete all urgent tasks', xpReward: XP_REWARDS.completeWeeklyGoal, progress: params.urgentTotal ? Math.round((params.urgentDone / params.urgentTotal) * 100) : 100 },
    { questId: 'w3', label: 'Submit one weekly reflection', xpReward: XP_REWARDS.completeReflection, progress: params.reflectionSubmitted ? 100 : 0 },
  ];
}
