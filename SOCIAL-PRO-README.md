# Delivery 6.5 — Social Pro

Image uploads, profile pictures, in-app notifications, admin moderation.

## 4 features in one delivery

### 1. Image uploads
- **Avatars**: upload profile picture → resized to 256x256 webp → shown everywhere
- **Post images**: attach an image when creating a post → resized to max 1200px webp
- Stored locally at `backend/uploads/` (gitignored), served via Express static at `/uploads/*`
- Limits: 5MB max, JPEG/PNG/WebP/GIF only

### 2. Profile picture everywhere
Single `<Avatar>` component used in:
- Posts (author avatar)
- Comments
- Profile page (your own + others')
- Dashboard sidebar (user card)
- Notification list
- Search results
- Admin user list
- Falls back to colored initials when no avatar uploaded

### 3. Notifications
You'll get notified when:
- Someone likes your post
- Someone comments on your post
- Someone follows you

Implementation:
- **Bell icon** at top-right of every dashboard page
- **Red badge** with unread count (polls every 30s)
- **Dropdown** with recent 10 notifications
- **Full Notifications page** at `/dashboard/notifications`
- Mark as read / mark all as read / delete

You DON'T get notified for your own actions (no notification when you like your own post).

### 4. Admin moderation
Three new admin tools:

**a) Delete any post**
- "Admin delete" option in post menu (visible only to admins on others' posts)
- Bypasses ownership check
- Cascades to delete likes/comments/reports

**b) Report posts** (user-facing)
- "Report post" option in post menu (visible on others' posts)
- 7 reasons: Spam, Harassment, Hate speech, Inappropriate, Misinformation, Copyright, Other
- Optional details (1000 chars max)
- One user can only report a post once

**c) Moderation queue** at `/admin/reports`
- Lists all reports filtered by status (PENDING / KEPT / REMOVED / DISMISSED)
- Shows reporter, reported post, reason
- 3 actions per report:
  - **Remove post** → deletes the post + marks report as REMOVED
  - **Keep** → marks report as KEPT (false alarm)
  - **Dismiss** → marks report as DISMISSED (no action)

**d) Suspend users** at `/admin/users`
- "Suspend" button next to each user (not on admins, not on self)
- Requires reason
- Optional duration (1-365 days, or empty = permanent)
- Suspended users CANNOT log in (error: "Account suspended until... reason: ...")
- "Unsuspend" button clears it instantly

## Install — 4 steps

### 1. Install new packages (multer + sharp)

```powershell
cd C:\Users\rraj8\scholr\backend
npm install multer sharp
npm install -D @types/multer
```

### 2. Extract the zip

```powershell
Expand-Archive C:\Users\rraj8\Downloads\scholr-social-pro.zip -DestinationPath C:\Users\rraj8\scholr -Force
```

### 3. Push schema (adds Report model, suspension fields, fromUser on Notification, imageUrl on Post)

```powershell
cd C:\Users\rraj8\scholr\backend
npx prisma db push
```

### 4. Restart backend

```powershell
# Ctrl+C, then:
npm run dev
```

Frontend hot-reloads. First time you visit, dashboard sidebar will show the new bell icon and avatars (initials at first).

## Test the flow

### Avatar upload
1. Click your name at the bottom-left sidebar → goes to your profile
2. Click the **camera icon** on your avatar
3. Pick an image (any size, will be resized)
4. After upload, refresh → your avatar shows everywhere (sidebar, posts you author, comments)

### Post with image
1. Go to `/dashboard/feed`
2. Click the **Image** button in the post composer
3. Select an image → shows preview
4. Add text → Post
5. Image appears in the post in feed

### Notifications
1. Sign in as User A → create a post
2. Sign in as User B (different browser/incognito) → like + comment on User A's post
3. Sign back in as User A → red bell badge appears with count
4. Click bell → see notifications
5. Click one → goes to feed (or wherever it links)

### Report a post
1. As User A: hover the **⋯ menu** on User B's post
2. Click **Report post**
3. Pick reason + add details → submit
4. As admin: go to `/admin/reports` → see the report
5. Click **Remove post** → post is deleted, report marked REMOVED

### Suspend user
1. As admin: go to `/admin/users`
2. Click **Suspend** next to a student
3. Enter reason + duration (or leave empty for permanent)
4. That user tries to log in → gets "Account suspended..." error
5. Admin clicks **Unsuspend** → user can log in again

## API endpoints added

```
Image uploads (multipart/form-data)
POST   /api/social/upload/avatar          field "image"
POST   /api/social/upload/post-image      field "image"

Reports
POST   /api/social/posts/:id/report       { reason, details? }

Notifications
GET    /api/notifications                 ?limit=30&cursor=...
GET    /api/notifications/unread-count
POST   /api/notifications/:id/read
POST   /api/notifications/mark-all-read
DELETE /api/notifications/:id

Admin moderation
DELETE /api/admin/posts/:id               (override ownership)
GET    /api/admin/reports                 ?status=PENDING
POST   /api/admin/reports/:id/review      { action: REMOVE_POST | KEEP_POST | DISMISS, note? }
POST   /api/admin/users/:userId/suspend   { reason, durationDays? }
POST   /api/admin/users/:userId/unsuspend
```

## Schema additions

```prisma
// Post: new field
imageUrl     String?   // optional image attachment

// User: new fields
suspendedAt      DateTime?
suspendedUntil   DateTime?   // null = permanent
suspendedReason  String?

// Notification: new field
fromUserId  String?   // who triggered the notification
fromUser    User?     // relation

// NEW NotificationType values
POST_LIKE
POST_COMMENT
FOLLOW

// NEW Report model with ReportReason + ReportStatus enums
```

## Files

```
backend/
  package.json                                 ← user runs npm install multer sharp
  prisma/schema.prisma                         ← Report model + 3 enums + new fields
  src/index.ts                                 ← /uploads static dir
  src/middleware/upload.ts                     ← NEW (multer + sharp)
  src/controllers/social.controller.ts         ← image upload, report, notifications wired
  src/controllers/notification.controller.ts   ← NEW
  src/controllers/admin.controller.ts          ← moderation: delete post, reports, suspend
  src/controllers/auth.controller.ts           ← block suspended users at login
  src/routes/social.routes.ts                  ← upload + report routes
  src/routes/notification.routes.ts            ← NEW
  src/routes/admin.routes.ts                   ← moderation routes
  src/routes/index.ts                          ← mount notifications

frontend/
  vite.config.ts                               ← proxy /uploads to backend
  src/App.tsx                                  ← notifications + reports routes
  src/components/social/Avatar.tsx             ← NEW (used everywhere)
  src/components/social/PostCard.tsx           ← rewritten with image/avatar/report
  src/components/social/CreatePost.tsx         ← image upload button
  src/components/social/NotificationBell.tsx   ← NEW (floating bell)
  src/components/dashboard/DashboardLayout.tsx ← uses Avatar + bell
  src/components/admin/AdminLayout.tsx         ← Reports link
  src/pages/dashboard/Profile.tsx              ← camera button for avatar
  src/pages/dashboard/Notifications.tsx        ← NEW (full page)
  src/pages/admin/AdminReports.tsx             ← NEW (moderation queue)
  src/pages/admin/AdminUsers.tsx               ← suspend/unsuspend buttons
```
