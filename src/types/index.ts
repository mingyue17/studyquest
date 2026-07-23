// Domain types — mirror the Supabase column names exactly (camelCase, quoted in SQL).

export type SourcePlatform = 'SNAPP' | 'PoliteMall' | 'Teams' | 'Manual';
export type TaskStatus = 'To Do' | 'In Progress' | 'Submitted';
export type TeamTaskStatus = 'Backlog' | 'In Progress' | 'Review' | 'Merged';
export type PetStage = 'Egg' | 'Baby' | 'Young' | 'Teen' | 'Adult' | 'Legendary';
export type PetMood = 'idle' | 'happy' | 'celebrating' | 'sleeping' | 'worried' | 'evolving';

export type Rank =
  | 'Rookie' | 'Learner' | 'Scholar' | 'Strategist'
  | 'Academic Knight' | 'Master Planner' | 'Semester Champion';

export interface User {
  userId: string;
  name: string;
  email: string;
  totalXp: number;
  currentLevel: number;
  currentRank: Rank;
  currentStreak: number;
  freezeTokens: number;
  lastActiveDate: string | null;
  selectedPetId: string | null;
}

export interface Module {
  moduleId: string;
  userId: string;
  moduleCode: string;
  moduleName: string;
  moduleCredits: number; // RP "MC" — Modular Credits
  currentGrade: string | null;
  isWeak?: boolean; // flagged by the student, feeds the planner
}

export interface Task {
  taskId: string;
  userId: string;
  moduleId: string | null;
  parentTaskId: string | null;
  title: string;
  source: SourcePlatform;
  deadline: string;         // ISO
  status: TaskStatus;
  priorityScore: number;
  difficulty: number;       // 1–5
  xpReward: number;
  isFinal: boolean;
  estimatedHours: number;
  weightage: number;        // % of module grade
  progress: number;         // 0–100
  taskType: string;         // Assignment | Quiz | Lab | Project | Exam | Reading
  isGroupTask: boolean;
  completedAt?: string | null;
}

export interface StudySession {
  sessionId: string;
  userId: string;
  taskId: string | null;
  durationMinutes: number;
  scheduledStart: string | null;
  completedAt: string | null;
  xpEarned: number;
}

export interface Grade {
  gradeId: string;
  userId: string;
  moduleId: string | null;
  moduleCode: string;
  grade: string;
  moduleCredits: number;
  semester: string;
}

export interface Badge {
  badgeId: string;
  badgeName: string;
  description: string;
  conditionType: string;
  conditionValue: number;
  icon: string;
}

export interface XpTransaction {
  transactionId: string;
  userId: string;
  activityType: string;
  xpAmount: number;
  referenceId: string | null;
  createdAt: string;
}

export interface StreakRecord {
  streakRecordId: string;
  userId: string;
  streakDate: string; // yyyy-mm-dd
  completed: boolean;
  freezeUsed: boolean;
}

export interface Pet {
  petId: string;
  petName: string;
  stage: PetStage;
  requiredLevel: number;
  imagePath: string | null;
  animationType: string;
}

export interface PetUnlock {
  unlockId: string;
  userId: string;
  petId: string | null;
  itemType: 'hat' | 'outfit' | 'desk' | 'roomTheme' | 'frame' | 'animation' | 'legendaryForm';
  itemName: string;
  equipped: boolean;
  unlockedAt: string;
}

export interface Team {
  teamId: string;
  teamName: string;
  totalXp: number;
  currentLevel: number;
  currentStreak: number;
}

export interface TeamMember {
  teamMemberId: string;
  teamId: string;
  userId: string | null;
  displayName: string;
  role: string;
  avatarColor: string; // deterministic accent used for the AI-generated initials avatar
}

export interface ChecklistItem {
  itemId: string;
  label: string;
  done: boolean;
}

export interface TeamTask {
  teamTaskId: string;
  teamId: string;
  assignedUserId: string | null;
  title: string;
  status: TeamTaskStatus;
  deadline: string | null;
  xpReward: number;
  blocker: string | null;
  checklist: ChecklistItem[];
}

export interface ReflectionSummary {
  mainAchievement: string;
  mainProblem: string;
  studyPattern: string;
  suggestedImprovement: string;
  recommendedFocusModule: string;
}

export interface Reflection {
  reflectionId: string;
  userId: string;
  weekStart: string;
  completedTasks: string;
  delays: string;
  focusModule: string;
  stressLevel: number;
  nextWeekChange: string;
  aiSummary: ReflectionSummary | null;
}

export interface Notification {
  notificationId: string;
  userId: string;
  title: string;
  message: string;
  type: 'info' | 'warning' | 'success';
  read: boolean;
  createdAt: string;
}

export interface BossChecklistItem {
  label: string;
  damage: number;   // % of boss health removed
  done: boolean;
}

export interface BossBattle {
  bossId: string;
  userId: string;
  taskId: string | null;
  bossName: string;
  health: number;
  xpReward: number;
  checklist: BossChecklistItem[];
  defeatedAt: string | null;
}

export interface DailyQuest {
  questId: string;
  label: string;
  xpReward: number;
  done: boolean;
  kind: 'study' | 'urgentTask' | 'review';
}

export interface WeeklyQuest {
  questId: string;
  label: string;
  xpReward: number;
  progress: number; // 0–100
}

export interface PlannedSession {
  sessionId: string;
  taskId: string;
  title: string;
  moduleCode: string;
  day: number;          // 0 = Monday
  startHour: number;    // 24h
  durationMinutes: number;
  completed: boolean;
}

export interface DeadlineClash {
  date: string;
  taskIds: string[];
  titles: string[];
  totalHours: number;
}
