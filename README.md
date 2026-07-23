# StudyQuest

An academic command centre for RP students. Deadlines from SNAPP, PoliteMall and
Microsoft Teams land in one queue, a planner turns them into a week that actually
fits, and a pixel pet grows as the work gets done.

---

## Architecture

```
studyquest/
├── supabase/
│   ├── schema.sql              # Full schema + RLS policies (camelCase columns) — run this for a fresh project
│   ├── migrations/
│   │   └── 0002_auth_persistence.sql  # Same additions, for a project that already ran the old schema.sql
│   └── seed.sql                # C240/C245/C207/C230/C206 demo data (Adam, DAAA Y2)
├── src/
│   ├── app/
│   │   ├── layout.tsx          # Root shell: fonts, auth gate, nav, toast host
│   │   ├── globals.css         # Pixel theme (light/dark via CSS vars), CRT scanlines, reduced-motion
│   │   ├── page.tsx            # Dashboard
│   │   ├── quests/page.tsx     # Unified task queue + boss battle
│   │   ├── planner/page.tsx    # AI Planner
│   │   ├── gpa/page.tsx        # GPA Goal
│   │   ├── team/page.tsx       # ByteBuilders Kanban (C240 team project)
│   │   ├── reflection/page.tsx # Weekly diary + AI summary
│   │   ├── assistant/page.tsx  # Chat interface
│   │   └── profile/page.tsx    # Pet, cosmetics, badges
│   ├── components/
│   │   ├── Nav.tsx
│   │   ├── AuthProvider.tsx    # Tracks the Supabase session, triggers store hydration
│   │   ├── AuthGate.tsx        # Shows sign in/up when configured + signed out; else passes through
│   │   ├── ThemeToggle.tsx     # Light/dark switch
│   │   ├── ui/                 # PixelPanel, PixelButton, ProgressBar, StatTile, Toasts
│   │   ├── dashboard/          # StudyCalendar, StudyTimeChart
│   │   ├── quests/
│   │   └── pet/PetDisplay.tsx  # SVG pixel pet, one grid per evolution stage
│   ├── lib/
│   │   ├── gamification.ts     # awardXp, calculateLevel, calculateRank, determinePetStage
│   │   ├── streaks.ts          # updateStreak, useFreezeToken, buildStudyCalendar
│   │   ├── priority.ts         # calculatePriorityScore, detectDeadlineClashes, generateSubquests
│   │   ├── quests.ts           # generateDailyQuests, checkBadgeUnlocks, badge definitions
│   │   ├── gpa.ts              # calculateCgpa, requiredSemesterGpa, projectCgpa
│   │   ├── planner.ts          # generateWeeklySchedule, detectOverloadedDays, recommendTonight
│   │   ├── assistant.ts        # Rule-based answers behind one swappable function
│   │   ├── auth.ts             # signUp / signIn / signOut wrappers
│   │   ├── sync.ts             # Supabase read/write layer — what's synced and what isn't
│   │   ├── supabaseClient.ts   # Falls back to demo data when env vars are absent
│   │   └── formatters.ts
│   ├── store/useStore.ts       # Zustand store — automation flow + auth-backed persistence
│   ├── data/demoData.ts        # Offline seed / new-account starter data, dates generated relative to today
│   └── types/index.ts          # One vocabulary shared by TS and Postgres
```

### The automation flow

Every XP-earning action funnels through `applyXp` in `src/store/useStore.ts`, which
runs steps 8–12 of the spec in one pass:

```
import task → calculatePriorityScore → detectDeadlineClashes → generateSubquests
  → generateWeeklySchedule → notification
  → awardXp → checkBadgeUnlocks → updateStreak → calculateLevel → determinePetStage
```

Because it is one function, a level-up, a badge unlock and a pet evolution can never
get out of sync with the XP that caused them.

### Design decisions worth knowing

