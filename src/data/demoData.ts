/**
 * Seed data for the offline demo. Dates are generated relative to "now" so the
 * dashboard always looks alive — clashes, overdue work and the final all stay
 * in the right place no matter when the app is opened.
 */
import type {
  BossBattle, Grade, Module, Notification, Pet, PetUnlock, Reflection,
  StreakRecord, StudySession, Task, Team, TeamMember, TeamTask, User,
} from '@/types';
import { calculatePriorityScore } from '@/lib/priority';
import { toDateKey } from '@/lib/streaks';

const DEMO_USER_ID = '11111111-1111-1111-1111-111111111111';

const inDays = (days: number, hour = 23, minute = 59) => {
  const d = new Date();
  d.setDate(d.getDate() + days);
  d.setHours(hour, minute, 0, 0);
  return d.toISOString();
};

export const demoUser: User = {
  userId: DEMO_USER_ID,
  name: 'Ming',
  email: 'ming@myrp.edu.sg',
  totalXp: 3120,          // → level 7, Baby stage pet
  currentLevel: 7,
  currentRank: 'Scholar',
  currentStreak: 9,
  freezeTokens: 1,
  lastActiveDate: toDateKey(new Date()),
  selectedPetId: 'pet-baby',
};

export const demoModules: Module[] = [
  { moduleId: 'm-2001', userId: DEMO_USER_ID, moduleCode: 'SC2001', moduleName: 'Algorithms & Data Structures', academicUnits: 4, currentGrade: 'B+', isWeak: true },
  { moduleId: 'm-2005', userId: DEMO_USER_ID, moduleCode: 'SC2005', moduleName: 'Operating Systems', academicUnits: 3, currentGrade: 'A-', isWeak: false },
  { moduleId: 'm-2006', userId: DEMO_USER_ID, moduleCode: 'SC2006', moduleName: 'Software Engineering', academicUnits: 3, currentGrade: 'A', isWeak: false },
  { moduleId: 'm-2008', userId: DEMO_USER_ID, moduleCode: 'SC2008', moduleName: 'Computer Networks', academicUnits: 3, currentGrade: 'B', isWeak: true },
  { moduleId: 'm-0007', userId: DEMO_USER_ID, moduleCode: 'CC0007', moduleName: 'Science & Technology for Humanity', academicUnits: 2, currentGrade: 'A-', isWeak: false },
];

type RawTask = Omit<Task, 'userId' | 'parentTaskId' | 'priorityScore'>;

