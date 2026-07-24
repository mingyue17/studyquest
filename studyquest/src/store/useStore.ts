'use client';

import { create } from 'zustand';
import type {
  Badge, BossBattle, ChecklistItem, DailyQuest, Grade, Module, Notification, PetUnlock,
  PlannedSession, Reflection, StreakRecord, StudySession, Task, TaskStatus,
  Team, TeamMember, TeamTask, TeamTaskStatus, User,
} from '@/types';
import {
  demoBoss, demoGrades, demoModules, demoNotifications, demoPetUnlocks,
  demoReflections, demoSessions, demoStreakRecords, demoTasks, demoTeam,
  demoTeamMembers, demoTeamTasks, demoUnlockedBadgeIds, demoUser,
} from '@/data/demoData';
import { XP_REWARDS, awardXp, calculateRank, determinePetStage } from '@/lib/gamification';
import { calculatePriorityScore, generateSubquests } from '@/lib/priority';
import { updateStreak, toDateKey } from '@/lib/streaks';
import { checkBadgeUnlocks, generateDailyQuests, DAILY_COMPLETION_BONUS } from '@/lib/quests';
import { DEFAULT_PREFERENCES, generateWeeklySchedule, type PlannerPreferences } from '@/lib/planner';
import { colorForName, suggestTeammateAdvice } from '@/lib/team';
import {
  fetchAllForUser, bootstrapNewUser, pushUser, pushModules, pushTasks, pushSessions,
  pushGrades, pushStreakRecords, pushPetUnlocks, pushReflections, pushBoss,
  pushPreferences, pushPlannedSessions, deleteTaskRemote,
} from '@/lib/sync';
import type { PetMood } from '@/types';

interface Toast { id: string; title: string; body: string; tone: 'xp' | 'level' | 'badge' | 'warn' }

interface StoreState {
  authUserId: string | null;
  hydrated: boolean;
  hydrating: boolean;
  user: User;
  modules: Module[];
  tasks: Task[];
  sessions: StudySession[];
  streakRecords: StreakRecord[];
  grades: Grade[];
  petUnlocks: PetUnlock[];
  team: Team;
  teamMembers: TeamMember[];
  teamTasks: TeamTask[];
  reflections: Reflection[];
  notifications: Notification[];
  boss: BossBattle;
  unlockedBadgeIds: string[];
  dailyQuests: DailyQuest[];
  plannerPreferences: PlannerPreferences;
  plannedSessions: PlannedSession[];
  targetGpa: number;
  petMood: PetMood;
  toasts: Toast[];
  teammateAdvice: { complaint: string; text: string } | null;

  // actions
  logStudyBlock: (minutes?: number, taskId?: string) => void;
  setTaskStatus: (taskId: string, status: TaskStatus) => void;
  setTaskProgress: (taskId: string, progress: number) => void;
  splitIntoSubquests: (taskId: string) => void;
  completeDailyQuest: (questId: string) => void;
  damageBoss: (index: number) => void;
  moveTeamTask: (teamTaskId: string, status: TeamTaskStatus) => void;
  addTeamMember: (displayName: string, role: string) => void;
  addChecklistItem: (teamTaskId: string, label: string) => void;
  toggleChecklistItem: (teamTaskId: string, itemId: string) => void;
  askTeammateAdvice: (complaint: string) => void;
  saveReflection: (reflection: Reflection) => void;
  setModuleGrade: (moduleId: string, grade: string) => void;
  setTargetGpa: (value: number) => void;
  regenerateSchedule: () => void;
  movePlannedSession: (sessionId: string, day: number) => void;
  togglePlannedSession: (sessionId: string) => void;
  setPreferences: (prefs: Partial<PlannerPreferences>) => void;
  equipItem: (unlockId: string) => void;
  dismissToast: (id: string) => void;
  setPetMood: (mood: PetMood) => void;
  pushToast: (title: string, body: string, tone?: Toast['tone']) => void;

