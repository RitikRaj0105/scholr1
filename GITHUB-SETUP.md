# Push Scholr to GitHub — One-time setup + every-time workflow

## 1. First, drop in the new .gitignore

```powershell
# Extract just the .gitignore to your scholr folder
Expand-Archive C:\Users\rraj8\Downloads\scholr-git-setup.zip -DestinationPath C:\Users\rraj8\scholr -Force
```

## 2. Check git is installed

```powershell
git --version
```

If you get "git is not recognized" → install Git from https://git-scm.com/download/win, then restart PowerShell.

## 3. First-time setup (only do this once)

### a) Configure your identity
```powershell
git config --global user.name "Your Name"
git config --global user.email "your@email.com"
```

### b) Create the repo on GitHub
1. Go to https://github.com/new
2. Repository name: `scholr`
3. **Set it to PRIVATE** (recommended, since this is your project)
4. **Don't** initialize with README/gitignore — you already have files locally
5. Click "Create repository"

### c) Initialize git locally and push
```powershell
cd C:\Users\rraj8\scholr

# Initialize git
git init

# Add all files (gitignore will skip node_modules, .env, etc.)
git add .

# First commit
git commit -m "Initial commit — Scholr EdTech platform"

# Set main as default branch
git branch -M main

# Connect to your GitHub repo (replace YOUR_USERNAME)
git remote add origin https://github.com/YOUR_USERNAME/scholr.git

# Push for the first time
git push -u origin main
```

GitHub will ask you to authenticate. Easiest way: use a Personal Access Token.

### d) Create a GitHub Personal Access Token (only once)
1. Go to https://github.com/settings/tokens
2. Click "Generate new token (classic)"
3. Note: "scholr-laptop" (or any name)
4. Expiration: 90 days (or whatever you prefer)
5. Scopes: check **`repo`** (gives full repo access)
6. Click "Generate token"
7. **Copy the token** — you only see it once!
8. When git asks for password during `git push`, paste the token (not your GitHub password)

Windows will save it after the first push so you won't need to type it again.

---

## 4. Every-time workflow — push your changes

After you install a new zip from me and confirm it works, just run these 3 commands:

```powershell
cd C:\Users\rraj8\scholr

git add .
git commit -m "Add admin panel + role gates"
git push
```

Change the message to describe what you changed. Examples:
- `"Add teacher classrooms system"`
- `"Fix role enum bug + React Query cache leak"`
- `"Add career section with match scoring"`
- `"Add code execution fix + problem approval workflow"`

That's literally it. 3 commands every time.

---

## Useful commands

### See what's changed before committing
```powershell
git status
```

### See what files would be committed (without committing)
```powershell
git diff --stat
```

### Undo all uncommitted changes (careful!)
```powershell
git checkout .
```

### Commit only specific files
```powershell
git add backend/src/controllers/career.controller.ts
git commit -m "Update career match scoring formula"
git push
```

### Check your commit history
```powershell
git log --oneline -20
```

### Pull latest from GitHub (if you edit on another machine)
```powershell
git pull
```

---

## CRITICAL — verify .env is NOT being pushed

After your first `git add .`, run this to make sure:

```powershell
git status | findstr ".env"
```

If you see `.env` files in the output → STOP, don't commit. The .gitignore should hide them. If they appear, run:

```powershell
git rm --cached backend/.env frontend/.env
git rm --cached .env
git commit -m "Remove .env from tracking"
```

If you already pushed .env to GitHub by accident:
1. Rotate any secrets that were in there (new DB password, new JWT secret)
2. Use https://github.com/newren/git-filter-repo to scrub history (or contact me, I'll help)

---

## What's in the zip

Just the `.gitignore` file — the rest of your project stays exactly as it is.

After dropping in the .gitignore, follow the steps above.
