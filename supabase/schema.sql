-- ============================================================
-- StudyQuest — Supabase schema
-- Column names are quoted camelCase so the TypeScript types and
-- the database rows share one vocabulary (no snake_case mapping layer).
-- Run this in Supabase Studio → SQL Editor, then run seed.sql.
-- ============================================================

create extension if not exists "pgcrypto";

-- ---------- core ----------

create table if not exists users (
  "userId"        uuid primary key default gen_random_uuid(),
  "name"          text not null,
  "email"         text unique not null,
  "totalXp"       integer not null default 0,
  "currentLevel"  integer not null default 1,
  "currentRank"   text    not null default 'Rookie',
  "currentStreak" integer not null default 0,
  "freezeTokens"  integer not null default 0 check ("freezeTokens" between 0 and 2),
  "lastActiveDate" date,
  "selectedPetId" uuid,
  "targetGpa"     numeric(3,2) not null default 3.70,
  "createdAt"     timestamptz not null default now()
);

create table if not exists modules (
  "moduleId"      uuid primary key default gen_random_uuid(),
  "userId"        uuid not null references users("userId") on delete cascade,
  "moduleCode"    text not null,
  "moduleName"    text not null,
  "moduleCredits" numeric(3,1) not null default 3,
  "currentGrade"  text,
  "isWeak"        boolean not null default false
);
create index if not exists modules_user_idx on modules("userId");

-- source: 'SNAPP' | 'PoliteMall' | 'Teams' | 'Manual'
-- status: 'To Do' | 'In Progress' | 'Submitted'
create table if not exists tasks (
  "taskId"         uuid primary key default gen_random_uuid(),
  "userId"         uuid not null references users("userId") on delete cascade,
  "moduleId"       uuid references modules("moduleId") on delete set null,
  "parentTaskId"   uuid references tasks("taskId") on delete cascade, -- subquests
  "title"          text not null,
  "source"         text not null default 'Manual',
  "deadline"       timestamptz not null,
  "status"         text not null default 'To Do',
  "priorityScore"  numeric(6,2) not null default 0,
  "difficulty"     integer not null default 2 check ("difficulty" between 1 and 5),
  "xpReward"       integer not null default 30,
  "isFinal"        boolean not null default false,
  "estimatedHours" numeric(5,1) not null default 2,
  "weightage"      numeric(5,2) not null default 10,
  "progress"       integer not null default 0 check ("progress" between 0 and 100),
  "taskType"       text not null default 'Assignment',
  "isGroupTask"    boolean not null default false,
  "createdAt"      timestamptz not null default now(),
  "completedAt"    timestamptz
);
create index if not exists tasks_user_deadline_idx on tasks("userId", "deadline");
create index if not exists tasks_parent_idx on tasks("parentTaskId");

create table if not exists "studySessions" (
  "sessionId"       uuid primary key default gen_random_uuid(),
  "userId"          uuid not null references users("userId") on delete cascade,
  "taskId"          uuid references tasks("taskId") on delete set null,
  "durationMinutes" integer not null default 30,
  "scheduledStart"  timestamptz,
  "completedAt"     timestamptz,
  "xpEarned"        integer not null default 0
);
create index if not exists sessions_user_idx on "studySessions"("userId", "completedAt");

create table if not exists grades (
  "gradeId"       uuid primary key default gen_random_uuid(),
  "userId"        uuid not null references users("userId") on delete cascade,
  "moduleId"      uuid references modules("moduleId") on delete set null,
  "grade"         text not null,
  "moduleCredits" numeric(3,1) not null default 3,
  "semester"      text not null
);

-- ---------- gamification ----------

create table if not exists badges (
  "badgeId"       uuid primary key default gen_random_uuid(),
  "badgeName"     text unique not null,
  "description"   text not null,
  "conditionType" text not null,   -- e.g. 'streakDays', 'tasksCompleted', 'earlySubmissions'
  "conditionValue" numeric not null,
  "icon"          text not null
);

