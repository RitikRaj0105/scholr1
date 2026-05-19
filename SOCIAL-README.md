# Social Feed — Delivery 6

LinkedIn-style social feature for students. Built with privacy and safety in mind.

## What's included

### Posts
- **3 post types**:
  - `POST` — regular text post
  - `ACHIEVEMENT` — share a test/exam achievement (title + subject + score)
  - `CERTIFICATE` — share a certification (title + issuer + credential URL)
  - `MILESTONE` — for streaks, level-ups, badges (auto-generated in future)
- **3 visibility levels**:
  - `PUBLIC` — anyone signed in can see
  - `FOLLOWERS_ONLY` — only people who follow you
  - `PRIVATE` — only you (like a diary entry)

### Engagement
- Like (optimistic UI, instant feedback)
- Comment (with delete by author or post owner)
- Share (copies link + records share count)

### Social graph
- Follow / Unfollow
- See followers count + following count on profiles
- Feed shows posts from you + people you follow (chronological)

### Safety + Privacy
- **Block users** — blocks both ways (you don't see them, they don't see you)
- Existing follows are removed when you block
- Visibility rules enforced at the API level (backend filters posts, not just UI)
- Block list checked on every post fetch, like, comment

### User profiles
- Public profile at `/dashboard/profile/:userId`
- Your own profile at `/dashboard/profile`
- Editable bio + headline (e.g. "JEE Aspirant · Class 12")
- Shows posts (filtered by visibility based on viewer)
- Stats: posts, followers, following, certificates

### Search
- Search users by name or email (min 2 chars)
- Filters out blocked users

## Install

```powershell
# 1. Extract
Expand-Archive C:\Users\rraj8\Downloads\scholr-social.zip -DestinationPath C:\Users\rraj8\scholr -Force

# 2. Push schema (adds Post, PostLike, PostComment, PostShare, Follow, Block, Certificate + bio/headline on User)
cd C:\Users\rraj8\scholr\backend
npx prisma db push

# 3. Restart backend
npm run dev
```

## Test the flow

1. **Create 2 student accounts** (so you can test follow + interactions)
2. Log in as User A
3. Click **Feed** in sidebar → lands on `/dashboard/feed`
4. **Create a post**:
   - Type something
   - Click "Achievement" → fill in title/subject/score
   - Pick visibility (Public / Followers / Private)
   - Click Post
5. **Search for User B**: click "Find people" → type their name
6. Click their profile → click **Follow**
7. Log out, log in as User B
8. Open Feed → User A's post should appear (if PUBLIC or FOLLOWERS_ONLY since you follow)
9. **Like + Comment + Share** on User A's post
10. Visit your own profile (click your name at bottom of sidebar) → see your follower count went up

## Security model

### How data is isolated
Every social operation enforces:

1. **Block check first**: if either user blocked the other, the request fails with 404 ("Post not available") — they can't tell whether the user/post even exists
2. **Visibility check**: `PUBLIC` available to everyone, `FOLLOWERS_ONLY` checks follow relationship, `PRIVATE` only own
3. **Ownership check** on destructive actions: delete post, delete comment (allowed if you authored the comment OR the post)

### What users CAN'T do
- See posts from blocked users
- See PRIVATE posts that aren't theirs
- See FOLLOWERS_ONLY posts of people they don't follow
- Delete other people's posts/comments
- Block themselves
- Follow themselves

### What admins can do (NOT included in this delivery)
Admin moderation tools (delete any post, suspend users) are a future addition — Delivery 7.

## API endpoints

```
Feed
GET    /api/social/feed                    Paginated chronological feed

Posts
POST   /api/social/posts                   Create post
GET    /api/social/posts/:id               Get single post
DELETE /api/social/posts/:id               Delete own post

Engagement
POST   /api/social/posts/:id/like          Toggle like
GET    /api/social/posts/:id/comments      List comments
POST   /api/social/posts/:id/comments      Add comment
DELETE /api/social/comments/:commentId     Delete comment (author or post owner)
POST   /api/social/posts/:id/share         Share

Profiles
GET    /api/social/users/:userId           Get user profile
GET    /api/social/users/:userId/posts     Get their posts (filtered)
PATCH  /api/social/me/profile              Update own bio + headline

Follow
POST   /api/social/follow/:userId          Follow
DELETE /api/social/follow/:userId          Unfollow

Search
GET    /api/social/search?q=name           Search users (min 2 chars)

Safety
POST   /api/social/block/:userId           Block
DELETE /api/social/block/:userId           Unblock
```

## Files

```
backend/
  prisma/schema.prisma                     ← schema additions (8 models + 2 enums + bio/headline on User)
  src/controllers/social.controller.ts     ← NEW
  src/routes/social.routes.ts              ← NEW
  src/routes/index.ts                      ← MODIFIED (mount /api/social)

frontend/
  src/pages/dashboard/Feed.tsx             ← NEW
  src/pages/dashboard/Profile.tsx          ← NEW
  src/components/social/PostCard.tsx       ← NEW
  src/components/social/CreatePost.tsx     ← NEW
  src/components/dashboard/DashboardLayout.tsx  ← MODIFIED (Feed link + clickable user card)
  src/App.tsx                              ← MODIFIED (feed + profile routes)
```

## Roadmap — what's next for social

### Delivery 6.5 — Polish + moderation
- Admin can delete any post / suspend users
- Report post button
- Edit own post (with edited-at timestamp)
- Hashtags

### Delivery 7 — Real images
- File upload for avatars + cover photos
- Image attachments on posts
- Certificate image preview

### Delivery 8 — Real-time
- Notifications (someone liked / commented / followed you)
- Direct messages
- Online presence

For now: solid MVP that already mirrors most of LinkedIn's core functionality at a student scale.
