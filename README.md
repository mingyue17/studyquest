# StudyQuest

An academic command centre for RP students. Deadlines from SNAPP, PoliteMall and
Microsoft Teams land in one queue, a planner turns them into a week that actually
fits, and a pixel pet grows as the work gets done.

---

## Architecture

```
studyquest/
├── supabase/
│   ├── schema.sql              # 18 tables + RLS policies (camelCase columns)
│   └── seed.sql                # SC2001/2005/2006/2008/CC0007 demo data
├── src/
│   ├── app/
│   │   ├── layout.tsx          # Root shell: fonts, nav, toast host
│   │   ├── globals.css         # Pixel theme, CRT scanlines, reduced-motion
│   │   ├── page.tsx            # Dashboard
│   │   ├── quests/page.tsx     # Unified task queue + boss battle
│   │   ├── planner/page.tsx    # AI Planner
│   │   ├── gpa/page.tsx        # GPA Goal
│   │   ├── team/page.tsx       # Team5_ECG Kanban
│   │   ├── reflection/page.tsx # Weekly diary + AI summary
│   │   ├── assistant/page.tsx  # Chat interface
│   │   └── profile/page.tsx    # Pet, cosmetics, badges
│   ├── components/
│   │   ├── Nav.tsx
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
│   │   ├── supabaseClient.ts   # Falls back to demo data when env vars are absent
│   │   └── formatters.ts
│   ├── store/useStore.ts       # Zustand store — runs the whole automation flow
│   ├── data/demoData.ts        # Offline seed, dates generated relative to today
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
vars blank and the app runs on the seeded data in `src/data/demoData.ts`.

### Connecting Supabase

1. Create a project at supabase.com.
2. SQL Editor → run `supabase/schema.sql`, then `supabase/seed.sql`.
3. Put your project URL and anon key into `.env.local`.
4. Restart the dev server. `isSupabaseConfigured` flips to `true` and the client is live.

In `seed.sql`, replace the `demoUser` UUID with the id from your own `auth.users` row so
the row-level security policies match.

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
