# Deploying Scholr

## 1. PostgreSQL
Use Railway's Postgres plugin, Neon, Supabase, or any managed Postgres.
Copy the connection string into `DATABASE_URL`.

## 2. Backend → Railway
1. Push the repo to GitHub.
2. New Railway project → "Deploy from GitHub" → choose **`backend/`** as root.
3. Add Postgres plugin and copy `DATABASE_URL` into the service variables.
4. Set the rest of the variables from `backend/.env.example`. Required:
   - `JWT_ACCESS_SECRET`, `JWT_REFRESH_SECRET` (any long random strings)
   - `OPENAI_API_KEY` (optional — features fall back to mock without it)
   - `CLIENT_URL` = your Vercel URL (used for CORS + cookie `sameSite=none`)
5. Railway detects `Dockerfile`. First boot runs `prisma migrate deploy` automatically.
6. (Optional) `railway run npm run seed` to load demo data.

## 3. Frontend → Vercel
1. Import the repo on Vercel.
2. Set **Root Directory** to `frontend/`.
3. Build command `npm run build`, output `dist`.
4. Env:
   - `VITE_API_URL` = `https://<your-railway>.up.railway.app/api`
   - `VITE_SOCKET_URL` = `https://<your-railway>.up.railway.app`
5. Deploy.

## 4. Browser extension
1. `chrome://extensions` → enable Developer Mode.
2. Load unpacked → select `extension/`.
3. Open the popup, paste your access token (DevTools → `localStorage.scholr_access`) and your API URL.

## 5. Health check
- `GET /health` → `{ status: 'ok', db: 'up' }`
