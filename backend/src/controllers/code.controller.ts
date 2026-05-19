import type { Request, Response } from 'express';
import { z } from 'zod';
import { prisma } from '../config/prisma.js';
import { BadRequest, NotFound } from '../utils/errors.js';
import {
  runOnJudge0,
  LANGUAGE_IDS,
  statusToVerdict,
  checkJudge0Health,
} from '../services/judge0.service.js';

// ─── Health ─────────────────────────────────────

export const health = async (_req: Request, res: Response) => {
  const ok = await checkJudge0Health();
  res.json({ ok, judge0: ok ? 'up' : 'down' });
};

// ─── Problems ────────────────────────────────────

export const listProblems = async (req: Request, res: Response) => {
  const userId = req.user!.id;
  const { difficulty, tag, search } = req.query;

  const problems = await prisma.codingProblem.findMany({
    where: {
      status: 'APPROVED', // Students only see approved problems
      ...(difficulty
        ? { difficulty: difficulty as 'EASY' | 'MEDIUM' | 'HARD' | 'EXPERT' }
        : {}),
      ...(tag ? { tags: { has: tag as string } } : {}),
      ...(search
        ? {
            OR: [
              { title: { contains: search as string, mode: 'insensitive' } },
              { slug: { contains: search as string, mode: 'insensitive' } },
            ],
          }
        : {}),
    },
    select: {
      id: true,
      slug: true,
      title: true,
      difficulty: true,
      tags: true,
      submissions: {
        where: { userId },
        select: { verdict: true },
        orderBy: { submittedAt: 'desc' },
        take: 1,
      },
      _count: { select: { submissions: { where: { userId } } } },
    },
    orderBy: { createdAt: 'asc' },
    take: 100,
  });

  res.json({ ok: true, problems });
};

export const getProblem = async (req: Request, res: Response) => {
  const userId = req.user!.id;
  const problem = await prisma.codingProblem.findUnique({
    where: { slug: req.params.slug },
    select: {
      id: true,
      slug: true,
      title: true,
      statement: true,
      difficulty: true,
      tags: true,
      starterCode: true,
      testCases: true,
      timeLimitMs: true,
      memoryLimitMb: true,
    },
  });
  if (!problem) throw NotFound('Problem not found');

  // Hide hidden test cases from problem detail
  const allCases =
    (problem.testCases as { input: string; expectedOutput: string; isHidden?: boolean }[]) ??
    [];
  const visibleCases = allCases.filter((t) => !t.isHidden);
  const hiddenCount = allCases.length - visibleCases.length;

  const submissionCount = await prisma.codeSubmission.count({
    where: { userId, problemId: problem.id },
  });

  res.json({
    ok: true,
    problem: {
      ...problem,
      testCases: visibleCases,
      hiddenTestCount: hiddenCount,
      submissionCount,
    },
  });
};

// ─── Run (sample input only — not saved) ────────

const runSchema = z.object({
  language: z.string().min(1).max(30),
  code: z.string().min(1).max(50_000),
  stdin: z.string().optional(),
});

export const runCode = async (req: Request, res: Response) => {
  const data = runSchema.parse(req.body);
  const languageId = LANGUAGE_IDS[data.language];
  if (!languageId) throw BadRequest(`Unsupported language: ${data.language}`);

  const result = await runOnJudge0({
    source_code: data.code,
    language_id: languageId,
    stdin: data.stdin ?? '',
    cpu_time_limit: 5,
    memory_limit: 256_000,
  });

  res.json({
    ok: true,
    output: {
      stdout: result.stdout ?? '',
      stderr: result.stderr ?? '',
      compileOutput: result.compile_output ?? '',
      status: result.status.description,
      time: result.time ? parseFloat(result.time) : null,
      memory: result.memory,
    },
  });
};

// ─── Submit (all test cases — saved) ────────────

const submitSchema = z.object({
  language: z.string().min(1).max(30),
  code: z.string().min(1).max(50_000),
});

