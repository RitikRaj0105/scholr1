# Dashboard v2 + Study Planner

Adds a rich dashboard with 8 widgets and a full Study Planner page.

## What's inside

**Backend (new):**
- `Task` model + `TaskStatus`/`TaskPriority` enums (schema change)
- `planner.controller.ts` — Tasks CRUD, Mood log, Upcoming exams, Daily quote
- `planner.routes.ts` — mounted at `/api/planner`

**Frontend (new):**
- `pages/dashboard/Dashboard.tsx` — REBUILT — rich overview with 8 widgets
- `pages/dashboard/Planner.tsx` — NEW — week-view study planner
- `components/dashboard/widgets/` — 8 new widget components
- `App.tsx` — adds `/dashboard/planner` route
- `DashboardLayout.tsx` — adds "Planner" sidebar item

## Dashboard widgets

1. **Welcome Header** — personalized greeting, streak, daily progress bar, rotating quote, XP
2. **Today's Tasks** — real CRUD with optimistic toggle, inline add form, priority badges
3. **Upcoming Exams** — derived from exams with `startsAt` set, days-left countdown
4. **Weak Areas** — derived from your exam attempts, shows lowest mastery types
5. **AI Focus Session** — recommended session card (static suggestion v1)
6. **Mood Check-in** — emoji-based 5-level mood log, saves to DB, persists for the day
7. **Career Insight** — static "AI/ML Engineer" recommendation (will be AI-driven later)
8. **Life Skill of Day** — rotates daily, static curated list

## Study Planner page (/dashboard/planner)

- Week strip with completion stats per day
- Selected day shows all tasks
- Add task inline (title + subject + priority + duration)
- Toggle/delete tasks with optimistic updates
- Right column: day stats, planner tips, weekly progress

---

## Install

### 1. Extract zip into project

```powershell
Expand-Archive C:\Users\rraj8\Downloads\scholr-dashboard-v2.zip -DestinationPath C:\Users\rraj8\scholr -Force
```

### 2. Push schema change (adds Task table)

```powershell
cd C:\Users\rraj8\scholr\backend
npx prisma db push
```

You should see "Your database is now in sync with your Prisma schema."

### 3. Restart backend

In your backend window: Ctrl+C → `npm run dev`

### 4. Frontend hot-reloads automatically

If not, restart it: Ctrl+C in frontend window → `npm run dev`

### 5. Refresh browser

Open http://localhost:5173/dashboard. You should see the new rich dashboard.

---

## What to try

- Click "Add task" on Today's Tasks — type a title, hit Add
- Click the empty circle to mark it done — watch it cross out
- Click **Planner** in sidebar — see week view
- Pick a different day, add a task there
- Check the mood widget — log how you feel, it persists
- Numbers in Welcome Header should reflect your real focus minutes / streak

---

## Notes on what's still "static" vs real

| Widget | State |
|---|---|
| Welcome Header | ✅ Fully real (focus stats, streak, daily quote) |
| Today's Tasks | ✅ Fully real (CRUD) |
| Upcoming Exams | ✅ Real but empty unless exams have `startsAt` date |
| Weak Areas | ✅ Real, empty until you take a few tests |
| Mood Check-in | ✅ Fully real (logs to MoodLog table) |
| AI Focus Session | 🟡 Static suggestion — would later derive from your data |
| Career Insight | 🟡 Static "AI/ML Engineer" — would later be AI-driven |
| Life Skill | 🟡 Static rotating list — would later be a real lesson library |

The "static" ones look real but don't reflect your data yet. That's intentional v1 scope — wire them up to data sources later.