  // manual entry — for anything not already synced in from SNAPP/PoliteMall/Teams
  addModule: (input: { moduleCode: string; moduleName: string; moduleCredits: number }) => Module;
  addTask: (input: {
    title: string;
    moduleId: string | null;
    deadline: string; // ISO
    taskType: string;
    weightage: number;
    estimatedHours: number;
    difficulty: number;
    isFinal: boolean;
    isGroupTask: boolean;
  }) => void;
  deleteTask: (taskId: string) => void;

  // auth-backed persistence
  hydrate: (authUserId: string, email: string, name?: string) => Promise<void>;
  signOutLocal: () => void;
}

const nowIso = () => new Date().toISOString();

export const useStore = create<StoreState>((set, get) => ({
  authUserId: null,
  hydrated: false,
  hydrating: false,
  user: demoUser,
  modules: demoModules,
  tasks: demoTasks,
  sessions: demoSessions,
  streakRecords: demoStreakRecords,
  grades: demoGrades,
  petUnlocks: demoPetUnlocks,
  team: demoTeam,
  teamMembers: demoTeamMembers,
  teamTasks: demoTeamTasks,
  reflections: demoReflections,
  notifications: demoNotifications,
  boss: demoBoss,
  unlockedBadgeIds: demoUnlockedBadgeIds,
  dailyQuests: generateDailyQuests(demoTasks, demoSessions),
  plannerPreferences: {
    ...DEFAULT_PREFERENCES,
    weakModuleCodes: demoModules.filter((m) => m.isWeak).map((m) => m.moduleCode),
  },
  plannedSessions: generateWeeklySchedule(demoTasks, demoModules, {
    ...DEFAULT_PREFERENCES,
    weakModuleCodes: demoModules.filter((m) => m.isWeak).map((m) => m.moduleCode),
  }),
  targetGpa: 3.7,
  petMood: 'idle',
  toasts: [],
  teammateAdvice: null,

  /**
   * Automation flow, steps 8–12: award XP → check badges → update streak →
   * check level-up → evolve pet. Every mutation that earns XP routes through here.
   */
  logStudyBlock: (minutes = 30, taskId) => {
    const state = get();
    const session: StudySession = {
      sessionId: crypto.randomUUID(),
      userId: state.user.userId,
      taskId: taskId ?? null,
      durationMinutes: minutes,
      scheduledStart: nowIso(),
      completedAt: nowIso(),
      xpEarned: minutes > 0 ? Math.max(1, Math.round((minutes / 30) * XP_REWARDS.logStudyBlock)) : 0,
    };
    applyXp(set, get, 'logStudyBlock', session.xpEarned, session.sessionId, {
      sessions: [session, ...state.sessions],
    });
    set({ petMood: 'happy' });
    setTimeout(() => set({ petMood: 'idle' }), 3000);
  },

  setTaskStatus: (taskId, status) => {
    const state = get();
    const task = state.tasks.find((t) => t.taskId === taskId);
    if (!task) return;

    const nextTasks = state.tasks.map((t) =>
      t.taskId === taskId
        ? {
            ...t,
            status,
            progress: status === 'Submitted' ? 100 : status === 'In Progress' ? Math.max(t.progress, 10) : t.progress,
            completedAt: status === 'Submitted' ? nowIso() : null,
            priorityScore: calculatePriorityScore({ ...t, status }),
          }
        : t);

    if (status !== 'Submitted') {
      set({ tasks: nextTasks });
      return;
    }

    // XP: base reward, plus an early-submission bonus when there is a full day left.
    const hoursEarly = (new Date(task.deadline).getTime() - Date.now()) / 3_600_000;
    const base = task.weightage >= 15 ? XP_REWARDS.completeAssignment : XP_REWARDS.completeSmallQuest;
    const bonus = hoursEarly >= 24 ? XP_REWARDS.submitEarlyBonus : 0;

    applyXp(set, get, bonus ? 'completeAssignmentEarly' : 'completeAssignment', base + bonus, taskId, {
      tasks: nextTasks,
    });
    set({ petMood: 'celebrating' });
    setTimeout(() => set({ petMood: 'idle' }), 3500);
  },

  setTaskProgress: (taskId, progress) =>
    set((s) => ({
      tasks: s.tasks.map((t) =>
        t.taskId === taskId
          ? { ...t, progress, priorityScore: calculatePriorityScore({ ...t, progress }) }
          : t),
    })),

  splitIntoSubquests: (taskId) => {
    const state = get();
    const task = state.tasks.find((t) => t.taskId === taskId);
    if (!task || state.tasks.some((t) => t.parentTaskId === taskId)) return;
    const subquests = generateSubquests(task).map((sq) => ({
      ...sq, priorityScore: calculatePriorityScore(sq),
    }));
    set({ tasks: [...state.tasks, ...subquests] });
  },

  completeDailyQuest: (questId) => {
    const state = get();
    const quest = state.dailyQuests.find((q) => q.questId === questId);
    if (!quest || quest.done) return;
    const dailyQuests = state.dailyQuests.map((q) => (q.questId === questId ? { ...q, done: true } : q));
    const allDone = dailyQuests.every((q) => q.done);
    applyXp(set, get, 'completeSmallQuest', quest.xpReward + (allDone ? DAILY_COMPLETION_BONUS : 0), questId, {
      dailyQuests,
    });
  },

  damageBoss: (index) => {
    const state = get();
    const item = state.boss.checklist[index];
    if (!item || item.done) return;
    const checklist = state.boss.checklist.map((c, i) => (i === index ? { ...c, done: true } : c));
    const health = Math.max(0, state.boss.health - item.damage);
    const defeated = health === 0;
    applyXp(set, get, defeated ? 'bossDefeated' : 'completeSmallQuest',
      defeated ? state.boss.xpReward : XP_REWARDS.completeSmallQuest, state.boss.bossId, {
        boss: { ...state.boss, checklist, health, defeatedAt: defeated ? nowIso() : null },
      });
  },

  moveTeamTask: (teamTaskId, status) => {
    const state = get();
    const task = state.teamTasks.find((t) => t.teamTaskId === teamTaskId);
    if (!task || task.status === status) return;
    const teamTasks = state.teamTasks.map((t) => (t.teamTaskId === teamTaskId ? { ...t, status } : t));
    const justMerged = status === 'Merged' && task.status !== 'Merged';
    const isMine = state.teamMembers.find((m) => m.teamMemberId === task.assignedUserId)?.userId === state.user.userId;

    set({ teamTasks, team: { ...state.team, totalXp: state.team.totalXp + (justMerged ? task.xpReward : 0) } });
    if (justMerged && isMine) applyXp(set, get, 'completeTeamTask', XP_REWARDS.completeTeamTask, teamTaskId, { teamTasks });
  },

  addTeamMember: (displayName, role) => {
    const state = get();
    if (!displayName.trim()) return;
    const newMember: TeamMember = {
      teamMemberId: crypto.randomUUID(),
      teamId: state.team.teamId,
      userId: null,
      displayName: displayName.trim(),
      role: role.trim() || 'Member',
      avatarColor: colorForName(displayName.trim()),
    };
    set({ teamMembers: [...state.teamMembers, newMember] });
  },

  addChecklistItem: (teamTaskId, label) => {
    if (!label.trim()) return;
    const item: ChecklistItem = { itemId: crypto.randomUUID(), label: label.trim(), done: false };
    set((s) => ({
      teamTasks: s.teamTasks.map((t) =>
        t.teamTaskId === teamTaskId ? { ...t, checklist: [...t.checklist, item] } : t),
    }));
  },

  toggleChecklistItem: (teamTaskId, itemId) =>
    set((s) => ({
      teamTasks: s.teamTasks.map((t) =>
        t.teamTaskId === teamTaskId
          ? { ...t, checklist: t.checklist.map((c) => (c.itemId === itemId ? { ...c, done: !c.done } : c)) }
          : t),
    })),

  askTeammateAdvice: (complaint) => {
    if (!complaint.trim()) return;
    const state = get();
    const advice = suggestTeammateAdvice(complaint, state.teamTasks, state.teamMembers);
    set({ teammateAdvice: { complaint, text: advice.text } });
  },

  saveReflection: (reflection) => {
    const state = get();
    const exists = state.reflections.some((r) => r.weekStart === reflection.weekStart);
    const reflections = exists
      ? state.reflections.map((r) => (r.weekStart === reflection.weekStart ? reflection : r))
      : [reflection, ...state.reflections];
    applyXp(set, get, 'completeReflection', exists ? 0 : XP_REWARDS.completeReflection, reflection.reflectionId, { reflections });
  },

  setModuleGrade: (moduleId, grade) =>
    set((s) => ({ modules: s.modules.map((m) => (m.moduleId === moduleId ? { ...m, currentGrade: grade } : m)) })),

  setTargetGpa: (value) => set({ targetGpa: value }),

  regenerateSchedule: () =>
    set((s) => ({ plannedSessions: generateWeeklySchedule(s.tasks, s.modules, s.plannerPreferences) })),

  movePlannedSession: (sessionId, day) =>
    set((s) => ({ plannedSessions: s.plannedSessions.map((p) => (p.sessionId === sessionId ? { ...p, day } : p)) })),

  togglePlannedSession: (sessionId) => {
    const state = get();
    const session = state.plannedSessions.find((p) => p.sessionId === sessionId);
    if (!session) return;
    const plannedSessions = state.plannedSessions.map((p) =>
      p.sessionId === sessionId ? { ...p, completed: !p.completed } : p);
    set({ plannedSessions });
    if (!session.completed) get().logStudyBlock(session.durationMinutes, session.taskId);
  },

  setPreferences: (prefs) =>
    set((s) => ({ plannerPreferences: { ...s.plannerPreferences, ...prefs } })),

  equipItem: (unlockId) =>
    set((s) => {
      const target = s.petUnlocks.find((u) => u.unlockId === unlockId);
      if (!target) return {};
      return {
        petUnlocks: s.petUnlocks.map((u) =>
          u.itemType === target.itemType
            ? { ...u, equipped: u.unlockId === unlockId ? !u.equipped : false }
            : u),
      };
    }),

  dismissToast: (id) => set((s) => ({ toasts: s.toasts.filter((t) => t.id !== id) })),
  setPetMood: (mood) => set({ petMood: mood }),
  pushToast: (title, body, tone = 'xp') => set((s) => ({
    toasts: [...s.toasts, { id: crypto.randomUUID(), title, body, tone }].slice(-4),
  })),

  /** For a module SNAPP/PoliteMall/Teams hasn't surfaced yet — student adds it themselves. */
  addModule: (input) => {
    const state = get();
    const module: Module = {
      moduleId: crypto.randomUUID(),
      userId: state.user.userId,
      moduleCode: input.moduleCode.trim().toUpperCase(),
      moduleName: input.moduleName.trim(),
      moduleCredits: input.moduleCredits,
      currentGrade: null,
      isWeak: false,
    };
    set({ modules: [...state.modules, module] });
    return module;
  },

  /** Same idea, for a task — source is always 'Manual' so it's visually distinct from imported ones. */
  addTask: (input) => {
    const state = get();
    const xpReward = input.isFinal
      ? 300
      : input.weightage >= 15 ? XP_REWARDS.completeAssignment : XP_REWARDS.completeSmallQuest;

    const task: Task = {
      taskId: crypto.randomUUID(),
      userId: state.user.userId,
      moduleId: input.moduleId,
      parentTaskId: null,
      title: input.title.trim(),
      source: 'Manual',
      deadline: input.deadline,
      status: 'To Do',
      priorityScore: 0,
      difficulty: input.difficulty,
      xpReward,
      isFinal: input.isFinal,
      estimatedHours: input.estimatedHours,
      weightage: input.weightage,
      progress: 0,
      taskType: input.taskType,
      isGroupTask: input.isGroupTask,
      completedAt: null,
    };
    task.priorityScore = calculatePriorityScore(task);

    const tasks = [...state.tasks, task];
    set({ tasks, dailyQuests: generateDailyQuests(tasks, state.sessions) });
  },

  deleteTask: (taskId) => {
    const state = get();
    // Also drop any subquests split off this task.
    const tasks = state.tasks.filter((t) => t.taskId !== taskId && t.parentTaskId !== taskId);
    set({ tasks, dailyQuests: generateDailyQuests(tasks, state.sessions) });
    if (state.authUserId) deleteTaskRemote(state.authUserId, taskId);
  },

  /**
   * Runs once per sign-in. Loads the account's real data from Supabase, or —
   * for a brand-new account — gives it a starter dataset and saves that as
   * the first real save. Team data stays the shared local demo team for now
   * (no invite flow yet); everything else becomes this account's own.
   */
  hydrate: async (authUserId, email, name) => {
    set({ hydrating: true });
    try {
      const existing = await fetchAllForUser(authUserId);
      const data = existing ?? await bootstrapNewUser(authUserId, email, name?.trim() || email.split('@')[0]);

      set({
        authUserId,
        user: data.user,
        modules: data.modules,
        tasks: data.tasks,
        sessions: data.sessions,
        grades: data.grades,
        streakRecords: data.streakRecords,
        petUnlocks: data.petUnlocks,
        reflections: data.reflections,
        notifications: data.notifications,
        boss: data.boss ?? demoBoss,
        plannerPreferences: data.plannerPreferences,
        plannedSessions: data.plannedSessions,
        unlockedBadgeIds: existing ? get().unlockedBadgeIds : [],
        dailyQuests: generateDailyQuests(data.tasks, data.sessions),
        targetGpa: data.targetGpa,
        hydrated: true,
        hydrating: false,
      });
    } catch (err) {
      console.error('StudyQuest hydrate failed, staying on local data:', err);
      set({ hydrating: false });
    }
  },

  /** Sign-out: drop back to a clean slate so the next login doesn't flash the previous account's data. */
  signOutLocal: () => set({
    authUserId: null,
    hydrated: false,
    user: demoUser,
    modules: demoModules,
    tasks: demoTasks,
    sessions: demoSessions,
    streakRecords: demoStreakRecords,
    grades: demoGrades,
    petUnlocks: demoPetUnlocks,
    reflections: demoReflections,
    notifications: demoNotifications,
    boss: demoBoss,
    unlockedBadgeIds: demoUnlockedBadgeIds,
    dailyQuests: generateDailyQuests(demoTasks, demoSessions),
    targetGpa: 3.7,
  }),
}));