const rawTasks: RawTask[] = [
  // --- the clash: two heavy pieces landing on the same evening ---
  { taskId: 't-1', moduleId: 'm-2001', title: 'Dijkstra & MST Programming Assignment', source: 'SNAPP', deadline: inDays(3), status: 'In Progress', difficulty: 5, xpReward: 80, isFinal: false, estimatedHours: 12, weightage: 25, progress: 30, taskType: 'Assignment', isGroupTask: false },
  { taskId: 't-2', moduleId: 'm-2008', title: 'Network Layer Lab Report', source: 'PoliteMall', deadline: inDays(3, 18), status: 'To Do', difficulty: 3, xpReward: 80, isFinal: false, estimatedHours: 8, weightage: 20, progress: 0, taskType: 'Lab', isGroupTask: false },

  // --- the final boss ---
  { taskId: 't-3', moduleId: 'm-2001', title: 'SC2001 Final Exam', source: 'SNAPP', deadline: inDays(24, 9), status: 'To Do', difficulty: 5, xpReward: 300, isFinal: true, estimatedHours: 30, weightage: 50, progress: 15, taskType: 'Exam', isGroupTask: false },

  { taskId: 't-4', moduleId: 'm-2006', title: 'Team5_ECG Sprint 2 Deliverable', source: 'Teams', deadline: inDays(6), status: 'In Progress', difficulty: 4, xpReward: 80, isFinal: false, estimatedHours: 10, weightage: 30, progress: 45, taskType: 'Project', isGroupTask: true },
  { taskId: 't-5', moduleId: 'm-2005', title: 'Process Scheduling Quiz', source: 'PoliteMall', deadline: inDays(1, 20), status: 'To Do', difficulty: 2, xpReward: 30, isFinal: false, estimatedHours: 2, weightage: 10, progress: 0, taskType: 'Quiz', isGroupTask: false },
  { taskId: 't-6', moduleId: 'm-0007', title: 'Ethics Reflection Essay', source: 'PoliteMall', deadline: inDays(9), status: 'To Do', difficulty: 2, xpReward: 80, isFinal: false, estimatedHours: 4, weightage: 15, progress: 0, taskType: 'Assignment', isGroupTask: false },
  { taskId: 't-7', moduleId: 'm-2005', title: 'Read Ch.7 — Deadlocks', source: 'Teams', deadline: inDays(2, 22), status: 'To Do', difficulty: 1, xpReward: 30, isFinal: false, estimatedHours: 1.5, weightage: 0, progress: 0, taskType: 'Reading', isGroupTask: false },
  { taskId: 't-8', moduleId: 'm-2006', title: 'Requirements Doc Peer Review', source: 'Teams', deadline: inDays(-1, 17), status: 'Submitted', difficulty: 2, xpReward: 30, isFinal: false, estimatedHours: 2, weightage: 5, progress: 100, taskType: 'Assignment', isGroupTask: true, completedAt: inDays(-2) },
  { taskId: 't-9', moduleId: 'm-2008', title: 'Subnetting Practice Set', source: 'SNAPP', deadline: inDays(-4, 23), status: 'Submitted', difficulty: 2, xpReward: 30, isFinal: false, estimatedHours: 2, weightage: 5, progress: 100, taskType: 'Quiz', isGroupTask: false, completedAt: inDays(-5) },
  { taskId: 't-10', moduleId: 'm-2005', title: 'SC2005 Final Exam', source: 'SNAPP', deadline: inDays(27, 9), status: 'To Do', difficulty: 4, xpReward: 300, isFinal: true, estimatedHours: 20, weightage: 45, progress: 0, taskType: 'Exam', isGroupTask: false },
];

export const demoTasks: Task[] = rawTasks.map((t) => {
  const task = { ...t, userId: DEMO_USER_ID, parentTaskId: null, priorityScore: 0 } as Task;
  task.priorityScore = calculatePriorityScore(task);
  return task;
});

export const demoSessions: StudySession[] = [
  { sessionId: 's-1', userId: DEMO_USER_ID, taskId: 't-1', durationMinutes: 90, scheduledStart: inDays(-1, 20), completedAt: inDays(-1, 21, 30), xpEarned: 60 },
  { sessionId: 's-2', userId: DEMO_USER_ID, taskId: 't-4', durationMinutes: 60, scheduledStart: inDays(-2, 21), completedAt: inDays(-2, 22), xpEarned: 40 },
  { sessionId: 's-3', userId: DEMO_USER_ID, taskId: 't-3', durationMinutes: 120, scheduledStart: inDays(-3, 14), completedAt: inDays(-3, 16), xpEarned: 80 },
  { sessionId: 's-4', userId: DEMO_USER_ID, taskId: 't-9', durationMinutes: 30, scheduledStart: inDays(-4, 22), completedAt: inDays(-4, 22, 30), xpEarned: 20 },
  { sessionId: 's-5', userId: DEMO_USER_ID, taskId: 't-1', durationMinutes: 60, scheduledStart: inDays(-5, 20), completedAt: inDays(-5, 21), xpEarned: 40 },
  { sessionId: 's-6', userId: DEMO_USER_ID, taskId: 't-8', durationMinutes: 45, scheduledStart: inDays(-6, 19), completedAt: inDays(-6, 19, 45), xpEarned: 30 },
  { sessionId: 's-7', userId: DEMO_USER_ID, taskId: 't-2', durationMinutes: 30, scheduledStart: inDays(0, 20), completedAt: null, xpEarned: 0 },
];

