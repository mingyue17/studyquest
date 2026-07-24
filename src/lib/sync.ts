import { supabase } from './supabaseClient';
import type {
  BossBattle, Grade, LeaderboardEntry, Module, Notification, PetUnlock,
  PlannedSession, Reflection, StreakRecord, StudySession, Task, User,
} from '@/types';
import type { PlannerPreferences } from './planner';
import { DEFAULT_PREFERENCES, generateWeeklySchedule } from './planner';
import {
  demoBoss, demoModules, demoNotifications, demoTasks,
} from '@/data/demoData';

/**
 * What NOT synced yet, and why:
 *  - badges / unlockedBadgeIds — the client-side badge catalog (lib/quests.ts) uses
 *    ids like "b1", the DB `badges` table uses real uuids. No mapping between them
 *    yet, so badge unlocks stay local-only (same as before login existed).
 *  - team / teamMembers / teamTasks — shared across a team; needs a real invite flow
 *    before it's safe to write. Stays local-only for now.
 *  - dailyQuests — regenerates every day from tasks, nothing to persist.
 *  - selectedPetId / petUnlocks.petId — demo data uses friendly ids ("pet-baby") that
 *    aren't real uuids, so these are written as null. Nothing in the app reads them
 *    back, only itemType/itemName/equipped matter for the cosmetics UI.
 */

export interface HydratedData {
  user: User;
  targetGpa: number;
  modules: Module[];
  tasks: Task[];
  sessions: StudySession[];
  grades: Grade[];
  streakRecords: StreakRecord[];
  petUnlocks: PetUnlock[];
  reflections: Reflection[];
  notifications: Notification[];
  boss: BossBattle | null;
  plannerPreferences: PlannerPreferences;
  plannedSessions: PlannedSession[];
}

const newId = () => crypto.randomUUID();

/** Loads everything for an existing account. Returns null if this auth user has no `users` row yet (first login). */
export async function fetchAllForUser(userId: string): Promise<HydratedData | null> {
  if (!supabase) return null;

  const { data: userRow } = await supabase.from('users').select('*').eq('userId', userId).maybeSingle();
  if (!userRow) return null;

  const [modules, tasks, sessions, grades, streakRecords, petUnlocks, reflections, notifications, bossRows, prefsRow, plannedRows] =
    await Promise.all([
      supabase.from('modules').select('*').eq('userId', userId),
      supabase.from('tasks').select('*').eq('userId', userId),
      supabase.from('studySessions').select('*').eq('userId', userId).order('completedAt', { ascending: false }),
      supabase.from('grades').select('*').eq('userId', userId),
      supabase.from('streakRecords').select('*').eq('userId', userId),
      supabase.from('petUnlocks').select('*').eq('userId', userId),
      supabase.from('reflections').select('*').eq('userId', userId),
      supabase.from('notifications').select('*').eq('userId', userId),
      supabase.from('bossBattles').select('*').eq('userId', userId).limit(1),
      supabase.from('plannerPreferences').select('*').eq('userId', userId).maybeSingle(),
      supabase.from('plannedSessions').select('*').eq('userId', userId),
    ]);

  const moduleList = (modules.data ?? []) as Module[];
  const taskList = (tasks.data ?? []) as Task[];
  const prefs: PlannerPreferences = prefsRow.data
    ? {
        availableHoursPerDay: prefsRow.data.availableHoursPerDay,
        preferredStartHour: prefsRow.data.preferredStartHour,
        sessionMinutes: prefsRow.data.sessionMinutes,
        weakModuleCodes: moduleList.filter((m) => m.isWeak).map((m) => m.moduleCode),
      }
    : { ...DEFAULT_PREFERENCES, weakModuleCodes: moduleList.filter((m) => m.isWeak).map((m) => m.moduleCode) };

  // plannedSessions is stored slim (taskId/day/startHour/duration/completed) — title/moduleCode are
  // display-only, so they're joined back in from the tasks/modules already loaded above.
  const plannedSessions: PlannedSession[] = (plannedRows.data ?? []).map((row) => {
    const task = taskList.find((t) => t.taskId === row.taskId);
    const mod = task ? moduleList.find((m) => m.moduleId === task.moduleId) : null;
    return {
      sessionId: row.sessionId,
      taskId: row.taskId,
      title: task?.title ?? 'Deleted task',
      moduleCode: mod?.moduleCode ?? 'GEN',
      day: row.day,
      startHour: row.startHour,
      durationMinutes: row.durationMinutes,
      completed: row.completed,
    };
  });

  return {
    user: userRow as User,
    targetGpa: (userRow as { targetGpa?: number }).targetGpa ?? 3.70,
    modules: moduleList,
    tasks: taskList,
    sessions: (sessions.data ?? []) as StudySession[],
    grades: (grades.data ?? []) as Grade[],
    streakRecords: (streakRecords.data ?? []) as StreakRecord[],
    petUnlocks: (petUnlocks.data ?? []) as PetUnlock[],
    reflections: (reflections.data ?? []) as Reflection[],
    notifications: (notifications.data ?? []) as Notification[],
    boss: (bossRows.data?.[0] as BossBattle) ?? null,
    plannerPreferences: prefs,
    plannedSessions,
  };
}

