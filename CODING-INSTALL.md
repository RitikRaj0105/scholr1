# Coding Module — Install Guide

This addon adds a full LeetCode-style coding platform to Scholr:
- Monaco code editor (VS Code's editor) on the frontend
- Self-hosted Judge0 execution engine (Docker)
- 8 seed problems across difficulties
- Run + Submit + Test review + Submission history
- Stats dashboard

Supports 12 languages out of the box: Python, JavaScript, TypeScript, C, C++, Java, Go, Rust, Ruby, C#, Kotlin, Swift.

---

## What's in this addon

```
backend/
  src/
    services/judge0.service.ts        ← NEW (Judge0 API client)
    controllers/code.controller.ts     ← NEW (run/submit/list endpoints)
    routes/code.routes.ts              ← NEW
    routes/index.ts                    ← MODIFIED (mounts /api/code)
    config/env.ts                      ← MODIFIED (Judge0 + REDIS_URL fixes)
  prisma/
    schema.prisma                      ← MODIFIED (CodeSubmission model)
    seed-problems.ts                   ← NEW (8 problems with test cases)
frontend/
  src/
    pages/dashboard/Code.tsx           ← NEW (problem list)
    pages/dashboard/CodeProblem.tsx    ← NEW (editor + run/submit)
    App.tsx                            ← MODIFIED (routes)
judge0/
  docker-compose.yml                   ← NEW (Judge0 stack)
  judge0.conf                          ← NEW (Judge0 config)
```

---

## Prerequisites — install Docker first

Judge0 runs in Docker. Download **Docker Desktop for Windows**: https://www.docker.com/products/docker-desktop/

- ~3 GB download
- Asks to enable WSL2 — say yes
- Requires Windows restart after install
- After restart, open Docker Desktop and wait until it says "Docker Desktop is running"

Verify it's working:
```powershell
docker --version
docker run hello-world
```

The second command should pull a tiny image and print "Hello from Docker!".

---

## Step 1 — Extract the zip into your project

```powershell
cd C:\Users\rraj8\Downloads
Expand-Archive scholr-coding-addon.zip -DestinationPath C:\Users\rraj8\scholr -Force
```

This drops files into the right paths (`backend\`, `frontend\`, `judge0\`), overwriting where needed.

---

## Step 2 — Start Judge0 (one-time, ~5 min download)

```powershell
cd C:\Users\rraj8\scholr\judge0
docker compose up -d
```

This pulls four Docker images (~700 MB total) and starts the Judge0 stack on `http://localhost:2358`. First run is slow (downloads); after that, takes ~10 seconds to start.

Verify it's running:
```powershell
docker compose ps
```

You should see four services running: `server`, `workers`, `db`, `redis`.

Test the Judge0 API:
```powershell
curl http://localhost:2358/about
```

Should return JSON with `"version": "1.13.1"`.

To **stop** Judge0 later (when you're done coding for the day, save RAM): `docker compose down`
To **start** again: `docker compose up -d`

---

## Step 3 — Update backend

```powershell
cd C:\Users\rraj8\scholr\backend
```

**a) Add JUDGE0_URL to `.env`** — open `.env` in Notepad and add this line at the end:

```
JUDGE0_URL=http://localhost:2358
```

**b) Push the schema change to Supabase** (adds `CodeSubmission` table + `CodeVerdict` enum):

```powershell
npx prisma db push
```

You should see: `Your database is now in sync with your Prisma schema.`

**c) Seed the starter problems** into your database:

```powershell
npx tsx prisma/seed-problems.ts
```

Output:
```
Seeding 8 coding problems…
  ✓ hello-world
  ✓ sum-two-numbers
  ✓ fizzbuzz
  ✓ reverse-string
  ✓ palindrome-check
  ✓ fibonacci
  ✓ two-sum
  ✓ valid-parentheses
Done.
```

**d) Restart the backend** — Ctrl+C in the backend PowerShell window, then:

```powershell
npm run dev
```

---

## Step 4 — Update frontend deps

Open a new PowerShell window (don't stop the dev server):

```powershell
cd C:\Users\rraj8\scholr\frontend
npm install @monaco-editor/react@4.6.0 react-markdown@9.0.1 remark-gfm@4.0.0
```

The frontend dev server should hot-reload automatically. If not:
- Ctrl+C in the frontend window
- `npm run dev`

---

## Step 5 — Try it

1. Open http://localhost:5173 → log in
2. Click **Coding** in the sidebar
3. You should see 8 problems in a list, plus stats showing "0 / 8 solved"
4. In the top-right, a small badge says **"Judge0 online"** (cyan dot)
5. Click **Hello, World!**
6. You're in the editor. Write the code:
   ```python
   print("Hello, World!")
   ```
7. Click **Run** → see the output panel
8. Click **Submit** → see test results, verdict, submission history populated

---

## Troubleshooting

**Judge0 offline badge in the UI:**
- Check Docker Desktop is running
- Check the Judge0 stack: `cd judge0 && docker compose ps`
- Try restarting: `docker compose restart`

**`docker compose up` fails with "Cannot connect to Docker daemon":**
- Docker Desktop isn't running — start it from the Start menu

**Submission hangs at "Submitting…":**
- Judge0 is slow on cold start — wait 10-15s for the first one
- Check Docker resources — Docker Desktop → Settings → Resources → give it at least 4 GB RAM

**"Unsupported language" error when submitting:**
- The language ID in `judge0.service.ts` might not match your Judge0 build
- Run `curl http://localhost:2358/languages` to see your installed languages with IDs
- Update `LANGUAGE_IDS` in `judge0.service.ts` to match

**Seed fails with "Unknown property `testCases`":**
- Run `npx prisma generate` to regenerate the Prisma Client
- Then try seed again

---

## What's running where

```
http://localhost:5173    →  Frontend (Vite)
http://localhost:4000    →  Your backend (Express)
http://localhost:2358    →  Judge0 server
   ├─ talks to db (postgres in Docker — separate from Supabase)
   ├─ talks to redis (in Docker)
   └─ runs code in isolated sandboxes per submission
```

Your Scholr database (Supabase) stores problems + submissions.
Judge0's own database (local Docker) just queues active executions — not your data.

---

## Going to production

The current setup is **dev-only**. For production you'd:

1. Deploy Judge0 to a separate VPS (Hetzner CX22, $5/mo). Open port 2358 only to your backend's IP.
2. Set `AUTHN_TOKEN` in `judge0.conf` to a random string. Add it to your backend's `.env` as `JUDGE0_AUTH_TOKEN=<same value>`.
3. Add a rate limiter per user per problem on your backend (prevents abuse).
4. Increase Docker memory / worker count for higher throughput.

Save that for after the app is live. For now, local Judge0 + Supabase is plenty.
