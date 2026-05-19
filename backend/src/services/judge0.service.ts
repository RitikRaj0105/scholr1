import { env } from '../config/env.js';
import { logger } from '../utils/logger.js';

const JUDGE0_URL = process.env.JUDGE0_URL || 'http://localhost:2358';
const JUDGE0_AUTH_HEADER = process.env.JUDGE0_AUTH_TOKEN
  ? { 'X-Auth-Token': process.env.JUDGE0_AUTH_TOKEN }
  : {};

// Common Judge0 language IDs (CE / standard build)
// See: GET /languages on your Judge0 instance for full list
export const LANGUAGE_IDS: Record<string, number> = {
  python: 71, // Python 3.8.1
  javascript: 63, // Node.js 12.14.0
  typescript: 74, // TypeScript 3.7.4
  c: 50, // C (GCC 9.2.0)
  cpp: 54, // C++ (GCC 9.2.0)
  java: 62, // Java (OpenJDK 13.0.1)
  go: 60, // Go 1.13.5
  rust: 73, // Rust 1.40.0
  ruby: 72, // Ruby 2.7.0
  csharp: 51, // C# (Mono 6.6.0.161)
  kotlin: 78, // Kotlin 1.3.70
  swift: 83, // Swift 5.2.3
};

// Judge0 status IDs
export const JUDGE0_STATUS = {
  IN_QUEUE: 1,
  PROCESSING: 2,
  ACCEPTED: 3,
  WRONG_ANSWER: 4,
  TIME_LIMIT_EXCEEDED: 5,
  COMPILATION_ERROR: 6,
  RUNTIME_ERROR_SIGSEGV: 7,
  RUNTIME_ERROR_SIGXFSZ: 8,
  RUNTIME_ERROR_SIGFPE: 9,
  RUNTIME_ERROR_SIGABRT: 10,
  RUNTIME_ERROR_NZEC: 11,
  RUNTIME_ERROR_OTHER: 12,
  INTERNAL_ERROR: 13,
  EXEC_FORMAT_ERROR: 14,
};

interface Judge0Submission {
  source_code: string;
  language_id: number;
  stdin?: string;
  expected_output?: string;
  cpu_time_limit?: number; // seconds
  memory_limit?: number; // KB
}

interface Judge0Result {
  stdout: string | null;
  stderr: string | null;
  compile_output: string | null;
  message: string | null;
  status: { id: number; description: string };
  time: string | null; // seconds, as string
  memory: number | null; // KB
}

/**
 * Submit code synchronously and return the verdict.
 * Uses ?wait=true so we block until completion.
 */
export async function runOnJudge0(payload: Judge0Submission): Promise<Judge0Result> {
  const url = `${JUDGE0_URL}/submissions?base64_encoded=true&wait=true`;
  const body = {
    ...payload,
    source_code: b64(payload.source_code),
    stdin: payload.stdin != null ? b64(payload.stdin) : undefined,
    expected_output:
      payload.expected_output != null ? b64(payload.expected_output) : undefined,
  };
  let res: Response;
  try {
    res = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...JUDGE0_AUTH_HEADER,
      },
      body: JSON.stringify(body),
    });
  } catch (err) {
    logger.error({ err }, 'Judge0 fetch failed');
    throw new Error(
      `Could not reach Judge0 at ${JUDGE0_URL}. Is the Docker stack running?`
    );
  }
  if (!res.ok) {
    const text = await res.text().catch(() => '');
    throw new Error(`Judge0 returned ${res.status}: ${text}`);
  }
  const data = (await res.json()) as Judge0Result;
  return {
    ...data,
    stdout: data.stdout ? fromB64(data.stdout) : null,
    stderr: data.stderr ? fromB64(data.stderr) : null,
    compile_output: data.compile_output ? fromB64(data.compile_output) : null,
    message: data.message ? fromB64(data.message) : null,
  };
}

export function statusToVerdict(statusId: number):
  | 'ACCEPTED'
  | 'WRONG_ANSWER'
  | 'TIME_LIMIT'
  | 'RUNTIME_ERROR'
  | 'COMPILE_ERROR' {
  if (statusId === JUDGE0_STATUS.ACCEPTED) return 'ACCEPTED';
  if (statusId === JUDGE0_STATUS.WRONG_ANSWER) return 'WRONG_ANSWER';
  if (statusId === JUDGE0_STATUS.TIME_LIMIT_EXCEEDED) return 'TIME_LIMIT';
  if (statusId === JUDGE0_STATUS.COMPILATION_ERROR) return 'COMPILE_ERROR';
  return 'RUNTIME_ERROR';
}

export async function checkJudge0Health(): Promise<boolean> {
  try {
    const res = await fetch(`${JUDGE0_URL}/about`, {
      headers: JUDGE0_AUTH_HEADER,
    });
    return res.ok;
  } catch {
    return false;
  }
}

// Base64 helpers — Judge0 expects base64-encoded payloads when base64_encoded=true
function b64(s: string): string {
  return Buffer.from(s, 'utf-8').toString('base64');
}
function fromB64(s: string): string {
  return Buffer.from(s, 'base64').toString('utf-8');
}

// Suppress unused warning for env import (kept for future config)
void env;
