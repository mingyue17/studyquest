-- ============================================================
-- StudyQuest — migration 0003: fix broken permissions + missing column
--
-- If you ran `drop schema public cascade; create schema public;` at any
-- point, Supabase's default grants for the anon/authenticated roles were
-- wiped along with the tables and never came back — that's the
-- "permission denied for schema public" errors. This restores them.
--
-- Also adds modules."isWeak", which was missing from schema.sql entirely
-- (the app always sends it, so every modules upsert was failing with
-- "Could not find the 'isWeak' column").
-- ============================================================

-- ---- restore default access (safe to re-run) ----
grant usage on schema public to anon, authenticated, service_role;
grant all on all tables in schema public to anon, authenticated, service_role;
grant all on all sequences in schema public to anon, authenticated, service_role;
grant all on all routines in schema public to anon, authenticated, service_role;
alter default privileges in schema public grant all on tables to anon, authenticated, service_role;
alter default privileges in schema public grant all on sequences to anon, authenticated, service_role;
alter default privileges in schema public grant all on routines to anon, authenticated, service_role;

-- ---- missing column ----
alter table modules add column if not exists "isWeak" boolean not null default false;

-- ---- make PostgREST pick up the change immediately instead of within ~60s ----
notify pgrst, 'reload schema';
