import type { StreakRecord } from '@/types';

export const toDateKey = (d: Date | string): string =>
  new Date(d).toISOString().slice(0, 10);

export const daysBetween = (a: string, b: string): number =>
  Math.round((new Date(b).getTime() - new Date(a).getTime()) / 86_400_000);

export interface StreakState {
  currentStreak: number;
  freezeTokens: number;
  lastActiveDate: string | null;
}

export interface StreakUpdate extends StreakState {
  freezeUsed: boolean;
  tokenEarned: boolean;
  streakBroken: boolean;
  record: StreakRecord;
}

/**
 * A day counts when the student hits the daily study goal OR finishes one
 * meaningful academic task. Rules:
 *  - exactly one missed day can be covered by a freeze token, automatically
 *  - a freeze cannot cover two missed days in a row (gap > 2 breaks the streak)
 *  - one token is earned every seventh streak day, capped at two stored
 */
export function updateStreak(
  state: StreakState,
  userId: string,
  today: Date = new Date(),
): StreakUpdate {
  const todayKey = toDateKey(today);
  const last = state.lastActiveDate;

  let { currentStreak, freezeTokens } = state;
  let freezeUsed = false;
  let streakBroken = false;

  if (!last) {
    currentStreak = 1;
  } else {
    const gap = daysBetween(last, todayKey);
    if (gap === 0) {
      // Already counted today — nothing changes.
      return {
        currentStreak,
        freezeTokens,
        lastActiveDate: todayKey,
        freezeUsed: false,
        tokenEarned: false,
        streakBroken: false,
        record: buildRecord(userId, todayKey, false),
      };
    }
    if (gap === 1) {
      currentStreak += 1;
    } else if (gap === 2 && freezeTokens > 0) {
      // One missed day, covered automatically.
      freezeTokens -= 1;
      freezeUsed = true;
      currentStreak += 1;
    } else {
      streakBroken = true;
      currentStreak = 1;
    }
  }

  // Earn a token every 7 streak days, max 2 stored.
  let tokenEarned = false;
  if (currentStreak > 0 && currentStreak % 7 === 0 && freezeTokens < 2) {
    freezeTokens += 1;
    tokenEarned = true;
  }

  return {
    currentStreak,
    freezeTokens,
    lastActiveDate: todayKey,
    freezeUsed,
    tokenEarned,
    streakBroken,
    record: buildRecord(userId, todayKey, freezeUsed),
  };
}

/** Explicit token spend, exposed for the "protect my streak" affordance. */
export function useFreezeToken(state: StreakState, userId: string, missedDate: string): StreakUpdate | null {
  if (state.freezeTokens <= 0) return null;
  return {
    currentStreak: state.currentStreak,
    freezeTokens: state.freezeTokens - 1,
    lastActiveDate: state.lastActiveDate,
    freezeUsed: true,
    tokenEarned: false,
    streakBroken: false,
    record: buildRecord(userId, missedDate, true),
  };
}

function buildRecord(userId: string, streakDate: string, freezeUsed: boolean): StreakRecord {
  return {
    streakRecordId: crypto.randomUUID(),
    userId,
    streakDate,
    completed: !freezeUsed,
    freezeUsed,
  };
}

/** Builds the GitHub-style contribution grid for the last `weeks` weeks. */
export function buildStudyCalendar(
  records: StreakRecord[],
  minutesByDate: Record<string, number>,
  weeks = 20,
) {
  const cells: { date: string; minutes: number; freezeUsed: boolean; intensity: 0 | 1 | 2 | 3 | 4 }[] = [];
  const today = new Date();
  const start = new Date(today);
  start.setDate(start.getDate() - weeks * 7 + 1);

  const freezeDates = new Set(records.filter((r) => r.freezeUsed).map((r) => r.streakDate));

  for (let d = new Date(start); d <= today; d.setDate(d.getDate() + 1)) {
    const key = toDateKey(d);
    const minutes = minutesByDate[key] ?? 0;
    cells.push({
      date: key,
      minutes,
      freezeUsed: freezeDates.has(key),
      intensity: minutes === 0 ? 0 : minutes < 30 ? 1 : minutes < 60 ? 2 : minutes < 120 ? 3 : 4,
    });
  }
  return cells;
}
