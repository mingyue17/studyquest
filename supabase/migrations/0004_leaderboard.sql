-- ============================================================
-- StudyQuest — migration 0004: global leaderboard
--
-- The `users` table's RLS policy only lets each student see their own
-- row — correct for privacy, but it means a normal SELECT can't build a
-- cross-student leaderboard. Rather than loosen RLS (which would expose
-- email addresses too), this adds a SECURITY DEFINER function that
-- returns only the fields safe to rank publicly: name, XP, level, rank,
-- streak. No email, no userId beyond what's needed to highlight "you".
-- ============================================================

create or replace function public.get_leaderboard(limit_count int default 50)
returns table (
  "userId" uuid,
  "name" text,
  "totalXp" integer,
  "currentLevel" integer,
  "currentRank" text,
  "currentStreak" integer
)
language sql
security definer
set search_path = public
as $$
  select "userId", "name", "totalXp", "currentLevel", "currentRank", "currentStreak"
  from users
  order by "totalXp" desc
  limit limit_count;
$$;

grant execute on function public.get_leaderboard(int) to authenticated;
