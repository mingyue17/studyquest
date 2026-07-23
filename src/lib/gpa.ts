import type { Grade, Module } from '@/types';

/** RP / NTU-style 5.00 scale. */
export const GRADE_POINTS: Record<string, number> = {
  'A+': 5.0, A: 5.0, 'A-': 4.5,
  'B+': 4.0, B: 3.5, 'B-': 3.0,
  'C+': 2.5, C: 2.0,
  'D+': 1.5, D: 1.0,
  F: 0,
};

export const GRADE_OPTIONS = Object.keys(GRADE_POINTS);

export interface GradedUnit { grade: string; academicUnits: number }

/** Weighted GPA: sum(gradePoint * AU) / sum(AU). */
export function calculateCgpa(entries: GradedUnit[]): number {
  const scored = entries.filter((e) => e.grade in GRADE_POINTS);
  const units = scored.reduce((s, e) => s + e.academicUnits, 0);
  if (units === 0) return 0;
  const points = scored.reduce((s, e) => s + GRADE_POINTS[e.grade] * e.academicUnits, 0);
  return Math.round((points / units) * 100) / 100;
}

/**
 * What GPA does this semester need to hit the target CGPA overall?
 * Returns null when the target is already locked in or mathematically out of reach.
 */
export function requiredSemesterGpa(params: {
  pastGrades: Grade[];
  currentModules: Module[];
  targetCgpa: number;
}): { required: number; achievable: boolean; alreadyThere: boolean } {
  const pastUnits = params.pastGrades.reduce((s, g) => s + g.academicUnits, 0);
  const pastPoints = params.pastGrades.reduce(
    (s, g) => s + (GRADE_POINTS[g.grade] ?? 0) * g.academicUnits, 0);
  const semUnits = params.currentModules.reduce((s, m) => s + m.academicUnits, 0);

  if (semUnits === 0) return { required: 0, achievable: true, alreadyThere: true };

  const neededTotal = params.targetCgpa * (pastUnits + semUnits);
  const required = Math.round(((neededTotal - pastPoints) / semUnits) * 100) / 100;

  return {
    required: Math.max(0, required),
    achievable: required <= 5.0,
    alreadyThere: required <= 0,
  };
}

/** Best case = every remaining module is an A. Worst case = every remaining module is a D. */
export function projectCgpa(params: {
  pastGrades: Grade[];
  currentModules: Module[];
  assumeGrade: string;
}): number {
  const entries: GradedUnit[] = [
    ...params.pastGrades.map((g) => ({ grade: g.grade, academicUnits: g.academicUnits })),
    ...params.currentModules.map((m) => ({
      grade: m.currentGrade ?? params.assumeGrade,
      academicUnits: m.academicUnits,
    })),
  ];
  return calculateCgpa(entries);
}

/** Plain-English answer for the GPA page. */
export function explainRequirement(required: number, achievable: boolean, alreadyThere: boolean): string {
  if (alreadyThere) return 'Your past results already carry you past the target. Keep any passing grade and you are there.';
  if (!achievable) return 'Even straight A grades this semester will not reach that target. Lower the target or plan for next semester.';
  if (required >= 4.75) return 'You need almost every module at A. Tight, but not impossible — protect your weak module first.';
  if (required >= 4.0) return `You need roughly a ${required.toFixed(2)} GPA — that is mostly A- and B+ grades.`;
  if (required >= 3.0) return `A ${required.toFixed(2)} GPA does it — steady B grades are enough.`;
  return `Only a ${required.toFixed(2)} GPA is needed. Comfortable, so aim higher for buffer.`;
}
