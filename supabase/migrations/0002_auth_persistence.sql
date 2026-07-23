-- ============================================================
-- StudyQuest — migration 0002: auth-backed persistence
-- Run this after schema.sql on an existing project. New projects
-- can just run the updated schema.sql, which already includes this.
--
-- Adds what was missing for real per-user accounts:
--  - users.targetGpa (the GPA Goal page had nowhere to save it)
--  - plannerPreferences (AI Planner settings)
--  - plannedSessions (the week schedule the planner generates/edits)
-- ============================================================

alter table users add column if not exists "targetGpa" numeric(3,2) not null default 3.70;

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

alter table "plannerPreferences" enable row level security;
alter table "plannedSessions" enable row level security;

create policy "own row" on "plannerPreferences"
  for all using (auth.uid() = "userId") with check (auth.uid() = "userId");
create policy "own rows" on "plannedSessions"
  for all using (auth.uid() = "userId") with check (auth.uid() = "userId");