/**
 * Write-through sync: whenever a persisted slice changes for a hydrated,
 * signed-in account, push it to Supabase (debounced inside each push* call).
 * Local-only slices (team, badges, dailyQuests) are deliberately not listed —
 * see the note at the top of lib/sync.ts.
 */
let prevSynced = useStore.getState();
useStore.subscribe((state) => {
  if (!state.hydrated || !state.authUserId) { prevSynced = state; return; }
  const uid = state.authUserId;
  if (state.user !== prevSynced.user || state.targetGpa !== prevSynced.targetGpa) pushUser(uid, state.user, state.targetGpa);
  if (state.modules !== prevSynced.modules) pushModules(uid, state.modules);
  if (state.tasks !== prevSynced.tasks) pushTasks(uid, state.tasks);
  if (state.sessions !== prevSynced.sessions) pushSessions(uid, state.sessions);
  if (state.grades !== prevSynced.grades) pushGrades(uid, state.grades);
  if (state.streakRecords !== prevSynced.streakRecords) pushStreakRecords(uid, state.streakRecords);
  if (state.petUnlocks !== prevSynced.petUnlocks) pushPetUnlocks(uid, state.petUnlocks);
  if (state.reflections !== prevSynced.reflections) pushReflections(uid, state.reflections);
  if (state.boss !== prevSynced.boss) pushBoss(uid, state.boss);
  if (state.plannerPreferences !== prevSynced.plannerPreferences) pushPreferences(uid, state.plannerPreferences);
  if (state.plannedSessions !== prevSynced.plannedSessions) pushPlannedSessions(uid, state.plannedSessions);
  prevSynced = state;
});