/**
 * First-ever login: gives the new account a starter dataset — the same realistic
 * DAAA Year 2 workload the offline demo ships with — so the app isn't empty on
 * day one. Everything is re-keyed to the real account id and actually persisted,
 * so from here on it behaves like the student's own data (because it is).
 */
export async function bootstrapNewUser(userId: string, email: string, name: string): Promise<HydratedData> {
  const moduleIdMap = new Map(demoModules.map((m) => [m.moduleId, newId()]));
  const taskIdMap = new Map(demoTasks.map((t) => [t.taskId, newId()]));

  const user: User = {
    userId, email, name,
    totalXp: 0, currentLevel: 1, currentRank: 'Rookie',
    currentStreak: 0, freezeTokens: 0, lastActiveDate: null, selectedPetId: null,
  };

  const modules: Module[] = demoModules.map((m) => ({
    ...m, userId, moduleId: moduleIdMap.get(m.moduleId)!,
  }));

  const tasks: Task[] = demoTasks.map((t) => ({
    ...t,
    userId,
    taskId: taskIdMap.get(t.taskId)!,
    moduleId: t.moduleId ? moduleIdMap.get(t.moduleId) ?? null : null,
    parentTaskId: t.parentTaskId ? taskIdMap.get(t.parentTaskId) ?? null : null,
  }));

  // Fresh account starts at zero — no backdated sessions, streak, or past grades.
  const sessions: StudySession[] = [];
  const grades: Grade[] = [];
  const streakRecords: StreakRecord[] = [];
  const reflections: Reflection[] = [];
  const petUnlocks: PetUnlock[] = [];
  const notifications: Notification[] = demoNotifications.map((n) => ({ ...n, userId, notificationId: newId() }));

  const demoBossTask = demoBoss.taskId ? taskIdMap.get(demoBoss.taskId) ?? null : null;
  const boss: BossBattle = { ...demoBoss, userId, bossId: newId(), taskId: demoBossTask, health: 100, defeatedAt: null, checklist: demoBoss.checklist.map((c) => ({ ...c, done: false })) };

  const plannerPreferences: PlannerPreferences = {
    ...DEFAULT_PREFERENCES,
    weakModuleCodes: modules.filter((m) => m.isWeak).map((m) => m.moduleCode),
  };
  const plannedSessions = generateWeeklySchedule(tasks, modules, plannerPreferences);

  if (supabase) {
    await supabase.from('users').upsert({ ...user, selectedPetId: null, targetGpa: 3.70 }, { onConflict: 'userId' });
    if (modules.length) await supabase.from('modules').upsert(modules);
    if (tasks.length) await supabase.from('tasks').upsert(tasks);
    if (notifications.length) await supabase.from('notifications').upsert(notifications);
    await supabase.from('bossBattles').upsert(boss);
    await supabase.from('plannerPreferences').upsert({
      userId,
      availableHoursPerDay: plannerPreferences.availableHoursPerDay,
      preferredStartHour: plannerPreferences.preferredStartHour,
      sessionMinutes: plannerPreferences.sessionMinutes,
    });
    if (plannedSessions.length) {
      await supabase.from('plannedSessions').upsert(
        plannedSessions.map((p) => ({
          sessionId: p.sessionId, userId, taskId: p.taskId, day: p.day,
          startHour: p.startHour, durationMinutes: p.durationMinutes, completed: p.completed,
        })),
      );
    }
  }

  return {
    user, targetGpa: 3.70, modules, tasks, sessions, grades, streakRecords, petUnlocks,
    reflections, notifications, boss, plannerPreferences, plannedSessions,
  };
}

// ---------- debounced write-through (called from the store's subscribe listener) ----------

const timers = new Map<string, ReturnType<typeof setTimeout>>();

/** Debounces writes per key so fast successive edits (dragging a slider, typing) don't fire a request each tick. */
function debounced(key: string, fn: () => void, delayMs = 700) {
  const existing = timers.get(key);
  if (existing) clearTimeout(existing);
  timers.set(key, setTimeout(fn, delayMs));
}

export function pushUser(userId: string, user: User, targetGpa: number) {
  if (!supabase) return;
  debounced(`user:${userId}`, () => {
    supabase!.from('users').upsert({ ...user, selectedPetId: null, targetGpa }, { onConflict: 'userId' })
      .then(({ error }) => { if (error) console.error('StudyQuest sync (user):', error.message); });
  });
}