export const submit = async (req: Request, res: Response) => {
  const userId = req.user!.id;
  const data = submitSchema.parse(req.body);
  const languageId = LANGUAGE_IDS[data.language];
  if (!languageId) throw BadRequest(`Unsupported language: ${data.language}`);

  const problem = await prisma.codingProblem.findUnique({
    where: { slug: req.params.slug },
  });
  if (!problem) throw NotFound('Problem not found');

  const testCases =
    (problem.testCases as { input: string; expectedOutput: string; isHidden?: boolean }[]) ??
    [];
  if (testCases.length === 0) throw BadRequest('Problem has no test cases');

  const timeLimit = problem.timeLimitMs / 1000; // seconds
  const memoryLimit = problem.memoryLimitMb * 1024; // KB

  const results: {
    input: string;
    expected: string;
    actual: string;
    passed: boolean;
    isHidden: boolean;
    error: string | null;
    runtimeMs: number | null;
    statusId: number;
  }[] = [];

  let firstFailure: number | null = null;

  for (let i = 0; i < testCases.length; i++) {
    const t = testCases[i];
    try {
      // DON'T send expected_output — Judge0's comparison is too strict
      // We compare ourselves after trimming whitespace
      const r = await runOnJudge0({
        source_code: data.code,
        language_id: languageId,
        stdin: t.input,
        cpu_time_limit: timeLimit,
        memory_limit: memoryLimit,
      });

      // Judge0 status 3 = code ran without error (since no expected_output sent)
      // Status 5 = TLE, 6 = CE, 7-12 = RE
      const codeRanOk = r.status.id <= 3;
      const actual = (r.stdout ?? '').replace(/\s+$/, '');
      const expected = t.expectedOutput.replace(/\s+$/, '');
      // Our comparison: code ran without error AND output matches (trimmed)
      const passed = codeRanOk && actual === expected;

      results.push({
        input: t.isHidden ? '<hidden>' : t.input,
        expected: t.isHidden ? '<hidden>' : expected,
        actual: t.isHidden && !passed ? '<hidden>' : actual,
        passed,
        isHidden: !!t.isHidden,
        error:
          r.stderr || r.compile_output
            ? (r.compile_output || r.stderr || '').slice(0, 1000)
            : null,
        runtimeMs: r.time ? Math.round(parseFloat(r.time) * 1000) : null,
        statusId: passed ? 3 : codeRanOk ? 4 : r.status.id, // 3=AC, 4=WA if output differs
      });
      if (!passed && firstFailure === null) firstFailure = i;
    } catch (err) {
      results.push({
        input: t.isHidden ? '<hidden>' : t.input,
        expected: t.isHidden ? '<hidden>' : t.expectedOutput,
        actual: '',
        passed: false,
        isHidden: !!t.isHidden,
        error: (err as Error).message,
        runtimeMs: null,
        statusId: 13, // internal error
      });
      if (firstFailure === null) firstFailure = i;
    }
  }

  const passedCount = results.filter((r) => r.passed).length;
  // Verdict = first failing test's verdict; AC if all passed
  const verdict =
    passedCount === results.length
      ? 'ACCEPTED'
      : statusToVerdict(results[firstFailure!].statusId);

  const totalRuntime = results.reduce((sum, r) => sum + (r.runtimeMs || 0), 0);
  const errorOutput = results.find((r) => r.error)?.error ?? null;

  const submission = await prisma.codeSubmission.create({
    data: {
      problemId: problem.id,
      userId,
      language: data.language,
      code: data.code,
      verdict,
      passedTests: passedCount,
      totalTests: results.length,
      runtimeMs: totalRuntime,
      errorOutput,
      results,
    },
  });

  res.status(201).json({
    ok: true,
    submission: {
      id: submission.id,
      verdict,
      passedTests: passedCount,
      totalTests: results.length,
      runtimeMs: totalRuntime,
      results,
      errorOutput,
    },
  });
};

// ─── Submissions list / detail ───────────────────

export const listSubmissions = async (req: Request, res: Response) => {
  const userId = req.user!.id;
  const problem = await prisma.codingProblem.findUnique({
    where: { slug: req.params.slug },
    select: { id: true },
  });
  if (!problem) throw NotFound('Problem not found');

  const submissions = await prisma.codeSubmission.findMany({
    where: { userId, problemId: problem.id },
    select: {
      id: true,
      language: true,
      verdict: true,
      passedTests: true,
      totalTests: true,
      runtimeMs: true,
      submittedAt: true,
    },
    orderBy: { submittedAt: 'desc' },
    take: 50,
  });

  res.json({ ok: true, submissions });
};

export const getSubmission = async (req: Request, res: Response) => {
  const userId = req.user!.id;
  const submission = await prisma.codeSubmission.findFirst({
    where: { id: req.params.submissionId, userId },
  });
  if (!submission) throw NotFound('Submission not found');
  res.json({ ok: true, submission });
};

// ─── Stats ───────────────────────────────────────

export const getCodeStats = async (req: Request, res: Response) => {
  const userId = req.user!.id;
  const totalProblems = await prisma.codingProblem.count();
  const submissions = await prisma.codeSubmission.findMany({
    where: { userId },
    select: { problemId: true, verdict: true, submittedAt: true, language: true },
    orderBy: { submittedAt: 'desc' },
  });

  const solvedIds = new Set(
    submissions.filter((s) => s.verdict === 'ACCEPTED').map((s) => s.problemId)
  );

  const byDifficulty: Record<string, { solved: number; total: number }> = {
    EASY: { solved: 0, total: 0 },
    MEDIUM: { solved: 0, total: 0 },
    HARD: { solved: 0, total: 0 },
    EXPERT: { solved: 0, total: 0 },
  };

  const diffs = await prisma.codingProblem.groupBy({
    by: ['difficulty'],
    _count: true,
  });
  for (const d of diffs) {
    if (byDifficulty[d.difficulty]) byDifficulty[d.difficulty].total = d._count;
  }
  if (solvedIds.size > 0) {
    const solvedProblems = await prisma.codingProblem.findMany({
      where: { id: { in: Array.from(solvedIds) } },
      select: { difficulty: true },
    });
    for (const p of solvedProblems) {
      if (byDifficulty[p.difficulty]) byDifficulty[p.difficulty].solved++;
    }
  }

  res.json({
    ok: true,
    stats: {
      totalProblems,
      solvedCount: solvedIds.size,
      totalSubmissions: submissions.length,
      acceptedCount: submissions.filter((s) => s.verdict === 'ACCEPTED').length,
      byDifficulty,
    },
  });
};
