# Tests Module — Installation

Adds AI-powered test generation, multi-question quiz UI, and graded results review to your Scholr scaffold.

## What's in this addon

- `backend/src/controllers/test.controller.ts` — REPLACES existing file. Adds graded-question review payload to submit endpoint.
- `frontend/src/pages/dashboard/Tests.tsx` — NEW. List + generate page at `/dashboard/tests`.
- `frontend/src/pages/dashboard/TestTake.tsx` — NEW. Take + results page at `/dashboard/tests/:id`.
- `frontend/src/App.tsx` — REPLACES existing file. Adds two new routes.

## How to install

1. Extract this zip on top of your `C:\Users\rraj8\scholr\` folder.
   - File Explorer will ask "Replace files in destination?" — click **Yes**.
2. Restart the backend:
   - Backend PowerShell window → Ctrl+C → `npm run dev`
3. Frontend hot-reloads automatically. If not, restart it too.

## Test it

1. Open http://localhost:5173
2. Login if you're not already
3. Click **Tests** in the sidebar
4. Click **Generate test**
5. Fill in:
   - Subject: e.g. "Linear algebra basics"
   - Questions: 5 (start small for first AI run)
   - Difficulty: Easy or Medium
6. Click **Generate**

The first generation can take 30–60 seconds with Ollama (model loads into RAM). After that, faster.

Once generated, you'll be taken straight to the test. Answer the questions, hit Submit, see your score + review with correct answers and explanations.

## Troubleshooting

- **"Could not generate test"** → AI service isn't running. Check Ollama is up (`ollama list`) and backend `.env` has the right OPENAI_BASE_URL.
- **Test generates but questions look weird** → Small local models sometimes produce malformed output. Try a larger model: `ollama pull llama3.2:8b` and update `OPENAI_MODEL` in `.env`.
- **404 on /dashboard/tests** → Frontend didn't pick up new routes. Stop and restart `npm run dev`.
