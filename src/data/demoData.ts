/**
 * Seed data for the offline demo — Adam, Year 2 Diploma in Applied AI &
 * Analytics (DAAA), School of Infocomm, Republic Polytechnic. Dates are
 * generated relative to "now" so the dashboard always looks alive — clashes,
 * overdue work and the final assessment stay in the right place no matter
 * when the app is opened.
 */
import type {
  BossBattle, ChecklistItem, Grade, Module, Notification, Pet, PetUnlock, Reflection,
  StreakRecord, StudySession, Task, Team, TeamMember, TeamTask, User,
} from '@/types';
import { calculatePriorityScore } from '@/lib/priority';
import { toDateKey } from '@/lib/streaks';
import { colorForName } from '@/lib/team';

const DEMO_USER_ID = '11111111-1111-1111-1111-111111111111';

const inDays = (days: number, hour = 23, minute = 59) => {
  const d = new Date();
  d.setDate(d.getDate() + days);
  d.setHours(hour, minute, 0, 0);
  return d.toISOString();
};

export const demoUser: User = {
  userId: DEMO_USER_ID,
  name: 'Adam',
  email: 'adam@myrp.edu.sg',
  totalXp: 3120,          // → level 7, Baby stage pet
  currentLevel: 7,
  currentRank: 'Scholar',
  currentStreak: 9,
  freezeTokens: 1,
  lastActiveDate: toDateKey(new Date()),
  selectedPetId: 'pet-baby',
};

export const demoModules: Module[] = [
  { moduleId: 'm-c240', userId: DEMO_USER_ID, moduleCode: 'C240', moduleName: 'AI Essentials and Innovations', moduleCredits: 4, currentGrade: 'B+', isWeak: false },
  { moduleId: 'm-c245', userId: DEMO_USER_ID, moduleCode: 'C245', moduleName: 'Data Analytics with GenAI', moduleCredits: 3, currentGrade: 'A', isWeak: false },
  { moduleId: 'm-c207', userId: DEMO_USER_ID, moduleCode: 'C207', moduleName: 'Database Systems', moduleCredits: 3, currentGrade: 'B', isWeak: true },
  { moduleId: 'm-c230', userId: DEMO_USER_ID, moduleCode: 'C230', moduleName: 'Data Wrangling and Automation', moduleCredits: 4, currentGrade: 'B+', isWeak: true },
  { moduleId: 'm-c206', userId: DEMO_USER_ID, moduleCode: 'C206', moduleName: 'Software Development Process', moduleCredits: 3, currentGrade: 'A', isWeak: false },
];

type RawTask = Omit<Task, 'userId' | 'parentTaskId' | 'priorityScore'>;