/**
 * Shared tail of the automation flow. Adds XP, recomputes level/rank, updates
 * the streak, checks badge conditions and fires the pet evolution animation.
 */
function applyXp(
  set: (partial: Partial<StoreState>) => void,
  get: () => StoreState,
  activityType: string,
  amount: number,
  referenceId: string,
  extra: Partial<StoreState>,
) {
  const state = get();
  const result = awardXp({
    userId: state.user.userId,
    currentTotalXp: state.user.totalXp,
    activityType,
    amount,
    referenceId,
  });

  const streak = updateStreak(
    { currentStreak: state.user.currentStreak, freezeTokens: state.user.freezeTokens, lastActiveDate: state.user.lastActiveDate },
    state.user.userId,
  );

  const sessions = (extra.sessions ?? state.sessions);
  const tasks = (extra.tasks ?? state.tasks);
  const todayKey = toDateKey(new Date());
  const minutesToday = sessions
    .filter((s) => s.completedAt && toDateKey(s.completedAt) === todayKey)
    .reduce((sum, s) => sum + s.durationMinutes, 0);

  const newBadges: Badge[] = checkBadgeUnlocks(
    {
      sessionsCompleted: sessions.filter((s) => s.completedAt).length,
      minutesInADay: minutesToday,
      streakDays: streak.currentStreak,
      earlySubmissions: tasks.filter((t) => t.completedAt && new Date(t.completedAt) < new Date(t.deadline)).length,
      clashesSurvived: 0,
      cgpaGain: 0,
      perfectWeeks: 0,
      bossesDefeated: (extra.boss ?? state.boss).health === 0 ? 1 : 0,
      teamTasksCompleted: (extra.teamTasks ?? state.teamTasks).filter((t) => t.status === 'Merged').length,
      comebackStreak: 0,
    },
    state.unlockedBadgeIds,
  );

  const toasts: Toast[] = [];
  if (amount > 0) toasts.push({ id: crypto.randomUUID(), title: `+${amount} XP`, body: activityType, tone: 'xp' });
  if (result.leveledUp) toasts.push({ id: crypto.randomUUID(), title: `Level ${result.currentLevel}`, body: `Rank: ${result.currentRank}`, tone: 'level' });
  if (result.petEvolved) toasts.push({ id: crypto.randomUUID(), title: 'Byte evolved', body: `Now a ${determinePetStage(result.currentLevel)}`, tone: 'level' });
  newBadges.forEach((b) => toasts.push({ id: crypto.randomUUID(), title: `Badge: ${b.badgeName}`, body: b.description, tone: 'badge' }));

  set({
    ...extra,
    user: {
      ...state.user,
      totalXp: result.totalXp,
      currentLevel: result.currentLevel,
      currentRank: calculateRank(result.currentLevel),
      currentStreak: streak.currentStreak,
      freezeTokens: streak.freezeTokens,
      lastActiveDate: streak.lastActiveDate,
    },
    streakRecords: state.streakRecords.some((r) => r.streakDate === streak.record.streakDate)
      ? state.streakRecords
      : [streak.record, ...state.streakRecords],
    unlockedBadgeIds: [...state.unlockedBadgeIds, ...newBadges.map((b) => b.badgeId)],
    toasts: [...state.toasts, ...toasts].slice(-4),
  });

  if (result.petEvolved) {
    set({ petMood: 'evolving' });
    setTimeout(() => useStore.setState({ petMood: 'idle' }), 1600);
  }
}
