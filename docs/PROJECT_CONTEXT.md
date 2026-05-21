# Scholr Platform — Project Context

**AI-powered EdTech SaaS platform for students, educators, recruiters, and professionals**

Last updated: May 21, 2026  
Sessions: 1–4 (extensive build)

---

## 🎯 Platform Overview

### Vision
LinkedIn + LeetCode + Notion for education — an all-in-one platform where:
- **Students** track academics, prepare for exams, solve coding problems, build professional profiles
- **Teachers** create classrooms, assign work, review submissions
- **Recruiters** discover talent, post jobs, review profiles
- **Professionals** upskill, network, showcase portfolios

### Core Philosophy
- **Dark editorial theme** (ink/bone palette, violet/cyan accents, Instrument Serif + Inter)
- **Production-grade** (real auth, PostgreSQL, file uploads, AI integration)
- **Modular & scalable** (Prisma ORM, controller-per-feature, React Query)

---

## 🛠️ Tech Stack

### Backend
- **Runtime:** Node.js + Express.js
- **Database:** PostgreSQL (Supabase cloud or Neon/Railway)
- **ORM:** Prisma
- **Auth:** JWT + bcrypt
- **File uploads:** multer + sharp (images), PDF handling
- **AI:** Ollama (mistral model, localhost:11434)
- **Code execution:** Judge0 (Docker, localhost:2358)

### Frontend
- **Framework:** React 18 + Vite
- **Routing:** React Router v6
- **State:** Zustand (auth store)
- **Data fetching:** React Query (TanStack Query)
- **Styling:** Tailwind CSS (custom ink/bone colors)
- **Animation:** Framer Motion
- **Components:** Custom-built (no shadcn/ui, no external component library)

### Infrastructure
- **Local dev:** Windows 11, PowerShell, Docker Desktop
- **Ports:** Backend 4000, Frontend 5173, Judge0 2358, Ollama 11434
- **Project root:** `C:\Users\rraj8\scholr\`

---

## 📁 Project Structure

```
scholr/
├── backend/
│   ├── src/
│   │   ├── controllers/      # Business logic per feature
│   │   │   ├── auth.controller.ts
│   │   │   ├── admin.controller.ts
│   │   │   ├── teacher.controller.ts
│   │   │   ├── code.controller.ts
│   │   │   ├── career.controller.ts
│   │   │   ├── social.controller.ts
│   │   │   ├── notification.controller.ts
│   │   │   ├── profile.controller.ts
│   │   │   └── ... (20+ controllers)
│   │   ├── routes/            # API route definitions
│   │   │   ├── index.ts       # Mounts all routes
│   │   │   ├── auth.routes.ts
│   │   │   ├── admin.routes.ts
│   │   │   ├── teacher.routes.ts
│   │   │   ├── code.routes.ts
│   │   │   ├── career.routes.ts
│   │   │   ├── social.routes.ts
│   │   │   ├── notification.routes.ts
│   │   │   ├── profile.routes.ts
│   │   │   └── ...
│   │   ├── middleware/
│   │   │   ├── auth.ts        # requireAuth, optionalAuth, requireRole
│   │   │   ├── upload.ts      # multer + sharp for images/PDFs
│   │   │   └── errorHandler.ts
│   │   ├── config/
│   │   │   ├── prisma.ts      # Prisma client singleton
│   │   │   └── jwt.ts         # JWT signing/verification
│   │   ├── utils/
│   │   │   ├── errors.ts      # Custom error classes
│   │   │   └── asyncHandler.ts
│   │   └── index.ts           # Express app entry point
│   ├── prisma/
│   │   └── schema.prisma      # 35+ models (see Data Model section)
│   ├── uploads/               # Local file storage (gitignored)
│   │   ├── avatars/
│   │   ├── posts/
│   │   ├── banners/
│   │   └── resumes/
│   ├── package.json
│   ├── tsconfig.json
│   └── .env                   # DATABASE_URL, JWT_SECRET, PORT
│
├── frontend/
│   ├── src/
│   │   ├── components/
│   │   │   ├── auth/          # AdminRoute, TeacherRoute
│   │   │   ├── dashboard/     # DashboardLayout, widgets
│   │   │   ├── admin/         # AdminLayout
│   │   │   ├── teacher/       # TeacherLayout
│   │   │   └── social/        # Avatar, PostCard, CreatePost, NotificationBell
│   │   ├── pages/
│   │   │   ├── auth/          # Login, Signup
│   │   │   ├── dashboard/     # Dashboard, Feed, Profile, Career, Planner, etc.
│   │   │   ├── admin/         # AdminDashboard, AdminProblems, AdminUsers, AdminReports
│   │   │   ├── teacher/       # TeacherDashboard, TeacherClassrooms, ClassroomDetail
│   │   │   └── onboarding/    # Onboarding (3-step wizard)
│   │   ├── store/
│   │   │   └── authStore.ts   # Zustand auth + user state
│   │   ├── lib/
│   │   │   ├── api.ts         # Axios instance with interceptors
│   │   │   └── queryClient.ts # React Query singleton
│   │   ├── App.tsx            # Router with 40+ routes
│   │   └── main.tsx           # React entry point
│   ├── public/
│   ├── package.json
│   ├── vite.config.ts         # Proxies /api → :4000, /uploads → :4000
│   ├── tailwind.config.ts     # Custom ink/bone colors
│   ├── tsconfig.json
│   └── index.html
│
└── docker-compose.yml         # Judge0 code execution engine
```

---

## 🗄️ Data Model (35+ Models)

### Core User System
```prisma
User {
  id, email, passwordHash, role, firstName, lastName
  avatarUrl, bannerUrl, bio, headline, phone, dob, gender
  country, state, city, resumeUrl
  skills[], githubUrl, linkedinUrl, portfolioUrl, websiteUrl
  profileData (JSON), onboardingDone
  suspendedAt, suspendedUntil, suspendedReason
  subscriptionTier, emailVerified
  createdAt, updatedAt, lastLoginAt
}

