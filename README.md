# Code Execution Fix + Teacher Problem Approval Workflow

## Two fixes in one delivery

### Fix 1: Code execution "always error" bug
**Root cause:** Judge0's `expected_output` parameter does strict byte-level comparison.
When Python prints `8\n` but expected output is `8` (no trailing newline), Judge0 returns
"Wrong Answer" even though the answer is correct.

**Fix:** Backend no longer sends `expected_output` to Judge0. Instead:
1. Judge0 just runs the code and returns stdout
2. Backend trims whitespace from both actual output and expected output
3. Backend compares them ourselves
4. This handles trailing newlines, extra spaces, etc.

### Fix 2: Teacher creates problems → Admin approves

New schema field `status` on CodingProblem:
```
DRAFT → PENDING_REVIEW → APPROVED (visible to students)
                       → REJECTED (teacher can edit and resubmit)
```

**Teacher endpoints (require TEACHER role):**
- `GET /api/teacher/problems` — list my created problems (any status)
- `GET /api/teacher/problems/:slug` — view my problem
- `POST /api/teacher/problems` — create problem (status = PENDING_REVIEW)
- `PATCH /api/teacher/problems/:slug` — edit problem (only if DRAFT/REJECTED, re-submits for review)

**Admin endpoints (require admin role):**
- `GET /api/admin/problems/pending` — list all pending problems
- `POST /api/admin/problems/:slug/approve` — approve (status → APPROVED)
- `POST /api/admin/problems/:slug/reject` — reject with reason (status → REJECTED)

**Student-facing change:**
- `GET /api/code/problems` now only returns problems with `status = APPROVED`

Existing seed problems have `status: APPROVED` by default, so nothing breaks.

## Install

```powershell
# 1. Extract
Expand-Archive C:\Users\rraj8\Downloads\scholr-approval.zip -DestinationPath C:\Users\rraj8\scholr -Force

# 2. Push schema change (adds ProblemStatus enum + new columns)
cd C:\Users\rraj8\scholr\backend
npx prisma db push

# 3. Restart backend
npm run dev
```

## Test the code execution fix

1. Open a coding problem (e.g. Hello World)
2. Write correct Python: `print("Hello, World!")`
3. Click Run → should show stdout without errors
4. Click Submit → should show "Accepted" with all tests passed

If you still get errors, check:
- Is Docker Desktop running?
- Run `curl http://localhost:2358/about` — does it return JSON?
- Check the backend console for error messages

## Test the approval workflow

### As teacher:
```
POST /api/teacher/problems
Body: { slug, title, statement, difficulty, tags, starterCode, testCases }
```
The problem is created with status = PENDING_REVIEW.

### As admin:
```
GET /api/admin/problems/pending      → see pending problems
POST /api/admin/problems/:slug/approve   → approve it
POST /api/admin/problems/:slug/reject    → reject with { reviewNote: "reason" }
```

After approval, students can see the problem in their coding page.

## Files changed

```
backend/
  prisma/schema.prisma                    ← ProblemStatus enum, status + createdById on CodingProblem
  src/controllers/code.controller.ts      ← Fixed comparison, filter by APPROVED
  src/controllers/admin.controller.ts     ← Added pending list, approve, reject
  src/controllers/teacher.controller.ts   ← Added teacher problem CRUD
  src/routes/admin.routes.ts              ← Added approval routes
  src/routes/teacher.routes.ts            ← Added problem routes
```