/** Nine days of streak history, with one day rescued by a freeze token. */
export const demoStreakRecords: StreakRecord[] = Array.from({ length: 9 }, (_, i) => {
  const d = new Date();
  d.setDate(d.getDate() - i);
  const freezeUsed = i === 4;
  return {
    streakRecordId: `sr-${i}`,
    userId: DEMO_USER_ID,
    streakDate: toDateKey(d),
    completed: !freezeUsed,
    freezeUsed,
  };
});

export const demoGrades: Grade[] = [
  { gradeId: 'g-1', userId: DEMO_USER_ID, moduleId: null, moduleCode: 'CZ1003', grade: 'A-', academicUnits: 3, semester: 'Y1S1' },
  { gradeId: 'g-2', userId: DEMO_USER_ID, moduleId: null, moduleCode: 'CZ1006', grade: 'B+', academicUnits: 3, semester: 'Y1S1' },
  { gradeId: 'g-3', userId: DEMO_USER_ID, moduleId: null, moduleCode: 'MH1812', grade: 'B', academicUnits: 4, semester: 'Y1S1' },
  { gradeId: 'g-4', userId: DEMO_USER_ID, moduleId: null, moduleCode: 'CZ1007', grade: 'A', academicUnits: 3, semester: 'Y1S2' },
  { gradeId: 'g-5', userId: DEMO_USER_ID, moduleId: null, moduleCode: 'CZ1011', grade: 'B+', academicUnits: 3, semester: 'Y1S2' },
  { gradeId: 'g-6', userId: DEMO_USER_ID, moduleId: null, moduleCode: 'CC0001', grade: 'A-', academicUnits: 2, semester: 'Y1S2' },
];

export const demoPets: Pet[] = [
  { petId: 'pet-egg', petName: 'Byte', stage: 'Egg', requiredLevel: 1, imagePath: null, animationType: 'wobble' },
  { petId: 'pet-baby', petName: 'Byte', stage: 'Baby', requiredLevel: 5, imagePath: null, animationType: 'bounce' },
  { petId: 'pet-young', petName: 'Byte', stage: 'Young', requiredLevel: 10, imagePath: null, animationType: 'hop' },
  { petId: 'pet-teen', petName: 'Byte', stage: 'Teen', requiredLevel: 20, imagePath: null, animationType: 'float' },
  { petId: 'pet-adult', petName: 'Byte', stage: 'Adult', requiredLevel: 35, imagePath: null, animationType: 'glide' },
  { petId: 'pet-legendary', petName: 'Byte', stage: 'Legendary', requiredLevel: 50, imagePath: null, animationType: 'aura' },
];

export const demoPetUnlocks: PetUnlock[] = [
  { unlockId: 'u-1', userId: DEMO_USER_ID, petId: 'pet-baby', itemType: 'hat', itemName: 'Graduation Cap', equipped: true, unlockedAt: inDays(-10) },
  { unlockId: 'u-2', userId: DEMO_USER_ID, petId: 'pet-baby', itemType: 'roomTheme', itemName: 'Neon Dorm', equipped: true, unlockedAt: inDays(-8) },
  { unlockId: 'u-3', userId: DEMO_USER_ID, petId: 'pet-baby', itemType: 'desk', itemName: 'CRT Monitor', equipped: false, unlockedAt: inDays(-6) },
  { unlockId: 'u-4', userId: DEMO_USER_ID, petId: 'pet-baby', itemType: 'frame', itemName: 'Cyan Pixel Frame', equipped: true, unlockedAt: inDays(-3) },
];

export const demoTeam: Team = {
  teamId: 'team-ecg', teamName: 'Team5_ECG', totalXp: 1840, currentLevel: 5, currentStreak: 4,
};

export const demoTeamMembers: TeamMember[] = [
  { teamMemberId: 'tm-1', teamId: 'team-ecg', userId: DEMO_USER_ID, displayName: 'Ming', role: 'Data Lead' },
  { teamMemberId: 'tm-2', teamId: 'team-ecg', userId: null, displayName: 'Wei Jie', role: 'Solution Lead' },
  { teamMemberId: 'tm-3', teamId: 'team-ecg', userId: null, displayName: 'Nadia', role: 'Comms' },
  { teamMemberId: 'tm-4', teamId: 'team-ecg', userId: null, displayName: 'Arjun', role: 'Media' },
  { teamMemberId: 'tm-5', teamId: 'team-ecg', userId: null, displayName: 'Shermaine', role: 'QA' },
];