create table if not exists "userBadges" (
  "userId"     uuid not null references users("userId") on delete cascade,
  "badgeId"    uuid not null references badges("badgeId") on delete cascade,
  "unlockedAt" timestamptz not null default now(),
  primary key ("userId", "badgeId")
);

create table if not exists "xpTransactions" (
  "transactionId" uuid primary key default gen_random_uuid(),
  "userId"        uuid not null references users("userId") on delete cascade,
  "activityType"  text not null,
  "xpAmount"      integer not null check ("xpAmount" >= 0), -- XP is never deducted
  "referenceId"   uuid,
  "createdAt"     timestamptz not null default now()
);
create index if not exists xp_user_idx on "xpTransactions"("userId", "createdAt");

create table if not exists "streakRecords" (
  "streakRecordId" uuid primary key default gen_random_uuid(),
  "userId"     uuid not null references users("userId") on delete cascade,
  "streakDate" date not null,
  "completed"  boolean not null default false,
  "freezeUsed" boolean not null default false,
  unique ("userId", "streakDate")
);

create table if not exists pets (
  "petId"         uuid primary key default gen_random_uuid(),
  "petName"       text not null,
  "stage"         text not null,  -- Egg | Baby | Young | Teen | Adult | Legendary
  "requiredLevel" integer not null default 1,
  "imagePath"     text,
  "animationType" text not null default 'idle'
);

create table if not exists "petUnlocks" (
  "unlockId"   uuid primary key default gen_random_uuid(),
  "userId"     uuid not null references users("userId") on delete cascade,
  "petId"      uuid references pets("petId") on delete set null,
  "itemType"   text not null,  -- hat | outfit | desk | roomTheme | frame | animation | legendaryForm
  "itemName"   text not null,
  "equipped"   boolean not null default false,
  "unlockedAt" timestamptz not null default now()
);

-- ---------- team ----------

create table if not exists teams (
  "teamId"        uuid primary key default gen_random_uuid(),
  "teamName"      text not null,
  "totalXp"       integer not null default 0,
  "currentLevel"  integer not null default 1,
  "currentStreak" integer not null default 0
);

create table if not exists "teamMembers" (
  "teamMemberId" uuid primary key default gen_random_uuid(),
  "teamId"       uuid not null references teams("teamId") on delete cascade,
  "userId"       uuid references users("userId") on delete cascade,
  "displayName"  text not null,
  "role"         text not null,
  "avatarColor"  text not null default '#22e0ff' -- deterministic accent for the initials avatar
);

-- status: 'Backlog' | 'In Progress' | 'Review' | 'Merged'
create table if not exists "teamTasks" (
  "teamTaskId"     uuid primary key default gen_random_uuid(),
  "teamId"         uuid not null references teams("teamId") on delete cascade,
  "assignedUserId" uuid references "teamMembers"("teamMemberId") on delete set null,
  "title"          text not null,
  "status"         text not null default 'Backlog',
  "deadline"       timestamptz,
  "xpReward"       integer not null default 40,
  "blocker"        text,
  "checklist"      jsonb not null default '[]'::jsonb -- [{ itemId, label, done }]
);

-- ---------- reflection, notifications, imports ----------

create table if not exists reflections (
  "reflectionId"   uuid primary key default gen_random_uuid(),
  "userId"         uuid not null references users("userId") on delete cascade,
  "weekStart"      date not null,
  "completedTasks" text,
  "delays"         text,
  "focusModule"    text,
  "stressLevel"    integer check ("stressLevel" between 1 and 5),
  "nextWeekChange" text,
  "aiSummary"      jsonb,
  unique ("userId", "weekStart")
);

create table if not exists notifications (
  "notificationId" uuid primary key default gen_random_uuid(),
  "userId"    uuid not null references users("userId") on delete cascade,
  "title"     text not null,
  "message"   text not null,
  "type"      text not null default 'info',
  "read"      boolean not null default false,
  "createdAt" timestamptz not null default now()
);

