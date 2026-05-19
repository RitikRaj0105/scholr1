# Scholr API

Base URL — local: `http://localhost:5000/api` · production: `https://<your-railway-app>.up.railway.app/api`

All authenticated requests must send `Authorization: Bearer <accessToken>`. Refresh tokens are kept in an httpOnly cookie. The frontend axios client refreshes automatically.

## Auth `/api/auth`
| Method | Path | Body | Description |
| --- | --- | --- | --- |
| POST | `/signup` | `{name, username, email, password}` | Create account, returns access + refresh cookie |
| POST | `/login` | `{email, password}` | Login |
| POST | `/refresh` | — (cookie) | Rotate tokens |
| POST | `/logout` | — | Revoke session |
| GET  | `/me` | — | Current user |
| POST | `/google` | `{idToken}` | Sign in with Google |
| POST | `/otp/request` | `{email, purpose}` | Send 6-digit OTP via email |
| POST | `/otp/verify` | `{email, code, purpose}` | Verify OTP |
| POST | `/forgot-password` | `{email}` | Trigger reset OTP |
| POST | `/reset-password` | `{email, code, password}` | Reset password |

## Users `/api/users`
- `GET /me` — profile + prefs + achievements
- `PATCH /me` — `{name, username, avatar, bio, timezone}`
- `GET /preferences` · `PATCH /preferences`
- `GET /search?q=` — search users

## Tasks `/api/tasks`
- `GET /` `?status=&studyPlanId=`
- `GET /summary` — counts
- `POST /` `{title, description?, priority?, dueAt?, tags?, studyPlanId?}`
- `PATCH /:id` · `DELETE /:id`

## Study plans `/api/study-plans`
- `GET /` · `GET /:id`
- `POST /` `{title, goal?, startDate, endDate, hoursPerDay?, weakTopics?, targetGrade?, subjects?}` — runs OpenAI study planner
- `POST /:id/recompute` — recompute progress from tasks
- `DELETE /:id`

## Focus `/api/focus`
- `GET /sessions` · `POST /sessions` `{mode, plannedMin, notes?}` · `PATCH /sessions/:id`
- `GET /analytics` — 30-day rollup
- `GET /blocked-sites` · `POST /blocked-sites` · `DELETE /blocked-sites/:id` · `POST /blocked-sites/seed`
- `POST /hits` `{focusSessionId, domain}` — record a blocked-page hit (used by extension)

## Productivity `/api/productivity`
- `GET /logs` — last 30 days
- `GET /streaks` — current streak

## Wellness `/api/wellness`
- `GET /moods` · `POST /moods` `{mood, stress, energy, note?}`
- `GET /insight` — AI-generated mood insight
- `GET /journal` · `POST /journal` `{title, content, mood?}` · `DELETE /journal/:id`

## Career `/api/career`
- `GET /` · `PATCH /` `{strengths, interests, values, personalityType?}`
- `POST /recompute` — runs OpenAI career engine

## Life skills `/api/life-skills`
- `GET /lessons?category=` (public)
- `GET /progress` (auth) · `POST /lessons/:id/complete`

## AI `/api/ai`
- `GET /chats` · `GET /chats/:id` · `DELETE /chats/:id`
- `POST /chat` `{chatId?, context, message}` — streams a reply (non-streaming JSON in this build)

## Social `/api/social`
- Rooms — `GET /rooms`, `POST /rooms`, `POST /rooms/:id/join`, `POST /rooms/:id/leave`, `GET /rooms/:id/messages`, `POST /rooms/:id/messages`
- Friends — `GET /friends`, `GET /friends/requests`, `POST /friends/request`, `PATCH /friends/requests/:id`
- Challenges — `GET /challenges`, `POST /challenges`, `POST /challenges/:id/join`
- Leaderboard — `GET /leaderboard?scope=global|weekly|monthly`

## Marketplace `/api/marketplace`
- `GET /?q=&category=` (public)
- `GET /:id` (public)
- `POST /`, `PATCH /:id`, `DELETE /:id` (auth seller)
- `POST /:id/reviews` `{rating, comment?}`

## Notifications `/api/notifications`
- `GET /` · `POST /:id/read` · `POST /read-all`

## Dashboard `/api/dashboard`
- `GET /overview` — single payload powering the student home

## Admin `/api/admin` (ADMIN role)
- `GET /stats`
- `GET /users?q=` · `PATCH /users/:id/role` · `PATCH /users/:id/active`
- `PATCH /listings/:id/approve`

## Sockets

Connect with `socket.auth = { token }`. Events:
- Client → `room:join {roomId}`, `room:leave {roomId}`, `room:message {roomId, content}`, `typing {roomId}`
- Server → `room:message`, `room:presence`, `presence:update`, `typing`