export const demoTeamTasks: TeamTask[] = [
  { teamTaskId: 'tt-1', teamId: 'team-ecg', assignedUserId: 'tm-1', title: 'Clean ECG signal dataset', status: 'Merged', deadline: inDays(-3), xpReward: 40, blocker: null },
  { teamTaskId: 'tt-2', teamId: 'team-ecg', assignedUserId: 'tm-2', title: 'Build peak detection module', status: 'In Progress', deadline: inDays(4), xpReward: 40, blocker: null },
  { teamTaskId: 'tt-3', teamId: 'team-ecg', assignedUserId: 'tm-5', title: 'Write test harness', status: 'Review', deadline: inDays(2), xpReward: 40, blocker: 'Waiting on peak detection API shape' },
  { teamTaskId: 'tt-4', teamId: 'team-ecg', assignedUserId: 'tm-3', title: 'Draft sprint 2 report', status: 'Backlog', deadline: inDays(6), xpReward: 40, blocker: null },
  { teamTaskId: 'tt-5', teamId: 'team-ecg', assignedUserId: 'tm-4', title: 'Record demo video', status: 'Backlog', deadline: inDays(6), xpReward: 40, blocker: null },
  { teamTaskId: 'tt-6', teamId: 'team-ecg', assignedUserId: 'tm-1', title: 'Feature engineering notebook', status: 'In Progress', deadline: inDays(5), xpReward: 40, blocker: null },
  { teamTaskId: 'tt-7', teamId: 'team-ecg', assignedUserId: 'tm-1', title: 'Data dictionary', status: 'Backlog', deadline: inDays(7), xpReward: 40, blocker: null },
];

export const demoBoss: BossBattle = {
  bossId: 'boss-1',
  userId: DEMO_USER_ID,
  taskId: 't-3',
  bossName: 'SC2001 Final Exam',
  health: 85,
  xpReward: 300,
  checklist: [
    { label: 'Review all lectures', damage: 20, done: true },
    { label: 'Complete tutorial practice', damage: 20, done: false },
    { label: 'Finish one past-year paper', damage: 30, done: false },
    { label: 'Complete mock test', damage: 30, done: false },
  ],
  defeatedAt: null,
};

export const demoReflections: Reflection[] = [
  {
    reflectionId: 'r-1', userId: DEMO_USER_ID, weekStart: inDays(-7).slice(0, 10),
    completedTasks: 'Finished the subnetting set and the peer review. Started the Dijkstra assignment.',
    delays: 'Lost Tuesday and Wednesday to the Team5 sprint meeting overrun.',
    focusModule: 'SC2001', stressLevel: 4,
    nextWeekChange: 'Block two evenings for SC2001 before touching group work.',
    aiSummary: {
      mainAchievement: 'Cleared two smaller tasks early and kept a 9-day streak alive.',
      mainProblem: 'Group work absorbed the midweek evenings that were meant for SC2001.',
      studyPattern: 'Most sessions land after 8pm, longest blocks on weekends.',
      suggestedImprovement: 'Cap team meetings at one evening and protect Tuesday for algorithms.',
      recommendedFocusModule: 'SC2001',
    },
  },
];

export const demoNotifications: Notification[] = [
  { notificationId: 'n-1', userId: DEMO_USER_ID, title: 'Deadline clash ahead', message: 'Two tasks land within 36 hours in 3 days. Start the lab report early.', type: 'warning', read: false, createdAt: inDays(0, 8) },
  { notificationId: 'n-2', userId: DEMO_USER_ID, title: 'Freeze token earned', message: 'Seven-day streak reached. One token stored.', type: 'success', read: true, createdAt: inDays(-2, 9) },
  { notificationId: 'n-3', userId: DEMO_USER_ID, title: 'Boss weakened', message: 'SC2001 Final dropped to 85% health.', type: 'info', read: true, createdAt: inDays(-3, 16) },
];

export const demoUnlockedBadgeIds = ['b1', 'b2', 'b4'];
