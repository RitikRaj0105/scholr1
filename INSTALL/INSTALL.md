# Profile Setup System — Install Guide

Replaces the old 2-button "Student / Teacher" signup with:
- **One signup page** (just email + password)
- **One comprehensive profile setup** (5 nicely-paced steps after signup)
- **Role-based dashboard routing** after login
- **Light/dark mode toggle** with proper font colors (black text in light, white in dark)
- **Fully mobile + desktop responsive**

## Role → Dashboard Routing

| Role | Lands on | Notes |
|---|---|---|
| **STUDENT** (School) | `/dashboard` | Main student dashboard |
| **COLLEGE_STUDENT** | `/dashboard` | Same student dashboard |
| **TEACHER** | `/teacher` | Teacher panel |
| **RECRUITER** | `/recruiter` | TODO: build this dashboard |
| **WORKING_PROFESSIONAL** | `/dashboard/feed` | Social feed |
| **PARENT** | `/dashboard` | Student dashboard (to monitor child) |
| **SUPER_ADMIN / SCHOOL_ADMIN / COLLEGE_ADMIN** | `/admin` | Admin panel |

## File structure

```
frontend/src/
├── pages/auth/
│   ├── ProfileSetup.jsx        ← NEW (the 5-step setup form)
│   ├── Signup.jsx              ← REPLACED (no more role buttons)
│   ├── Login.jsx               ← REPLACED (role-based redirect)
│   └── styles/
│       ├── ProfileSetup.css    ← NEW
│       └── Signup.css          ← NEW (shared by Login + Signup)
├── components/
│   ├── ThemeToggle.jsx         ← NEW (floating light/dark switcher)
│   └── styles/
│       └── ThemeToggle.css     ← NEW
└── styles/
    └── theme.css               ← NEW (global light/dark rules)
```

## Install steps

### 1. Extract zip

```powershell
Expand-Archive C:\Users\rraj8\Downloads\scholr-profile-setup.zip -DestinationPath C:\Users\rraj8\scholr -Force
```

### 2. Patch `App.tsx`

Open `C:\Users\rraj8\scholr\frontend\src\App.tsx` and:

- Add this import near the top:
  ```tsx
  import ProfileSetup from './pages/auth/ProfileSetup.jsx';
  import ThemeToggle from './components/ThemeToggle.jsx';
  ```

- Add `<ThemeToggle />` just inside `<BrowserRouter>`, above `<Routes>`.

- Add this route inside `<Routes>`:
  ```tsx
  <Route path="/profile-setup" element={
    <ProtectedRoute><ProfileSetup /></ProtectedRoute>
  } />
  ```

A full reference example is in `INSTALL/App.tsx.example` in this zip.

### 3. Patch `main.tsx`

Open `C:\Users\rraj8\scholr\frontend\src\main.tsx` and add the theme import below your existing index.css:

```tsx
import './styles/index.css';
import './styles/theme.css';  // ADD THIS
```

### 4. Add `onboardingDone` to auth store (if missing)

Open `C:\Users\rraj8\scholr\frontend\src\store\authStore.ts` — make sure the `User` type has:

```ts
type User = {
  // ...existing fields
  onboardingDone?: boolean;
};
```

The backend already returns this field (it's in your schema).

### 5. Restart frontend

Hot-reload should pick up the new files automatically. If not:
```powershell
cd C:\Users\rraj8\scholr\frontend
# Ctrl+C, then:
npm run dev
```

No backend changes needed — uses existing `/api/profile/onboarding/step1`, `step2`, `step3` endpoints.

## Test it

### Flow 1 — New signup
1. Go to http://localhost:5173/signup
2. Enter email + password → click "Continue"
3. Lands on `/profile-setup`
4. Walk through 5 steps:
   - Step 1: Name, phone, DOB, gender
   - Step 2: Country, state, city
   - Step 3: Pick role (6 cards)
   - Step 4: Role-specific fields (changes based on role picked)
   - Step 5: Banner, avatar, headline, bio, skills, social links
5. Click "Complete profile"
6. Auto-redirects to correct dashboard based on chosen role

### Flow 2 — Existing user logs in
1. Go to http://localhost:5173/login
2. If `onboardingDone=false` → redirected to `/profile-setup` to finish
3. If `onboardingDone=true` → goes straight to their role's dashboard

### Flow 3 — Theme toggle
1. Click the moon/sun icon in the top-right corner
2. Watch the whole page switch:
   - **Light mode:** black fonts on white background
   - **Dark mode:** white fonts on dark background
3. Choice persists across page reloads (saved to localStorage)

### Flow 4 — Mobile responsiveness
1. Open Chrome DevTools (F12) → Toggle device toolbar (Ctrl+Shift+M)
2. Pick "iPhone 12 Pro" or "Pixel 7"
3. Form stacks vertically, buttons go full-width, role cards become single-column
4. All inputs remain comfortably tappable

## Light/Dark mode behavior

- **Default:** matches your system preference (`prefers-color-scheme`)
- **Override:** click the toggle button → manual choice saved
- **Light mode rule:** all text becomes `#0f172a` (near-black)
- **Dark mode rule:** all text becomes `#fafaf8` (near-white)
- Backgrounds, borders, inputs all flip accordingly

The theme CSS uses CSS variables, so any component that uses `var(--text-primary)`, `var(--bg-card)`, etc. will automatically respect the theme without code changes.

## Where each file lives

| File | Path |
|---|---|
| Main form | `frontend/src/pages/auth/ProfileSetup.jsx` |
| Form styles | `frontend/src/pages/auth/styles/ProfileSetup.css` |
| Signup | `frontend/src/pages/auth/Signup.jsx` |
| Login | `frontend/src/pages/auth/Login.jsx` |
| Auth styles | `frontend/src/pages/auth/styles/Signup.css` |
| Theme toggle | `frontend/src/components/ThemeToggle.jsx` |
| Toggle styles | `frontend/src/components/styles/ThemeToggle.css` |
| Global theme | `frontend/src/styles/theme.css` |

Every JSX has its CSS in a sibling `styles/` folder — easy to edit independently.

## Troubleshooting

**"Module not found: @/store/authStore"**
- Your Vite config needs the `@` alias. Check `vite.config.ts` has:
  ```ts
  resolve: { alias: { '@': path.resolve(__dirname, './src') } }
  ```

**"Cannot find module './styles/ProfileSetup.css'"**
- Make sure the zip extracted the `styles/` subfolder inside `pages/auth/`.

**Theme doesn't switch**
- Check the browser console for errors.
- Make sure `theme.css` is imported in `main.tsx`.
- Hard refresh: Ctrl+Shift+R.

**Avatar/banner upload fails with 404**
- Backend endpoints used: `/api/social/upload/avatar` and `/api/profile/me/banner`
- Both already exist in your backend (see `profile_routes.ts` and `social_routes.ts`).

**Login still uses old role-redirect logic**
- The new `Login.jsx` exports a `routeForUser()` helper. Make sure the new file replaced the old one.
