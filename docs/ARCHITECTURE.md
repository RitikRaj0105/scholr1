# Scholr — Architecture

## Layers

```
React (Vite)  ──HTTPS──▶  Express (Node.js 20)  ──Prisma──▶  PostgreSQL
   │                          │       │
   │                          │       └──▶  OpenAI API
   └─Socket.io───────────────▶│
                              └──▶ Nodemailer (OTP / reset)
```

- **Frontend** is a fully static SPA built with Vite, deployed to **Vercel**.
- **Backend** is a Node 20 Express service deployed to **Railway** with **Docker**.
- **Database** is Postgres (Railway plugin or Neon).
- **Realtime** uses Socket.io alongside the same HTTP server.

## Auth flow
1. Client sends `email + password` to `/auth/login`.
2. API verifies via bcrypt, signs an access token (15m) and a refresh token (30d), stores the refresh token in DB, sets it as `httpOnly Secure SameSite=None` cookie.
3. Client stores access token in `localStorage`; axios interceptor sets `Authorization` header.
4. On 401 the interceptor calls `/auth/refresh` which rotates and returns a new pair.
5. `/auth/logout` revokes the session.

## AI integration
- `src/ai/openaiClient.js` exposes a single `chat()` helper with graceful fallback when no `OPENAI_API_KEY` is configured.
- Domain prompts live in `src/ai/{mentor,studyPlanner,wellness,career}.js`.

## Browser extension
- Manifest V3 service worker reads the user's blocklist + active focus session every minute.
- Uses `declarativeNetRequest` dynamic rules to redirect distracting domains to `blocked.html` while a focus session is `ACTIVE`.

## Folder map
See [README.md](../README.md).

## Scaling notes
- Replace `localStorage` access tokens with httpOnly access cookies if you require XSS-hardening — minor refactor of the axios layer.
- Add Redis-backed rate-limit for multi-instance deployments.
- Move OpenAI calls behind a queue (BullMQ) for cost control + streaming.
- Add a CDN / Cloudflare in front of `/api` for static caching of public marketplace listings.
