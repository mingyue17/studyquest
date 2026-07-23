import type { PetStage, Rank, XpTransaction } from '@/types';

/**
 * XP is only ever added — never deducted. Every award writes an
 * xpTransactions row so the ledger explains how a level was reached.
 */
export const XP_REWARDS = {
  logStudyBlock: 20,      // 30 minutes logged
  completeSmallQuest: 30,
  completeAssignment: 80,
  submitEarlyBonus: 30,
  completeDailyGoal: 25,
  completeWeeklyGoal: 100,
  completeReflection: 30,
  completeTeamTask: 40,
} as const;

export type XpActivity = keyof typeof XP_REWARDS;

/**
 * Level curve: cost grows quadratically so early levels come fast and
 * later ones feel earned. Level n needs 60 * n^1.55 XP on its own.
 */
export function xpForLevel(level: number): number {
  if (level <= 1) return 0;
  return Math.round(60 * Math.pow(level - 1, 1.55));
}

/** Total XP needed to *reach* a level (cumulative). */
export function cumulativeXpForLevel(level: number): number {
  let total = 0;
  for (let l = 2; l <= level; l += 1) total += xpForLevel(l);
  return total;
}

export function calculateLevel(totalXp: number): number {
  let level = 1;
  while (totalXp >= cumulativeXpForLevel(level + 1) && level < 99) level += 1;
  return level;
}

/** Progress toward the next level, for the arcade progress bar. */
export function levelProgress(totalXp: number) {
  const currentLevel = calculateLevel(totalXp);
  const floor = cumulativeXpForLevel(currentLevel);
  const ceiling = cumulativeXpForLevel(currentLevel + 1);
  const xpIntoLevel = totalXp - floor;
  const xpForNext = ceiling - floor;
  return {
    currentLevel,
    xpIntoLevel,
    xpForNext,
    xpRemaining: xpForNext - xpIntoLevel,
    percent: Math.min(100, Math.round((xpIntoLevel / xpForNext) * 100)),
  };
}

const RANK_THRESHOLDS: { minLevel: number; rank: Rank }[] = [
  { minLevel: 50, rank: 'Semester Champion' },
  { minLevel: 35, rank: 'Master Planner' },
  { minLevel: 20, rank: 'Academic Knight' },
  { minLevel: 12, rank: 'Strategist' },
  { minLevel: 8, rank: 'Scholar' },
  { minLevel: 4, rank: 'Learner' },
  { minLevel: 1, rank: 'Rookie' },
];

export function calculateRank(level: number): Rank {
  return RANK_THRESHOLDS.find((t) => level >= t.minLevel)?.rank ?? 'Rookie';
}

export interface AwardXpResult {
  totalXp: number;
  previousLevel: number;
  currentLevel: number;
  currentRank: Rank;
  leveledUp: boolean;
  petEvolved: boolean;
  transaction: XpTransaction;
}

/**
 * Central XP entry point. Returns everything the UI needs to fire the
 * level-up and pet-evolution animations in one pass.
 */
export function awardXp(params: {
  userId: string;
  currentTotalXp: number;
  activityType: XpActivity | string;
  amount?: number;
  referenceId?: string | null;
}): AwardXpResult {
  const amount =
    params.amount ?? XP_REWARDS[params.activityType as XpActivity] ?? 0;
  const safeAmount = Math.max(0, Math.round(amount)); // never negative
  const previousLevel = calculateLevel(params.currentTotalXp);
  const totalXp = params.currentTotalXp + safeAmount;
  const currentLevel = calculateLevel(totalXp);

  return {
    totalXp,
    previousLevel,
    currentLevel,
    currentRank: calculateRank(currentLevel),
    leveledUp: currentLevel > previousLevel,
    petEvolved: determinePetStage(currentLevel) !== determinePetStage(previousLevel),
    transaction: {
      transactionId: crypto.randomUUID(),
      userId: params.userId,
      activityType: params.activityType,
      xpAmount: safeAmount,
      referenceId: params.referenceId ?? null,
      createdAt: new Date().toISOString(),
    },
  };
}

export function determinePetStage(level: number): PetStage {
  if (level >= 50) return 'Legendary';
  if (level >= 35) return 'Adult';
  if (level >= 20) return 'Teen';
  if (level >= 10) return 'Young';
  if (level >= 5) return 'Baby';
  return 'Egg';
}

/** Level at which the next evolution happens — used for the "next form" teaser. */
export function nextEvolutionLevel(level: number): number | null {
  const gates = [5, 10, 20, 35, 50];
  return gates.find((g) => g > level) ?? null;
}