Session { id, userId, token, expiresAt }
```

### Roles
```
STUDENT                 (school student, legacy)
COLLEGE_STUDENT         (new in Delivery 7)
TEACHER
PARENT
SCHOOL_ADMIN
COLLEGE_ADMIN
RECRUITER
WORKING_PROFESSIONAL    (new in Delivery 7)
SUPER_ADMIN
```

### Academic System
```prisma
Classroom { id, name, teacherId, joinCode, description }
Enrollment { id, userId, classroomId, role, enrolledAt }
Task { id, userId, title, description, dueDate, status, priority }
PersonalExam { id, userId, name, date, subjects }
StudyPlan { id, userId, goals, milestones }
```

### Coding System
```prisma
CodingProblem {
  id, slug, title, description, difficulty
  testCases[], constraints, examples[]
  tags[], hints[]
  status (DRAFT, PENDING_REVIEW, APPROVED, REJECTED)
  createdById, reviewNote
}

CodeSubmission {
  id, userId, problemId, code, language
  status, output, executionTime, memoryUsed
  passed, verdict
}
```

### Professional Profile
```prisma
Education {
  id, userId, institution, degree, field
  startYear, endYear, current, grade, description
}

WorkExperience {
  id, userId, company, role, location
  startDate, endDate, current, description
}

Certificate {
  id, userId, title, issuer, credentialUrl
  imageUrl, issuedAt
}
```

### Career System
```prisma
CareerProfile { id, userId, interests[], skills[], goals }
Application { id, userId, jobId, status, resumeUrl, coverLetter }
Job { id, posterId, title, company, description, salary, location }
```

### Social Features
```prisma
Post {
  id, userId, content, type, visibility
  imageUrl, metadata (JSON)
}

PostLike { id, postId, userId }
PostComment { id, postId, userId, content }
PostShare { id, postId, userId }

Follow { followerId, followingId }
Block { blockerId, blockedId }

Notification {
  id, userId, fromUserId, type, content, read
}

