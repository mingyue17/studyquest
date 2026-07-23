import type { Grade, Module } from '@/types';

/**
 * Republic Polytechnic grading scale — 8 letter grades on a 0.00–4.00 scale.
 * Source: RP Academic Matters (Module Grade = CA + FA + SDCL components).
 */
export const GRADE_POINTS: Record<string, number> = {
  A: 4.0,
  'B+': 3.5, B: 3.0,
  'C+': 2.5, C: 2.0,
  'D+': 1.5, D: 1.0,
  F: 0,
};

export const GRADE_OPTIONS = Object.keys(GRADE_POINTS);

export interface GradedUnit { grade: string; moduleCredits: number }

/** Weighted GPA: sum(gradePoint * MC) / sum(MC). */
export function calculateGpa(entries: GradedUnit[]): number {
  const scored = entries.filter((e) => e.grade in GRADE_POINTS);
  const credits = scored.reduce((s, e) => s + e.moduleCredits, 0);
  if (credits === 0) return 0;
  const points = scored.reduce((s, e) => s + GRADE_POINTS[e.grade] * e.moduleCredits, 0);
  return Math.round((points / credits) * 100) / 100;
}

/**
 * What GPA does this semester need to hit the target cumulative GPA overall?
 * Returns null-equivalent flags when the target is already locked in or out of reach.
 */
export function requiredSemesterGpa(params: {
  pastGrades: Grade[];
  currentModules: Module[];
  targetGpa: number;
}): { required: number; achievable: boolean; alreadyThere: boolean } {
  const pastCredits = params.pastGrades.reduce((s, g) => s + g.moduleCredits, 0);
  const pastPoints = params.pastGrades.reduce(
    (s, g) => s + (GRADE_POINTS[g.grade] ?? 0) * g.moduleCredits, 0);
  const semCredits = params.currentModules.reduce((s, m) => s + m.moduleCredits, 0);

  if (semCredits === 0) return { required: 0, achievable: true, alreadyThere: true };

  const neededTotal = params.targetGpa * (pastCredits + semCredits);
  const required = Math.round(((neededTotal - pastPoints) / semCredits) * 100) / 100;

  return {
    required: Math.max(0, required),
    achievable: required <= 4.0,
    alreadyThere: required <= 0,
  };
}

/** Best case = every remaining module is an A. Worst case = every remaining module is a D. */
export function projectGpa(params: {
  pastGrades: Grade[];
  currentModules: Module[];
  assumeGrade: string;
}): number {
  const entries: GradedUnit[] = [
    ...params.pastGrades.map((g) => ({ grade: g.grade, moduleCredits: g.moduleCredits })),
    ...params.currentModules.map((m) => ({
      grade: m.currentGrade ?? params.assumeGrade,
      moduleCredits: m.moduleCredits,
    })),
  ];
  return calculateGpa(entries);
}

/** Plain-English answer for the GPA page. */
export function explainRequirement(required: number, achievable: boolean, alreadyThere: boolean): string {
  if (alreadyThere) return 'Your past results already carry you past the target. Keep any passing grade and you are there.';
  if (!achievable) return 'Even straight A grades this semester will not reach that target. Lower the target or plan for next semester.';
  if (required >= 3.75) return 'You need almost every module at A. Tight, but not impossible — protect your weak module first.';
  if (required >= 3.0) return `You need roughly a ${required.toFixed(2)} GPA — that is mostly B+ and A grades.`;
  if (required >= 2.0) return `A ${required.toFixed(2)} GPA does it — steady B and C+ grades are enough.`;
  return `Only a ${required.toFixed(2)} GPA is needed. Comfortable, so aim higher for buffer.`;
}
