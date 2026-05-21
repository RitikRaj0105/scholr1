# Delivery 7 — Professional Profile System

LinkedIn/Naukri-style professional profiles for all user types.

## What's built

### 3-step signup wizard (/onboarding)
New users (or first-time logins) are redirected to a 3-step onboarding:

Step 1 — Basic info: Name, phone, date of birth, gender, country/state/city
Step 2 — Pick your role: School Student, College Student, Teacher, Parent, Recruiter, Working Professional
Step 3 — Role-specific form:
  - School Student: school name, board, class, section, roll number, parent info, subjects, goals
  - College Student: college, university, degree, branch, CGPA, skills, GitHub, LinkedIn, goals
  - Teacher: institution, subjects, experience, qualifications
  - Parent: child's school, class, goal
  - Recruiter: company, website, hiring roles, industry
  - Working Professional: company, job title, experience, skills, LinkedIn, portfolio, goals

### LinkedIn-style profile page (/dashboard/profile)
- **Cover banner** with upload button (edit)
- **Profile photo** with camera button overlay
- **Name, headline, location, role badge, follower stats**
- **Social links** row (GitHub, LinkedIn, Portfolio, Website)
- **About** section with inline edit
- **Profile Details** — role-specific data displayed neatly
- **Education** section — add/edit/delete each entry
- **Experience** section — add/edit/delete each entry
- **Skills** section — tag-style, edit all at once
- **Certifications** — auto-populated from feed posts
- **Activity** — last 3 feed posts
- **Resume** — view/download PDF or upload new
- **Profile strength** card (0-100%) with missing fields
- **AI Profile Analysis** card — click to get Ollama-powered suggestions

### Profile strength algorithm
Weighted score:
- Profile photo: 10 points
- Cover banner: 5 points
- Headline: 8 points
- Bio: 8 points
- Location: 5 points
- Phone: 5 points
- Skills: 10 points
- LinkedIn: 5 points
- GitHub: 5 points
- Resume: 10 points
- Role details: 12 points
- Education entries: 6 points
- Experience entries: 6 points
Total: 95 possible → capped at 100

### AI Profile Analysis (Ollama-powered)
Click "Analyse my profile" on your profile page.
If Ollama is running with mistral model → AI generates:
- Profile improvement suggestions
- Career paths that fit your profile
- Learning recommendations
- Internship/job tips
- Strength summary

If Ollama is not running → rule-based fallback still gives useful suggestions.

### Role-based login routing
After login:
- Super/School/College Admin → /admin
- Teacher → /teacher
- Recruiter, Working Professional → /dashboard/feed
- Student, College Student → /dashboard
- Anyone with onboardingDone=false → /onboarding (wizard)

### New roles added
- COLLEGE_STUDENT (new)
- WORKING_PROFESSIONAL (new)

## Install

### 1. Extract the zip
```powershell
Expand-Archive C:\Users\rraj8\Downloads\scholr-profile.zip -DestinationPath C:\Users\rraj8\scholr -Force
```

### 2. Push schema (adds Education, WorkExperience models, new User fields, new roles)
```powershell
cd C:\Users\rraj8\scholr\backend
npx prisma db push
```

### 3. Restart backend
```powershell
npm run dev
```

## Test

1. **New user signup** → after creating account they land on /onboarding
2. **Step 1**: Fill name, phone, DOB, location
3. **Step 2**: Pick "College Student"
4. **Step 3**: Fill college name, degree, skills → click "Complete setup"
5. **Lands on /dashboard**
6. **Click profile link** at bottom of sidebar → see LinkedIn-style profile
7. **Hover the banner** → click "Edit banner" → upload an image
8. **Click camera on avatar** → upload profile pic
9. **Click +** on Education section → add IIT Bombay
10. **Click "Analyse my profile"** → AI suggestions appear

## Files

```
backend/
  prisma/schema.prisma                ← New roles, User fields, Education, WorkExperience
  src/middleware/upload.ts            ← Added saveBannerImage, saveResume
  src/controllers/profile.controller.ts  ← NEW (full profile API)
  src/routes/profile.routes.ts        ← NEW (all profile endpoints)
  src/routes/index.ts                 ← Mounts /api/profile

frontend/
  src/pages/onboarding/Onboarding.tsx     ← NEW (3-step wizard)
  src/pages/dashboard/ProfessionalProfile.tsx ← NEW (LinkedIn-style profile)
  src/pages/auth/Login.tsx             ← Role routing + onboarding redirect
  src/store/authStore.ts               ← New roles + onboardingDone field
  src/App.tsx                          ← New routes
```