const rawTasks: RawTask[] = [
  // --- the clash: two heavy pieces landing on the same evening ---
  { taskId: 't-1', moduleId: 'm-c240', title: 'C240 AI Innovation Prototype Demo', source: 'SNAPP', deadline: inDays(3), status: 'In Progress', difficulty: 5, xpReward: 80, isFinal: false, estimatedHours: 12, weightage: 30, progress: 30, taskType: 'Practical Assessment', isGroupTask: true },
  { taskId: 't-2', moduleId: 'm-c230', title: 'C230 Data Cleaning Workflow', source: 'PoliteMall', deadline: inDays(3, 18), status: 'To Do', difficulty: 3, xpReward: 80, isFinal: false, estimatedHours: 8, weightage: 20, progress: 0, taskType: 'Continuous Assessment', isGroupTask: false },

  // --- the final assessments (RP's term for end-of-module exams/capstones) ---
  { taskId: 't-3', moduleId: 'm-c245', title: 'C245 Data Analytics Dashboard — Final Assessment', source: 'SNAPP', deadline: inDays(24, 9), status: 'To Do', difficulty: 5, xpReward: 300, isFinal: true, estimatedHours: 26, weightage: 50, progress: 15, taskType: 'Final Assessment', isGroupTask: false },
  { taskId: 't-10', moduleId: 'm-c207', title: 'C207 Database Systems — Final Assessment', source: 'SNAPP', deadline: inDays(27, 9), status: 'To Do', difficulty: 4, xpReward: 300, isFinal: true, estimatedHours: 18, weightage: 45, progress: 0, taskType: 'Final Assessment', isGroupTask: false },

  { taskId: 't-4', moduleId: 'm-c240', title: 'ByteBuilders Sprint 2 — StudyQuest Demo', source: 'Teams', deadline: inDays(6), status: 'In Progress', difficulty: 4, xpReward: 80, isFinal: false, estimatedHours: 10, weightage: 25, progress: 45, taskType: 'Team Project', isGroupTask: true },
  { taskId: 't-5', moduleId: 'm-c207', title: 'C207 Database Normalisation Quiz', source: 'PoliteMall', deadline: inDays(1, 20), status: 'To Do', difficulty: 2, xpReward: 30, isFinal: false, estimatedHours: 2, weightage: 10, progress: 0, taskType: 'Continuous Assessment', isGroupTask: false },
  { taskId: 't-6', moduleId: 'm-c206', title: 'C206 Sprint Review and Reflection', source: 'PoliteMall', deadline: inDays(9), status: 'To Do', difficulty: 2, xpReward: 80, isFinal: false, estimatedHours: 4, weightage: 15, progress: 0, taskType: 'Reflection', isGroupTask: false },
  { taskId: 't-7', moduleId: 'm-c206', title: 'Read Ch.7 — Agile Sprint Planning', source: 'Teams', deadline: inDays(2, 22), status: 'To Do', difficulty: 1, xpReward: 30, isFinal: false, estimatedHours: 1.5, weightage: 0, progress: 0, taskType: 'Reading', isGroupTask: false },
  { taskId: 't-8', moduleId: 'm-c206', title: 'Requirements Doc Peer Review', source: 'Teams', deadline: inDays(-1, 17), status: 'Submitted', difficulty: 2, xpReward: 30, isFinal: false, estimatedHours: 2, weightage: 5, progress: 100, taskType: 'Continuous Assessment', isGroupTask: true, completedAt: inDays(-2) },
  { taskId: 't-9', moduleId: 'm-c230', title: 'Data Wrangling Practice Set', source: 'SNAPP', deadline: inDays(-4, 23), status: 'Submitted', difficulty: 2, xpReward: 30, isFinal: false, estimatedHours: 2, weightage: 5, progress: 100, taskType: 'Continuous Assessment', isGroupTask: false, completedAt: inDays(-5) },
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

// Past grades from Year 1 modules — kept generic/plausible for a DAAA Y1 transcript.
export const demoGrades: Grade[] = [
  { gradeId: 'g-1', userId: DEMO_USER_ID, moduleId: null, moduleCode: 'C102', grade: 'B+', moduleCredits: 3, semester: 'Y1S1' },
  { gradeId: 'g-2', userId: DEMO_USER_ID, moduleId: null, moduleCode: 'C104', grade: 'A', moduleCredits: 3, semester: 'Y1S1' },
  { gradeId: 'g-3', userId: DEMO_USER_ID, moduleId: null, moduleCode: 'C110', grade: 'B', moduleCredits: 4, semester: 'Y1S1' },
  { gradeId: 'g-4', userId: DEMO_USER_ID, moduleId: null, moduleCode: 'C120', grade: 'A', moduleCredits: 3, semester: 'Y1S2' },
  { gradeId: 'g-5', userId: DEMO_USER_ID, moduleId: null, moduleCode: 'C125', grade: 'B+', moduleCredits: 3, semester: 'Y1S2' },
  { gradeId: 'g-6', userId: DEMO_USER_ID, moduleId: null, moduleCode: 'C130', grade: 'A', moduleCredits: 2, semester: 'Y1S2' },
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
  teamId: 'team-bytebuilders', teamName: 'ByteBuilders', totalXp: 1840, currentLevel: 5, currentStreak: 4,
};

const member = (id: string, displayName: string, role: string, userId: string | null = null): TeamMember => ({
  teamMemberId: id, teamId: 'team-bytebuilders', userId, displayName, role, avatarColor: colorForName(displayName),
});

export const demoTeamMembers: TeamMember[] = [
  member('tm-1', 'Adam', 'Data Lead', DEMO_USER_ID),
  member('tm-2', 'Firdaus', 'Solution Lead'),
  member('tm-3', 'Kai Xin', 'Comms Lead'),
  member('tm-4', 'Rayyan', 'Media Lead'),
  member('tm-5', 'Vanessa', 'QA Lead'),
];

const checklist = (labels: [string, boolean][]): ChecklistItem[] =>
  labels.map(([label, done], i) => ({ itemId: `ci-${label.slice(0, 4)}-${i}`, label, done }));

export const demoTeamTasks: TeamTask[] = [
  { teamTaskId: 'tt-1', teamId: 'team-bytebuilders', assignedUserId: 'tm-1', title: 'Clean StudyQuest usage dataset', status: 'Merged', deadline: inDays(-3), xpReward: 40, blocker: null, checklist: checklist([['Export raw logs', true], ['Remove duplicate sessions', true]]) },
  { teamTaskId: 'tt-2', teamId: 'team-bytebuilders', assignedUserId: 'tm-2', title: 'Build XP calculation module', status: 'In Progress', deadline: inDays(4), xpReward: 40, blocker: null, checklist: checklist([['Draft award logic', true], ['Write unit tests', false]]) },
  { teamTaskId: 'tt-3', teamId: 'team-bytebuilders', assignedUserId: 'tm-5', title: 'Write test harness', status: 'Review', deadline: inDays(2), xpReward: 40, blocker: 'Waiting on XP module API shape', checklist: checklist([['Set up test runner', true], ['Cover XP edge cases', false]]) },
  { teamTaskId: 'tt-4', teamId: 'team-bytebuilders', assignedUserId: 'tm-3', title: 'Draft AI Innovation Prototype script', status: 'Backlog', deadline: inDays(6), xpReward: 40, blocker: null, checklist: checklist([['Outline demo flow', false]]) },
  { teamTaskId: 'tt-5', teamId: 'team-bytebuilders', assignedUserId: 'tm-4', title: 'Record demo video', status: 'Backlog', deadline: inDays(6), xpReward: 40, blocker: null, checklist: checklist([['Storyboard shots', false]]) },
  { teamTaskId: 'tt-6', teamId: 'team-bytebuilders', assignedUserId: 'tm-1', title: 'Feature engineering notebook', status: 'In Progress', deadline: inDays(5), xpReward: 40, blocker: null, checklist: checklist([['Load cleaned dataset', true], ['Engineer streak features', false]]) },
  { teamTaskId: 'tt-7', teamId: 'team-bytebuilders', assignedUserId: 'tm-1', title: 'Data dictionary', status: 'Backlog', deadline: inDays(7), xpReward: 40, blocker: null, checklist: checklist([['List all tables', false]]) },
];

export const demoBoss: BossBattle = {
  bossId: 'boss-1',
  userId: DEMO_USER_ID,
  taskId: 't-3',
  bossName: 'C245 Final Assessment',
  health: 85,
  xpReward: 300,
  checklist: [
    { label: 'Review all lecture material', damage: 20, done: true },
    { label: 'Complete tutorial practice', damage: 20, done: false },
    { label: 'Finish one past-year paper', damage: 30, done: false },
    { label: 'Complete mock assessment', damage: 30, done: false },
  ],
  defeatedAt: null,
};

export const demoReflections: Reflection[] = [
  {
    reflectionId: 'r-1', userId: DEMO_USER_ID, weekStart: inDays(-7).slice(0, 10),
    completedTasks: 'Finished the data wrangling practice set and the peer review. Started the C240 prototype demo.',
    delays: 'Lost Tuesday and Wednesday to the ByteBuilders sprint meeting overrun.',
    focusModule: 'C240', stressLevel: 4,
    nextWeekChange: 'Block two evenings for C240 before touching team project work.',
    aiSummary: {
      mainAchievement: 'Cleared two smaller tasks early and kept a 9-day streak alive.',
      mainProblem: 'Team project work absorbed the midweek evenings meant for C240.',
      studyPattern: 'Most sessions land after 8pm, longest blocks on weekends.',
      suggestedImprovement: 'Cap team meetings at one evening and protect Tuesday for C240.',
      recommendedFocusModule: 'C240',
    },
  },
];

export const demoNotifications: Notification[] = [
  { notificationId: 'n-1', userId: DEMO_USER_ID, title: 'Deadline clash ahead', message: 'Two tasks land within 36 hours in 3 days. Start the C230 workflow early.', type: 'warning', read: false, createdAt: inDays(0, 8) },
  { notificationId: 'n-2', userId: DEMO_USER_ID, title: 'Freeze token earned', message: 'Seven-day streak reached. One token stored.', type: 'success', read: true, createdAt: inDays(-2, 9) },
  { notificationId: 'n-3', userId: DEMO_USER_ID, title: 'Boss weakened', message: 'C245 Final Assessment dropped to 85% health.', type: 'info', read: true, createdAt: inDays(-3, 16) },
];

export const demoUnlockedBadgeIds = ['b1', 'b2', 'b4'];
