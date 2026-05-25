# Full Classroom + Light/Dark Theme — Delivery

Two big things in this delivery:

1. **Full classroom system** — students and teachers share one classroom hub. Each classroom has a Stream (announcements), Roster (with live attendance %), Attendance (mark with animated check pops), Materials (notes/videos/links), and Settings.
2. **Light + Dark theme toggle** — every page works in both modes. CSS variables drive everything so the switch is instant and smooth. Toggle in the top-right of every dashboard page.

All actions have purposeful animations — count-pulses when stats change, animated progress bars on attendance %, layout animations on the tab indicator, slide-stagger reveals for lists.

---

## Install

```powershell
Expand-Archive C:\Users\rraj8\Downloads\scholr-classroom-themes.zip -DestinationPath C:\Users\rraj8\scholr -Force
```

Push the schema (new models: ClassroomAnnouncement, ClassroomMaterial, AttendanceSession, AttendanceRecord):

```powershell
cd C:\Users\rraj8\scholr\backend
npx prisma db push
```

Restart backend:

```powershell
# Ctrl+C, then:
npm run dev
```

Frontend hot-reloads.

---

## What's new in the classroom

### Hub at `/dashboard/classroom`
- Two sections: "Teaching" (classrooms you run) and "Enrolled" (classrooms you're a student in)
- Each card shows the join code (teachers only), schedule, banner colour, student/material/post counts
- "Create classroom" button for teachers, "Join with code" for students — both as smooth modal flows
- Empty state with friendly CTA

### Classroom detail at `/dashboard/classroom/:id`
A coloured hero banner with the class name, schedule, join code (with copy button → animated checkmark), and a "Join meeting" link if the teacher set a Zoom/Meet URL.

Five tabs with an animated sliding indicator:

| Tab | What teachers can do | What students see |
|---|---|---|
| **Stream** | Post announcements (with pinning) | Read announcements, get notified |
| **Roster** | View students, see each student's attendance %, message or remove | View classmates, message them |
| **Attendance** | Mark Present/Absent/Late/Excused per session, bulk-mark all, animated counters, save bar | See their own attendance history |
| **Materials** | Add PDFs/videos/links/docs with type tags | Browse and click through |
| **Settings** | Edit details, regenerate code, archive, delete | (Hidden) |

### Animations everywhere

- **Tab switching** — animated underline pill that slides between tabs
- **Attendance marking** — each status button has a spring-pop when you tap it, the count card above updates with a pulse animation
- **Saving attendance** — the Save button morphs through "Save → Saving… → Saved!" with checkmark
- **Roster attendance bars** — fill from 0 to actual % with eased animation on first load
- **Cards** — stagger-fade-in based on index
- **Modals** — spring-scale entrance with backdrop blur
- **Copy code button** — Copy icon → Check icon with rotation when copied
- **Materials cards** — slide-in from left, scale-up on hover
- **Hero banner content** — text elements fade in with delays for a cinematic feel
- **Loading states** — shimmer cards instead of bare spinners

---

## Light/Dark theme

A **Sun/Moon toggle** sits in the top-right of every dashboard page (next to the bells). Click it — the entire UI smoothly transitions between dark and light. Preference saves to localStorage; refresh and it remembers.

### How it works

- A `themeStore` (Zustand + persist) holds the active theme and applies a `dark`/`light` class to `<html>`
- CSS variables in `index.css` define `--bg-base`, `--bg-card`, `--text-primary`, `--border-subtle`, etc. for both themes
- Utility classes like `t-card`, `t-text-primary`, `t-bg-base` use those variables — so any component using them auto-themes
- Color transitions are 300ms ease for a smooth feel, not a jarring flip

### Light mode palette
- Background: soft warm grey (`#f7f7f5`)
- Cards: pure white with subtle slate borders
- Text: deep slate (`#0f172a`) primary, mid slate secondary
- Accent: violet `#7c3aed` (slightly deeper than dark mode's `#8b5cf6` for better contrast on white)

### Dark mode palette (unchanged)
- Background: near-black (`#0a0a0f`)
- Cards: slightly lighter (`#18181f`)
- Text: bone-50/bone-200/bone-400
- Accent: violet `#8b5cf6`

---

## Test it

1. **Create a classroom** — log in as anyone → `/dashboard/classroom` → Create classroom → name it, pick a colour, save. You land on the detail page with the banner in your chosen colour.
2. **Copy the join code** — click the code in the hero → see the icon swap to a checkmark.
3. **Join from another account** — sign up as a different user → `/dashboard/classroom` → Join with code → paste it.
4. **Post an announcement** as the teacher — go to Stream tab → click the dashed prompt → write a title + content → optionally pin → post. Watch it slide in.
5. **Mark attendance** — Attendance tab → use the bulk "Mark all as Present" button (or click each student's status). Watch the count cards spring-update. Hit Save → button morphs through states.
6. **View attendance %** — Roster tab → each student now shows their attendance % with an animated bar.
7. **Add materials** — Materials tab → add a YouTube link or PDF URL → tag the type → save.
8. **Toggle theme** — click the sun/moon icon top-right. Whole UI smoothly switches. Toggle a few times — every panel and card updates.
9. **Customise** — Settings tab → change theme colour, schedule, meeting link → save. Hero banner updates instantly.

---

## Files

### Backend

| File | What |
|---|---|
| `prisma/schema.prisma` | Extended `Classroom` with `bannerColor`, `meetingLink`, `grade`, `schedule`, `archived`. Added `ClassroomAnnouncement`, `ClassroomMaterial`, `MaterialType` enum, `AttendanceSession`, `AttendanceRecord`, `AttendanceStatus` enum. |
| `src/controllers/classroom.controller.ts` | NEW — 21 endpoints covering all classroom features |
| `src/routes/classroom.routes.ts` | NEW |
| `src/routes/index.ts` | Mounts `/api/classroom` |

### Frontend

| File | What |
|---|---|
| `pages/dashboard/classroom/ClassroomHub.tsx` | NEW — list + create/join modals |
| `pages/dashboard/classroom/ClassroomDetail.tsx` | NEW — hero banner + tab system |
| `components/classroom/ClassroomStream.tsx` | NEW — announcements |
| `components/classroom/ClassroomRoster.tsx` | NEW — students + attendance % |
| `components/classroom/ClassroomAttendance.tsx` | NEW — mark + history |
| `components/classroom/ClassroomMaterials.tsx` | NEW — files/links library |
| `components/classroom/ClassroomSettings.tsx` | NEW — edit/archive/delete |
| `components/ThemeToggle.tsx` | NEW — animated sun/moon button |
| `store/themeStore.ts` | NEW — Zustand store with persistence |
| `styles/index.css` | Added CSS variables for both themes, animation keyframes, t-* utility classes |
| `components/dashboard/DashboardLayout.tsx` | Theme toggle added, theme-aware backgrounds |
| `main.tsx` | Imports themeStore so theme applies on first paint |
| `App.tsx` | Added classroom routes |

---

## API endpoints

```
GET    /api/classroom/my                            My classrooms (teacher + student)
POST   /api/classroom/join                          Join via code { code }
POST   /api/classroom                               Create classroom
GET    /api/classroom/:id                           Detail
PATCH  /api/classroom/:id                           Update
DELETE /api/classroom/:id                           Delete
POST   /api/classroom/:id/archive                   Archive/unarchive
POST   /api/classroom/:id/regenerate-code           New join code

GET    /api/classroom/:id/roster                    Student list
DELETE /api/classroom/:id/students/:userId          Remove student
POST   /api/classroom/:id/leave                     Leave (student)

GET    /api/classroom/:id/announcements             List
POST   /api/classroom/:id/announcements             Create
PATCH  /api/classroom/:id/announcements/:aid        Update
DELETE /api/classroom/:id/announcements/:aid        Delete

GET    /api/classroom/:id/materials                 List
POST   /api/classroom/:id/materials                 Add
DELETE /api/classroom/:id/materials/:mid            Remove

POST   /api/classroom/:id/attendance                Mark { date, topic?, records[] }
GET    /api/classroom/:id/attendance                Recent sessions
GET    /api/classroom/:id/attendance/stats          Per-student aggregate
```

---

## Notes

- The classroom system uses the same Classroom model from the old `/teacher/*` flow. Teachers' old classrooms are visible in the new hub automatically.
- The light theme is a thoughtful, complete palette — not just inverted dark mode. Borders are slate, not light grey; the accent is a touch deeper for legibility on white.
- All animations use Framer Motion's spring physics (not linear easing) so they feel responsive, not robotic.
- For students, the attendance tab shows their *own* records — they can't see other students' attendance.
- Announcements fire notifications to all enrolled students via the existing notification system (the bell icon in the topbar).