export function pushModules(userId: string, modules: Module[]) {
  if (!supabase || modules.length === 0) return;
  debounced(`modules:${userId}`, () => {
    supabase!.from('modules').upsert(modules)
      .then(({ error }) => { if (error) console.error('StudyQuest sync (modules):', error.message); });
  });
}

export function pushTasks(userId: string, tasks: Task[]) {
  if (!supabase || tasks.length === 0) return;
  debounced(`tasks:${userId}`, () => {
    supabase!.from('tasks').upsert(tasks)
      .then(({ error }) => { if (error) console.error('StudyQuest sync (tasks):', error.message); });
  });
}

/**
 * Upsert only ever adds/updates rows — it never removes ones missing from the
 * array, so a manually deleted task needs its own explicit delete call.
 * Not debounced: deletes should land immediately, not get coalesced away.
 */
export function deleteTaskRemote(userId: string, taskId: string) {
  if (!supabase) return;
  supabase.from('tasks').delete().eq('userId', userId).eq('taskId', taskId)
    .then(({ error }) => { if (error) console.error('StudyQuest sync (delete task):', error.message); });
}

export function pushSessions(userId: string, sessions: StudySession[]) {
  if (!supabase || sessions.length === 0) return;
  debounced(`sessions:${userId}`, () => {
    supabase!.from('studySessions').upsert(sessions)
      .then(({ error }) => { if (error) console.error('StudyQuest sync (sessions):', error.message); });
  });
}

export function pushGrades(userId: string, grades: Grade[]) {
  if (!supabase || grades.length === 0) return;
  debounced(`grades:${userId}`, () => {
    supabase!.from('grades').upsert(grades)
      .then(({ error }) => { if (error) console.error('StudyQuest sync (grades):', error.message); });
  });
}

export function pushStreakRecords(userId: string, records: StreakRecord[]) {
  if (!supabase || records.length === 0) return;
  debounced(`streaks:${userId}`, () => {
    supabase!.from('streakRecords').upsert(records, { onConflict: 'userId,streakDate' })
      .then(({ error }) => { if (error) console.error('StudyQuest sync (streaks):', error.message); });
  });
}

export function pushPetUnlocks(userId: string, unlocks: PetUnlock[]) {
  if (!supabase || unlocks.length === 0) return;
  debounced(`petUnlocks:${userId}`, () => {
    supabase!.from('petUnlocks').upsert(unlocks.map((u) => ({ ...u, petId: null })))
      .then(({ error }) => { if (error) console.error('StudyQuest sync (petUnlocks):', error.message); });
  });
}

export function pushReflections(userId: string, reflections: Reflection[]) {
  if (!supabase || reflections.length === 0) return;
  debounced(`reflections:${userId}`, () => {
    supabase!.from('reflections').upsert(reflections, { onConflict: 'userId,weekStart' })
      .then(({ error }) => { if (error) console.error('StudyQuest sync (reflections):', error.message); });
  });
}

export function pushBoss(userId: string, boss: BossBattle) {
  if (!supabase) return;
  debounced(`boss:${userId}`, () => {
    supabase!.from('bossBattles').upsert(boss)
      .then(({ error }) => { if (error) console.error('StudyQuest sync (boss):', error.message); });
  });
}

export function pushPreferences(userId: string, prefs: PlannerPreferences) {
  if (!supabase) return;
  debounced(`prefs:${userId}`, () => {
    supabase!.from('plannerPreferences').upsert({
      userId,
      availableHoursPerDay: prefs.availableHoursPerDay,
      preferredStartHour: prefs.preferredStartHour,
      sessionMinutes: prefs.sessionMinutes,
    }, { onConflict: 'userId' })
      .then(({ error }) => { if (error) console.error('StudyQuest sync (prefs):', error.message); });
  });
}

export function pushPlannedSessions(userId: string, sessions: PlannedSession[]) {
  if (!supabase) return;
  debounced(`planned:${userId}`, () => {
    supabase!.from('plannedSessions').upsert(
      sessions.map((p) => ({
        sessionId: p.sessionId, userId, taskId: p.taskId, day: p.day,
        startHour: p.startHour, durationMinutes: p.durationMinutes, completed: p.completed,
      })),
    ).then(({ error }) => { if (error) console.error('StudyQuest sync (planned sessions):', error.message); });
  });
}

/** Global ranking by XP — see get_leaderboard() in supabase/schema.sql, a SECURITY DEFINER function scoped to name/XP/level/rank/streak only. */
export async function fetchLeaderboard(limit = 50): Promise<LeaderboardEntry[]> {
  if (!supabase) return [];
  const { data, error } = await supabase.rpc('get_leaderboard', { limit_count: limit });
  if (error) { console.error('StudyQuest leaderboard fetch:', error.message); return []; }
  return (data ?? []) as LeaderboardEntry[];
}
