# Privacy + Messages + Jobs — Delivery

Three new features in one delivery:

1. **Privacy controls** — hide phone, email, location, or date of birth from public view
2. **Direct messaging** — DM any user, see conversations list, unread counts, real-time-ish polling
3. **Jobs board** — post and apply for jobs across 14 categories, including blue-collar/daily-wage work (driver, cook, household help, security guard, labour, electrician, gardener, beauty, retail, etc.)

---

## Install

### 1. Extract the zip

```powershell
Expand-Archive C:\Users\rraj8\Downloads\scholr-privacy-messages-jobs.zip -DestinationPath C:\Users\rraj8\scholr -Force
```

### 2. Push the schema changes to your database

The schema adds:
- 4 privacy fields to `User` (`showPhone`, `showEmail`, `showLocation`, `showDob`)
- 4 fields to `Job` (`category`, `dailyWage`, `payPeriod`, `contactPhone`)
- `GIG` value to `JobType` enum
- New `JobCategory` enum with 14 categories

```powershell
cd C:\Users\rraj8\scholr\backend
npx prisma db push
```

You should see: *"Your database is now in sync with your Prisma schema."*

### 3. Restart the backend

```powershell
# Ctrl+C in backend window, then:
npm run dev
```

### 4. Frontend hot-reloads

If not: Ctrl+C in frontend window → `npm run dev`

---

## Test it

### Privacy controls

1. Go to **`/dashboard/profile`** (your own profile)
2. Scroll down to **"Privacy Settings"** card (only visible to you on your own profile)
3. Toggle off **Phone number** → save
4. Open an incognito window, sign in as a different user
5. Visit your profile from that other account → phone should no longer show
6. Toggle it back on → it reappears

The toggles are independent for: phone, email, location (city/state/country), and date of birth.

### Direct messaging

1. As **User A**, visit User B's profile
2. Click the new **"Message"** button next to Follow
3. Type a message → press Enter (or Send)
4. Sign in as **User B**, click **Messages** in the sidebar
5. See the conversation with User A in the left panel, click to open
6. Reply → message appears immediately
7. Notice the unread badge in the conversations list
8. Mobile view: list and thread switch full-width (responsive)

The thread auto-polls every 5 seconds, so new messages appear without a refresh.

### Jobs board

1. Click **Jobs** in the sidebar
2. Click **"+ Post a job"**
3. Try posting a gig-style job:
   - Title: *"Cook needed for small family"*
   - Posted by: *"Sharma family"*
   - Location: *"Sector 21, Noida"*
   - Category: **Cook**
   - Job type: **Gig / Daily-wage** ← notice the form switches
   - Daily wage: *600*
   - Pay period: *per day*
   - Contact phone: your number
   - Description: write a few lines
   - Click **Post job**
4. You land on the detail page. From another account:
   - Browse `/dashboard/jobs`, filter by **Cook** category
   - Open your listing
   - Either tap the **phone number** (gig jobs show a direct-call link) or click **Apply now**
5. After applying, the original poster sees the applicant in their **"View applications"** page with the applicant's full profile + contact info.

Try posting a tech job too — switching **Job type** to *Full-time* swaps the daily-wage field out for salary range fields.

---

## What changed in your codebase

### Backend

| File | What |
|---|---|
| `prisma/schema.prisma` | Added 4 privacy fields on User. Added `JobCategory` enum + `GIG` to JobType. Added `category`, `dailyWage`, `payPeriod`, `contactPhone` to Job. |
| `src/controllers/profile.controller.ts` | Added `applyPrivacy()` helper that strips hidden fields when someone else views the profile. Privacy toggles added to update schema. |
| `src/controllers/messages.controller.ts` | NEW — conversation list, thread, send, unread count, delete |
| `src/controllers/jobs.controller.ts` | NEW — list (with category/type/search filters), create, update, delete, apply, my-applications, my-listings, applicants-for-my-job |
| `src/routes/messages.routes.ts` | NEW |
| `src/routes/jobs.routes.ts` | NEW |
| `src/routes/index.ts` | Mounts `/api/messages` and `/api/jobs` |

### Frontend

| File | What |
|---|---|
| `pages/dashboard/Messages.tsx` | NEW — list + thread chat UI |
| `pages/dashboard/Jobs.tsx` | NEW — board with 14 categories, post-job modal |
| `pages/dashboard/JobDetail.tsx` | NEW — full job view with Apply + Message + direct-call (gig) |
| `pages/dashboard/JobApplications.tsx` | NEW — applicants view for job posters |
| `pages/dashboard/MyApplications.tsx` | NEW |
| `pages/dashboard/MyPostedJobs.tsx` | NEW |
| `pages/dashboard/ProfessionalProfile.tsx` | Added Message button on others' profiles + Privacy Settings card on your own |
| `components/dashboard/DashboardLayout.tsx` | Added **Messages** and **Jobs** to sidebar nav |
| `App.tsx` | Added 7 new routes |

---

## How privacy works under the hood

When you turn off a field (say, *phone*):
- Your DB record keeps the phone number — nothing is deleted
- But on profile fetches, `applyPrivacy()` strips it from the response **before** sending
- It runs server-side, so a curious user can't bypass it by inspecting the API
- Toggle it back on and it reappears immediately

**Exception:** when someone applies to your job, the job poster gets full contact info regardless. This is intentional — if you're applying for work, the employer needs to be able to reach you. There's a small note about this on the privacy card.

---

## How jobs work

- **Anyone signed in** can post a job (not just recruiters)
- Listings show a **direct phone** button when the job is gig-type — perfect for low-literacy / first-time-online workers who'd rather call than chat
- For salaried jobs, applicants can click **Apply now** with an optional cover letter
- Posters can see all applicants with their phone, email, skills, resume, and a **Message** button to start a conversation
- Applications also fire a notification to the poster

---

## API reference

```
# Messages
GET    /api/messages/conversations           List with unread counts
GET    /api/messages/unread-count            For nav badge
GET    /api/messages/:userId                 Get thread with one user
POST   /api/messages/:userId                 Send a message
DELETE /api/messages/message/:id             Delete own message

# Jobs
GET    /api/jobs?category=X&type=Y&search=Z  List with filters
GET    /api/jobs/me/posted                   My listings
GET    /api/jobs/me/applications             My applications
GET    /api/jobs/:id                         Single job
GET    /api/jobs/:id/applications            Applicants (owner only)
POST   /api/jobs                             Create
PATCH  /api/jobs/:id                         Update own
DELETE /api/jobs/:id                         Delete own
POST   /api/jobs/:id/apply                   Apply { coverLetter?, resumeUrl? }

# Profile (privacy)
PATCH  /api/profile/me                       Now accepts:
                                             { showPhone, showEmail, showLocation, showDob }
```

---

## Notes

- The 14 job categories are: **Tech**, **Professional/Office**, **Education**, **Healthcare**, **Driver**, **Cook**, **Household help**, **Security guard**, **Labour/Construction**, **Electrician/Plumber**, **Gardener**, **Beauty/Salon**, **Retail/Shop**, **Other**
- Messages poll every 5 seconds when the thread is open, and every 15 seconds for the conversations list. For true real-time you'd hook up Socket.io (the app already has it set up for other features).
- Block list is respected — if you block someone, you won't see their messages or jobs, and they can't message you.
- This delivery does **not** add filters by salary range / wage on the jobs board — let me know if you want that next.

---

Tell me if anything breaks or behaves unexpectedly. The new pages are functional but the visual polish can be tightened up later (e.g. mobile back-button on Messages thread, applicant filtering on the JobApplications page).