- **XP is append-only.** `awardXp` clamps to `Math.max(0, …)` and the `xpTransactions`
  table has a `check ("xpAmount" >= 0)` constraint. Nothing earned can be removed.
- **The pet is drawn, not downloaded.** Each stage is a 6×6 character grid rendered as
  SVG rects with `shapeRendering="crispEdges"`. No image 404s, scales cleanly, and the
  pet has no health stat to lose — the worst state is `worried`.
- **camelCase all the way down.** Postgres columns are quoted camelCase so a row and a
  TypeScript object are the same shape. No mapping layer.
- **Readable body text.** Press Start 2P is used only for headings, stats and buttons;
  Inter carries anything longer than a few words. An 8-bit face on a lab report title
  is a legibility problem, not a style choice.

---

## Setup

```bash
npm install
cp .env.example .env.local
npm run dev
```

Open http://localhost:3000. **It works immediately with no database** — leave the env
vars blank and the app runs on the seeded data in `src/data/demoData.ts`, same as before,
no login required.

### Connecting Supabase (real accounts + persistence)

1. Create a project at supabase.com.
2. Enable Email auth: Authentication → Providers → Email (on by default). Decide whether
   you want "Confirm email" on — with it on, `signUp` returns `needsEmailConfirmation`
   and the app tells the user to check their inbox before signing in.
3. SQL Editor → run `supabase/schema.sql` (fresh project) — this already includes the
   `targetGpa` column and the `plannerPreferences` / `plannedSessions` tables. If you
   already ran an older `schema.sql` before those existed, run
   `supabase/migrations/0002_auth_persistence.sql` instead to add just the new bits.
4. Optionally run `supabase/seed.sql` if you want one fixed demo account to poke at —
   not required for real sign-ups, see below.
5. Put your project URL and anon key into `.env.local`, restart the dev server.

Once configured, opening the app shows a sign-in/sign-up screen (`AuthGate`). First
sign-up for an account gets a starter dataset — the same realistic DAAA Year 2 workload
the offline demo ships with — cloned to that account and saved for real, via
`bootstrapNewUser` in `src/lib/sync.ts`. From then on every change writes back to
Supabase (debounced, see the `useStore.subscribe` block at the bottom of `useStore.ts`).

**What's synced per account:** profile/XP/streak, modules, tasks, study sessions,
grades, streak history, cosmetic unlocks, reflections, notifications, boss battle,
planner preferences, planned sessions, target GPA.

**What's still local-only** (documented in `src/lib/sync.ts`, not silently missing):
- **Badges** — the client badge catalog (`lib/quests.ts`) uses ids like `"b1"`; the
  DB `badges` table uses real uuids. No mapping yet, so unlocks don't persist across
  sessions.
- **Team (ByteBuilders)** — shared across a team, and there's no invite flow yet, so
  writing it per-account isn't safe. Every account currently sees the same local team
  data.
- **Daily quests** — regenerate from tasks each day, nothing to persist.

`seed.sql` is for manually seeding one fixed demo account (replace the `demoUser` uuid
with a real `auth.users` id) — it's a convenience for testing, not what real sign-ups run.

### Connecting a real model to the AI Assistant

`answerQuestion(question, ctx)` in `src/lib/assistant.ts` is the only seam. Replace its
body with a `fetch('/api/assistant')` call that forwards the same `AssistantContext`
object to a model. Every caller keeps working unchanged.

---

## Build status

Shipped and working:

- Dashboard — study calendar, log button, streak, freeze tokens, XP bar, level and rank,
  pet, daily quests, closest deadlines, final countdown, clash warnings, weekly summary, chart
- Quests — unified queue, filters, search, sort, start/done/undo, subquest splitting,
  FINAL and CLASH tags, boss battle checklist
- All library logic, the full Supabase schema, and both seed sets

Next section: AI Planner, GPA Goal, Team, Reflection, Assistant and Profile pages. Every
one of them reads from the store and lib functions that already exist, so they are wiring
rather than new logic.