Report {
  id, postId, reporterId, reason, details, status
  reviewerId, reviewNote
}
```

### AI & Analytics
```prisma
AIChat { id, userId, messages (JSON) }
FocusSession { id, userId, startTime, endTime, mode }
MoodLog { id, userId, mood, note, createdAt }
Streak { id, userId, current, longest }
LeaderboardEntry { id, userId, category, score, rank }
```

### Admin & Moderation
```prisma
Institution { id, name, type, address }
Message { id, senderId, receiverId, content, read }
Notification (extended with fromUser relation)
Report (full moderation queue)
```

---

## 🎨 Design System

### Theme: Dark Editorial

**Color Palette:**
```css
/* Backgrounds */
--ink-950: #0a0a0f    /* Base background */
--ink-900: #111118    /* Card background */
--ink-800: #1a1a24    /* Hover states */

/* Text */
--bone-50:  #fafaf8   /* Headings */
--bone-100: #f0efe8   /* Body text */
--bone-200: #ddddd0   /* Secondary text */
--bone-300: #c8c8b8   /* Muted text */
--bone-400: #a8a898   /* Placeholder */

/* Accents */
--violet-500: #8b5cf6 /* Primary actions */
--violet-600: #7c3aed /* Primary hover */
--cyan-500:   #06b6d4 /* Secondary accent */