create table if not exists "platformImports" (
  "importId"       uuid primary key default gen_random_uuid(),
  "userId"         uuid not null references users("userId") on delete cascade,
  "sourcePlatform" text not null,
  "externalTaskId" text not null,
  "rawData"        jsonb not null,
  "importedAt"     timestamptz not null default now(),
  unique ("sourcePlatform", "externalTaskId")
);

-- ---------- boss battles (major projects & finals) ----------

create table if not exists "bossBattles" (
  "bossId"      uuid primary key default gen_random_uuid(),
  "userId"      uuid not null references users("userId") on delete cascade,
  "taskId"      uuid references tasks("taskId") on delete cascade,
  "bossName"    text not null,
  "health"      integer not null default 100 check ("health" between 0 and 100),
  "xpReward"    integer not null default 300,
  "checklist"   jsonb not null default '[]'::jsonb,
  "defeatedAt"  timestamptz
);

-- ---------- AI planner ----------

create table if not exists "plannerPreferences" (
  "userId"               uuid primary key references users("userId") on delete cascade,
  "availableHoursPerDay" jsonb not null default '[2,3,2,3,2,4,4]'::jsonb,
  "preferredStartHour"   integer not null default 20,
  "sessionMinutes"       integer not null default 60,
  "updatedAt"            timestamptz not null default now()
);

create table if not exists "plannedSessions" (
  "sessionId"       uuid primary key default gen_random_uuid(),
  "userId"          uuid not null references users("userId") on delete cascade,
  "taskId"          uuid references tasks("taskId") on delete cascade,
  "day"             integer not null check ("day" between 0 and 6), -- 0 = Monday
  "startHour"       integer not null,
  "durationMinutes" integer not null default 60,
  "completed"       boolean not null default false
);
create index if not exists planned_sessions_user_idx on "plannedSessions"("userId");

-- ---------- row level security ----------
-- Every user-scoped table is readable/writable only by its owner.

do $$
declare t text;
begin
  foreach t in array array[
    'users','modules','tasks','studySessions','grades','userBadges',
    'xpTransactions','streakRecords','petUnlocks','reflections',
    'notifications','platformImports','bossBattles',
    'plannerPreferences','plannedSessions'
  ] loop
    execute format('alter table %I enable row level security', t);
  end loop;
end $$;

create policy "own row" on users
  for all using (auth.uid() = "userId") with check (auth.uid() = "userId");

do $$
declare t text;
begin
  foreach t in array array[
    'modules','tasks','studySessions','grades','userBadges',
    'xpTransactions','streakRecords','petUnlocks','reflections',
    'notifications','platformImports','bossBattles',
    'plannerPreferences','plannedSessions'
  ] loop
    execute format(
      'create policy "own rows" on %I for all using (auth.uid() = "userId") with check (auth.uid() = "userId")', t);
  end loop;
end $$;

-- Reference tables are readable by everyone signed in.
alter table badges enable row level security;
alter table pets   enable row level security;
create policy "read badges" on badges for select using (auth.role() = 'authenticated');
create policy "read pets"   on pets   for select using (auth.role() = 'authenticated');

-- Team tables: visible to members of that team.
alter table teams enable row level security;
alter table "teamMembers" enable row level security;
alter table "teamTasks" enable row level security;

create policy "team visible to members" on teams for select using (
  exists (select 1 from "teamMembers" m where m."teamId" = teams."teamId" and m."userId" = auth.uid())
);
create policy "members visible to members" on "teamMembers" for select using (
  exists (select 1 from "teamMembers" m where m."teamId" = "teamMembers"."teamId" and m."userId" = auth.uid())
);
create policy "team tasks editable by members" on "teamTasks" for all using (
  exists (select 1 from "teamMembers" m where m."teamId" = "teamTasks"."teamId" and m."userId" = auth.uid())
);