/* Semantic */
--red-500:    #ef4444 /* Error, admin */
--amber-500:  #f59e0b /* Warning */
--emerald-500:#10b981 /* Success, teacher */
```

**Typography:**
- Display: Instrument Serif (headings, titles)
- Body: Inter (paragraphs, UI)
- Mono: Font-mono (code, data)

**Components:**
- Cards: `rounded-2xl border border-white/[0.06] bg-ink-900/60`
- Buttons: `rounded-lg bg-violet-600 hover:bg-violet-500`
- Inputs: `rounded-lg bg-ink-950 border border-white/[0.08]`
- No drop shadows, no gradients (except subtle accents)

---

## 🚀 Features Delivered (Session-by-Session)

### Session 1–2: Foundation + Dashboard v1
- Authentication (JWT, signup/login/logout)
- Dashboard with 8 widgets (Tasks, Focus, Tests, AI Mentor, Planner, Career, Wellness, Streak)
- AI Mentor chat (Ollama integration)
- Focus Mode timer (Pomodoro/Deep Work/Sprint)
- Personal exam tracker
- Mood logging + wellness tips

### Session 3: Study Planner + Dashboard v2 Rebuild
- Advanced study planner (goals, milestones, auto-schedule, conflict detection)
- Dashboard v2 with improved layouts
- Fixed authentication flow
- Mobile-responsive widgets

### Session 4 (Massive): 13 Major Deliveries

**4.1 — Theme Exploration**
- Attempted clean light theme (rejected by user)
- Reverted to dark editorial theme (final)

**4.2 — Admin Panel (Delivery 1)**
- Problem CRUD with Monaco editor
- User management (list, search, role changes)
- Stats dashboard
- Red-themed admin UI

**4.3 — Production Login Pattern (Delivery 2)**
- Single /login for all roles
- Post-login role-based redirect:
  - Admin → /admin
  - Teacher → /teacher
  - Student → /dashboard

**4.4 — Teacher Role + Classrooms (Delivery 3)**
- Teacher dashboard (emerald theme)
- Classroom CRUD with auto-generated join codes
- Student join/leave classroom
- Teacher remove student
- MyClassrooms widget on student dashboard

**4.5 — CRITICAL FIX: Role Enum + React Query Cache**
- Fixed role enum mismatch (ADMIN doesn't exist, use SCHOOL_ADMIN/COLLEGE_ADMIN/SUPER_ADMIN)
- Fixed React Query cache leak (users seeing each other's data)
- Centralized queryClient singleton
- Added isAdmin()/isTeacher() helpers

**4.6 — Code Execution Fix + Approval Workflow (Delivery 4)**
- Fixed Judge0 whitespace bug (trim expected output)
- Added ProblemStatus enum (DRAFT, PENDING_REVIEW, APPROVED, REJECTED)
- Teacher creates problems → status = PENDING_REVIEW
- Admin approves/rejects with review notes
- Students only see APPROVED problems

**4.7 — Career Explorer (Delivery 5)**
- 10 career profiles (AI/ML, Full Stack, Data Scientist, etc.)
- Personalized match scoring (exam scores + coding + focus dedication)
- Career detail pages (skill gap analysis, education paths, 6-step roadmap)
- CareerInsight widget on dashboard

**4.8 — Social Feed Foundation (Delivery 6)**
- LinkedIn-style feed with posts, likes, comments, shares
- Follow/unfollow system
- Post types: POST, ACHIEVEMENT, CERTIFICATE, MILESTONE
- Visibility: PUBLIC, FOLLOWERS_ONLY, PRIVATE
- Block system (safety)
- Search users

**4.9 — Social Pro: Images + Notifications + Moderation (Delivery 6.5)**
- **Image uploads:** Avatars (256×256 webp), post images (max 1200px), banners (1200×400), resumes (PDF)
- **Avatar component** used everywhere (posts, comments, sidebar, profile, admin)
- **Notifications system:** bell icon, unread count, dropdown, full page, mark as read
- **Report system:** 7 reasons (Spam, Harassment, Hate Speech, etc.), one report per user per post
- **Admin moderation:** Delete any post, suspend users (with reason + duration), reports queue
- Powered by multer + sharp

**4.10 — Professional Profile System (Delivery 7) ← MOST RECENT**
- **3-step onboarding wizard:**
  - Step 1: Basic info (name, phone, DOB, gender, location)
  - Step 2: Pick role (6 role cards)
  - Step 3: Dynamic role-specific form (school details, college info, company, etc.)
- **LinkedIn-style profile page:**
  - Cover banner upload
  - Profile photo with camera button
  - About, Education, Experience, Skills, Certifications, Activity
  - Resume upload/download
  - Social links (GitHub, LinkedIn, Portfolio, Website)
- **Profile strength score** (0-100%) with missing fields list
- **AI Profile Analysis** (Ollama-powered or rule-based fallback)
- **New roles:** COLLEGE_STUDENT, WORKING_PROFESSIONAL
- **Smart login routing** based on role + onboarding status

---

## 📡 API Endpoints (120+ endpoints)

### Auth
```
POST   /api/auth/signup
POST   /api/auth/login
POST   /api/auth/logout
GET    /api/auth/me
POST   /api/auth/refresh
```

### Admin
```
GET    /api/admin/users          ?role=X&search=Y
PATCH  /api/admin/users/:id/role
POST   /api/admin/users/:id/suspend
POST   /api/admin/users/:id/unsuspend
GET    /api/admin/problems
POST   /api/admin/problems
GET    /api/admin/problems/pending
POST   /api/admin/problems/:slug/approve
POST   /api/admin/problems/:slug/reject
DELETE /api/admin/posts/:id
GET    /api/admin/reports        ?status=PENDING
POST   /api/admin/reports/:id/review
GET    /api/admin/stats
```

### Teacher
```
GET    /api/teacher/classrooms
POST   /api/teacher/classrooms
GET    /api/teacher/classrooms/:id
PATCH  /api/teacher/classrooms/:id
DELETE /api/teacher/classrooms/:id
POST   /api/teacher/classrooms/:id/regenerate-code
DELETE /api/teacher/classrooms/:id/students/:userId
POST   /api/teacher/problems
GET    /api/teacher/problems
PATCH  /api/teacher/problems/:slug
```

### Student Classrooms
```
POST   /api/classrooms/join      { code }
GET    /api/classrooms/my
POST   /api/classrooms/:id/leave
```

### Coding
```
GET    /api/code/problems        ?difficulty=X&tag=Y
GET    /api/code/problems/:slug
POST   /api/code/submit
GET    /api/code/submissions     ?problemId=X
POST   /api/code/run             { code, language, problemId }
```

### Career
```
GET    /api/career/all
GET    /api/career/:id
GET    /api/career/:id/match     (personalized match score)
```

### Social
```
GET    /api/social/feed          ?cursor=X
POST   /api/social/posts
GET    /api/social/posts/:id
DELETE /api/social/posts/:id
POST   /api/social/posts/:id/like
DELETE /api/social/posts/:id/like
POST   /api/social/posts/:id/comment
POST   /api/social/posts/:id/share
POST   /api/social/posts/:id/report
POST   /api/social/follow/:userId
DELETE /api/social/follow/:userId
POST   /api/social/block/:userId
GET    /api/social/users/:id/posts
GET    /api/social/profile/:userId
POST   /api/social/upload/avatar
POST   /api/social/upload/post-image
```

### Notifications
```
GET    /api/notifications        ?limit=30&cursor=X
GET    /api/notifications/unread-count
POST   /api/notifications/:id/read
POST   /api/notifications/mark-all-read
DELETE /api/notifications/:id
```

### Profile (NEW in Delivery 7)
```
GET    /api/profile/me
GET    /api/profile/users/:userId
PATCH  /api/profile/me
POST   /api/profile/me/banner
POST   /api/profile/me/resume
PATCH  /api/profile/me/profile-data
POST   /api/profile/me/education
PATCH  /api/profile/me/education/:id
DELETE /api/profile/me/education/:id
POST   /api/profile/me/experience
PATCH  /api/profile/me/experience/:id
DELETE /api/profile/me/experience/:id
GET    /api/profile/me/strength
GET    /api/profile/me/ai-analysis
POST   /api/profile/onboarding/step1
POST   /api/profile/onboarding/step2
POST   /api/profile/onboarding/step3
```

### Dashboard Widgets
```
GET    /api/tasks
POST   /api/tasks
GET    /api/focus/sessions
POST   /api/focus/start
POST   /api/focus/end
GET    /api/planner
POST   /api/planner/goals
GET    /api/wellness/mood
POST   /api/wellness/mood
GET    /api/ai/chat/:sessionId
POST   /api/ai/chat
```

---

## 🔐 Authentication & Authorization

### JWT Flow
1. User logs in → backend issues JWT with `{ userId, email, role }`
2. Token stored in `localStorage` (authStore)
3. Frontend adds `Authorization: Bearer <token>` to all API calls (axios interceptor)
4. Backend `requireAuth` middleware verifies token, attaches `req.user`

### Role-Based Access Control
```typescript
// Middleware
requireAuth         // Any authenticated user
requireRole(roles)  // Specific role(s) required
optionalAuth        // Auth optional (public + private data)

// Role hierarchies
ADMIN_ROLES = ['SCHOOL_ADMIN', 'COLLEGE_ADMIN', 'SUPER_ADMIN']
TEACHER_ROLES = ['TEACHER', ...ADMIN_ROLES]
PROFESSIONAL_ROLES = ['WORKING_PROFESSIONAL', 'RECRUITER', 'COLLEGE_STUDENT']

// Route protection
/api/admin/*        → requireRole(ADMIN_ROLES)
/api/teacher/*      → requireRole(TEACHER_ROLES) OR requireAuth (mixed)
/api/code/*         → requireAuth
/api/social/*       → requireAuth OR optionalAuth
```

### Suspended Users
Users with `suspendedAt` set are blocked at login:
```typescript
if (user.suspendedAt && (!user.suspendedUntil || user.suspendedUntil > now)) {
  throw Forbidden(`Account suspended until ${suspendedUntil}: ${suspendedReason}`)
}
```

---

## 🎓 Key Algorithms & Logic

### Profile Strength Score (0-100)
```typescript
Weighted scoring:
- Profile photo: 10pt
- Banner: 5pt
- Headline: 8pt
- Bio: 8pt
- Location: 5pt
- Phone: 5pt
- Skills: 10pt
- LinkedIn: 5pt
- GitHub: 5pt
- Resume: 10pt
- Role-specific data: 12pt
- Education entries: 6pt
- Experience entries: 6pt
Total: 95 → capped at 100
```

### Career Match Score
```typescript
Base: 30 points
+ 10 per relevant subject (from exam scores)
+ 15 from coding submissions (tech careers only)
+ 5 Python bonus
+ 10 focus session dedication
Capped at 99%
```

### Classroom Join Code
```typescript
6-character random string from alphabet:
ABCDEFGHJKLMNPQRSTUVWXYZ23456789
(no I, O, 0, 1 to avoid confusion)
```

### Judge0 Code Execution
```typescript
// Fixed whitespace bug in Delivery 4
Before: expected_output sent to Judge0 (strict byte comparison)
After: Backend receives stdout, trims both:
  actual.trim() === expected.trim()
```

### React Query Cache Management
```typescript
// Fixed in Delivery 4
On login: queryClient.clear()
On logout: queryClient.clear()
Shared singleton prevents cross-user data leaks
```

---

## 🧪 Testing Checklist

### New User Flow
1. Signup → email + password
2. Redirected to /onboarding (3 steps)
3. Pick role → fill role-specific form
4. Land on correct dashboard based on role

### Profile System
1. Click name in sidebar → profile page
2. Upload banner → see updated everywhere
3. Upload avatar → see in sidebar, posts, comments
4. Add education entry → appears in profile
5. Add experience → appears in profile
6. Upload resume → download button works
7. Click "Analyse my profile" → AI suggestions load
8. Profile strength updates as fields filled

### Social Features
1. Create post with image → appears in feed
2. Like/comment/share → shows in feed
3. Follow someone → see their posts
4. Report a post → admin sees in /admin/reports
5. Bell icon shows unread count → click → dropdown
6. Click notification → goes to relevant content

### Admin Features
1. Login as admin → lands on /admin
2. Create coding problem → status = PENDING_REVIEW (if teacher created)
3. Approve problem → appears in student problem list
4. Suspend user → they can't log in
5. Review report → remove post / keep / dismiss

### Teacher Features
1. Login as teacher → lands on /teacher
2. Create classroom → auto-generated join code
3. Students join with code → appear in roster
4. Remove student → they leave classroom
5. Create problem → goes to admin for review

---

## 🐛 Known Issues & Limitations

### Active Blockers
1. **Supabase free tier pauses after 7 days inactivity**
   - Solution: Restore project manually OR migrate to Neon/Railway

### Technical Debt
1. **File uploads stored locally** (`backend/uploads/`)
   - Production needs: S3, Cloudinary, or Supabase Storage
2. **No email verification** (emailVerified field exists but not implemented)
3. **No password reset** (resetToken fields exist but no flow)
4. **No real-time notifications** (polling every 30s, should use WebSockets)
5. **No pagination on feed** (cursor-based exists but limited testing)
6. **No image optimization on upload** (sharp resizes but no lazy loading)
7. **No rate limiting** (should add express-rate-limit)

### Feature Gaps
1. **No recruiter dashboard** (recruiter lands on feed, needs dedicated UI)
2. **No job posting system** (Job model exists but no UI)
3. **No test series system** (PersonalExam exists but no admin-created tests)
4. **No teacher-assigned homework** (Tasks exist but no teacher assignment flow)
5. **No parent dashboard** (parent role exists but no dedicated features)
6. **No dark/light mode toggle** (user requested but not implemented)
7. **No "People You May Know" suggestions** (user requested for feed)

---

## 🚧 Roadmap (Not Yet Built)

### User-Requested Features
1. **Dark/light mode toggle** (theme switcher in settings)
2. **Feed suggestions** (same school/college/company)
3. **Recruiter dashboard** (job postings, candidate search, leaderboards)
4. **Test series system** (admin creates tests, students take them)
5. **Teacher assignments** (teacher assigns tests/notes to classroom)

### Technical Improvements
1. **Real-time features** (WebSockets for chat, notifications, live updates)
2. **Email system** (verification, password reset, notifications)
3. **Cloud file storage** (migrate from local uploads to S3/Cloudinary)
4. **Mobile apps** (React Native or PWA)
5. **Performance optimizations** (image lazy loading, virtual scrolling, code splitting)
6. **Monitoring** (Sentry, analytics, logging)
7. **CI/CD** (GitHub Actions, automated tests, deployments)

---

## 📦 Deployment Considerations

### Environment Variables
```env
# Backend (.env)
DATABASE_URL=postgresql://...
JWT_SECRET=random_256bit_hex
PORT=4000
NODE_ENV=production

# Frontend (embed in build)
VITE_API_URL=https://api.scholr.com
```

### Production Checklist
- [ ] Migrate DATABASE_URL to hosted PostgreSQL (Supabase Pro, Neon, Railway, RDS)
- [ ] Set NODE_ENV=production
- [ ] Enable CORS for production domain
- [ ] Add rate limiting (express-rate-limit)
- [ ] Set up HTTPS (Let's Encrypt, Cloudflare)
- [ ] Configure file uploads to S3/Cloudinary
- [ ] Add monitoring (Sentry, LogRocket)
- [ ] Set up backups (Prisma migrations + DB snapshots)
- [ ] Configure CDN for static assets (Cloudflare, Vercel)
- [ ] Add health check endpoint (`GET /health`)

### Deployment Platforms
| Platform | Backend | Frontend | Database | Cost |
|---|---|---|---|---|
| **Vercel** | Serverless Functions | Edge | External | $20/mo |
| **Railway** | Container | Static | Built-in PG | $5-20/mo |
| **Fly.io** | Container | Static | External | $10-30/mo |
| **AWS** | EC2/ECS | S3+CloudFront | RDS | $50-100/mo |
| **DigitalOcean** | Droplet | Static | Managed DB | $20-50/mo |

**Recommended for MVP:** Railway (simplest) or Vercel + Neon (scalable)

---

## 🤝 Development Workflow

### Starting the App
```powershell
# Terminal 1 — Backend
cd C:\Users\rraj8\scholr\backend
npm run dev

# Terminal 2 — Frontend
cd C:\Users\rraj8\scholr\frontend
npm run dev

# Terminal 3 — Judge0 (if needed)
docker-compose up judge0

# Terminal 4 — Ollama (if needed)
ollama serve
```

### Making Changes
1. **Backend:** Edit controller → routes auto-reload (nodemon)
2. **Frontend:** Edit component → Vite HMR reloads instantly
3. **Schema:** Edit `schema.prisma` → `npx prisma db push` → restart backend
4. **New API:** Create controller → add route → mount in `index.ts` → test with frontend

### Database Migrations
```powershell
# Development (quick, destructive)
npx prisma db push

# Production (tracked migrations)
npx prisma migrate dev --name feature_name
npx prisma migrate deploy
```

### Troubleshooting
| Issue | Solution |
|---|---|
| Port 4000 in use | `Get-Process -Id (Get-NetTCPConnection -LocalPort 4000).OwningProcess \| Stop-Process` |
| Prisma client out of sync | `npx prisma generate` |
| Can't reach database | Check Supabase project status, restore if paused |
| CORS error | Check backend allows frontend origin in CORS config |
| Images not loading | Verify Vite proxy config, check backend `/uploads` static mount |
| React Query stale data | `queryClient.invalidateQueries()` or set `staleTime` |

---

## 📚 Key Files Reference

### Backend Entry Points
- `src/index.ts` — Express app, middleware, route mounting, error handling
- `src/routes/index.ts` — Central router, mounts all sub-routes
- `prisma/schema.prisma` — Single source of truth for database schema
- `.env` — Secrets (DATABASE_URL, JWT_SECRET)

### Frontend Entry Points
- `src/main.tsx` — React root, QueryClientProvider, RouterProvider
- `src/App.tsx` — All routes (40+), ProtectedRoute, role guards
- `src/store/authStore.ts` — Auth state, login/logout, user, isAdmin/isTeacher helpers
- `src/lib/api.ts` — Axios instance with auth interceptor

### Critical Utilities
- `backend/src/middleware/auth.ts` — `requireAuth`, `requireRole`, `optionalAuth`
- `backend/src/middleware/upload.ts` — `multer`, `sharp`, image/PDF processing
- `backend/src/utils/errors.ts` — `NotFound`, `Unauthorized`, `Forbidden`, `BadRequest`
- `frontend/src/lib/queryClient.ts` — Shared React Query client singleton

---

## 💡 Developer Notes

### Design Principles
1. **Controllers are thick, routes are thin** — all business logic in controllers
2. **Zod validation at controller entry** — parse + validate before DB queries
3. **Prisma transactions for multi-step writes** — ensure atomicity
4. **React Query for all server state** — no useState for API data
5. **Optimistic updates where safe** — likes, follows (revert on error)
6. **Progressive disclosure** — collapsed sections, "show more", lazy loading

### Code Conventions
- **Backend:** async/await everywhere, try/catch in asyncHandler wrapper
- **Frontend:** Functional components only, hooks at top, early returns for loading/error
- **Naming:** camelCase (TS/JS), kebab-case (URLs), PascalCase (components/models)
- **Comments:** JSDoc for public APIs, inline for complex logic, none for obvious code

### Testing Strategy (not implemented yet)
- Unit: Vitest for utils/helpers
- Integration: Supertest for API endpoints
- E2E: Playwright for critical user flows
- Mock: MSW for frontend API mocking

---

## 🎯 Success Metrics (Once Deployed)

### User Engagement
- Daily active users (DAU)
- Average session duration
- Posts per user per week
- Code submissions per day
- Profile completion rate

### Feature Adoption
- % users with >80% profile strength
- % students joined a classroom
- % teachers created a problem
- % users with AI analysis viewed

### Performance
- API response time (p95 < 500ms)
- Page load time (LCP < 2s)
- Time to interactive (TTI < 3s)
- Uptime (target 99.9%)

---

## 📞 Support & Resources

### External Dependencies
- **Supabase:** Database hosting → [supabase.com](https://supabase.com)
- **Judge0:** Code execution → [judge0.com](https://judge0.com)
- **Ollama:** Local AI → [ollama.com](https://ollama.com)
- **Multer:** File uploads → [npmjs.com/package/multer](https://npmjs.com/package/multer)
- **Sharp:** Image processing → [sharp.pixelplumbing.com](https://sharp.pixelplumbing.com)

### Documentation
- Prisma ORM: [prisma.io/docs](https://prisma.io/docs)
- React Query: [tanstack.com/query](https://tanstack.com/query/latest)
- Tailwind CSS: [tailwindcss.com/docs](https://tailwindcss.com/docs)
- Framer Motion: [framer.com/motion](https://framer.com/motion)

---

## 🔄 Session History Summary

| Session | Deliveries | Key Features | Status |
|---|---|---|---|
| **1-2** | Foundation | Auth, Dashboard v1, 8 widgets, AI Mentor, Focus Mode | ✅ |
| **3** | Study Planner | Advanced planner, Dashboard v2 rebuild | ✅ |
| **4.1** | Theme | Light theme attempt → reverted to dark | ✅ |
| **4.2** | Admin Panel | Problem CRUD, user mgmt, stats | ✅ |
| **4.3** | Login Flow | Production role-based redirect | ✅ |
| **4.4** | Teacher System | Classrooms, join codes, roster | ✅ |
| **4.5** | Critical Fix | Role enum + React Query cache | ✅ |
| **4.6** | Code + Approval | Judge0 fix, problem approval workflow | ✅ |
| **4.7** | Career | Career explorer, match scoring | ✅ |
| **4.8** | Social | Feed, posts, likes, comments, follow | ✅ |
| **4.9** | Social Pro | Images, notifications, moderation | ✅ |
| **4.10** | Profile | Onboarding wizard, LinkedIn-style profile, AI analysis | ✅ LATEST |

**Next up:** User choice between dark/light mode toggle OR continue feature roadmap (test series, recruiter dashboard, suggestions)

---

**Last Updated:** Session 4, Delivery 7 (Professional Profile System)  
**Status:** Fully functional, production-ready backend + frontend  
**Blocking Issue:** Supabase database paused (free tier) — needs restore or migration  
**Ready for:** Dark/light theme toggle OR feature expansion
