import { useState, useEffect, useMemo } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import Editor from '@monaco-editor/react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Play,
  Send,
  ArrowLeft,
  RotateCcw,
  CheckCircle2,
  XCircle,
  Clock,
  Cpu,
  Code2,
  History,
  ChevronRight,
} from 'lucide-react';
import { DashboardLayout } from '@/components/dashboard/DashboardLayout';
import { api } from '@/lib/api';

interface Problem {
  id: string;
  slug: string;
  title: string;
  statement: string;
  difficulty: 'EASY' | 'MEDIUM' | 'HARD' | 'EXPERT';
  tags: string[];
  starterCode: Record<string, string>;
  testCases: { input: string; expectedOutput: string }[];
  hiddenTestCount: number;
  timeLimitMs: number;
  memoryLimitMb: number;
  submissionCount: number;
}

interface RunOutput {
  stdout: string;
  stderr: string;
  compileOutput: string;
  status: string;
  time: number | null;
  memory: number | null;
}

interface TestResult {
  input: string;
  expected: string;
  actual: string;
  passed: boolean;
  isHidden: boolean;
  error: string | null;
  runtimeMs: number | null;
}

interface SubmitResult {
  id: string;
  verdict:
    | 'ACCEPTED'
    | 'WRONG_ANSWER'
    | 'TIME_LIMIT'
    | 'RUNTIME_ERROR'
    | 'COMPILE_ERROR';
  passedTests: number;
  totalTests: number;
  runtimeMs: number | null;
  results: TestResult[];
  errorOutput: string | null;
}

interface SubmissionRow {
  id: string;
  language: string;
  verdict: string;
  passedTests: number;
  totalTests: number;
  runtimeMs: number | null;
  submittedAt: string;
}

const LANGUAGES = [
  { id: 'python', label: 'Python', monaco: 'python' },
  { id: 'javascript', label: 'JavaScript', monaco: 'javascript' },
  { id: 'cpp', label: 'C++', monaco: 'cpp' },
  { id: 'java', label: 'Java', monaco: 'java' },
  { id: 'c', label: 'C', monaco: 'c' },
  { id: 'go', label: 'Go', monaco: 'go' },
  { id: 'typescript', label: 'TypeScript', monaco: 'typescript' },
  { id: 'rust', label: 'Rust', monaco: 'rust' },
];

type RightTab = 'tests' | 'output' | 'submission' | 'history';

export default function CodeProblem() {
  const { slug } = useParams<{ slug: string }>();
  const qc = useQueryClient();
  const [language, setLanguage] = useState('python');
  const [code, setCode] = useState('');
  const [stdin, setStdin] = useState('');
  const [rightTab, setRightTab] = useState<RightTab>('tests');
  const [runOutput, setRunOutput] = useState<RunOutput | null>(null);
  const [submitResult, setSubmitResult] = useState<SubmitResult | null>(null);

  const { data: problem, isLoading } = useQuery<Problem>({
    queryKey: ['code-problem', slug],
    queryFn: async () => (await api.get(`/code/problems/${slug}`)).data.problem,
    enabled: !!slug,
  });

  const { data: history = [] } = useQuery<SubmissionRow[]>({
    queryKey: ['code-history', slug],
    queryFn: async () =>
      (await api.get(`/code/problems/${slug}/submissions`)).data.submissions,
    enabled: !!slug,
  });

  // Initialise code when problem loads or language changes
  useEffect(() => {
    if (!problem) return;
    const starter = problem.starterCode?.[language] ?? '';
    setCode(starter);
  }, [problem, language]);

  // Pre-fill stdin with first sample
  useEffect(() => {
    if (problem?.testCases?.[0]) setStdin(problem.testCases[0].input);
  }, [problem]);

  const runMutation = useMutation({
    mutationFn: async () =>
      (
        await api.post(`/code/problems/${slug}/run`, {
          language,
          code,
          stdin,
        })
      ).data.output as RunOutput,
    onSuccess: (out) => {
      setRunOutput(out);
      setSubmitResult(null);
      setRightTab('output');
    },
  });

  const submitMutation = useMutation({
    mutationFn: async () =>
      (
        await api.post(`/code/problems/${slug}/submit`, {
          language,
          code,
        })
      ).data.submission as SubmitResult,
    onSuccess: (data) => {
      setSubmitResult(data);
      setRunOutput(null);
      setRightTab('submission');
      qc.invalidateQueries({ queryKey: ['code-history', slug] });
      qc.invalidateQueries({ queryKey: ['code-problems'] });
      qc.invalidateQueries({ queryKey: ['code-stats'] });
    },
  });

  const resetCode = () => {
    if (!problem) return;
    setCode(problem.starterCode?.[language] ?? '');
  };

  const monacoLang = useMemo(
    () => LANGUAGES.find((l) => l.id === language)?.monaco ?? 'plaintext',
    [language]
  );

  if (isLoading) {
    return (
      <DashboardLayout>
        <div className="p-8 flex items-center gap-3 text-bone-300">
          <span className="w-2 h-2 rounded-full bg-violet-500 animate-pulse" />
          Loading problem…
        </div>
      </DashboardLayout>
    );
  }

  if (!problem) {
    return (
      <DashboardLayout>
        <div className="p-8">
          <Link
            to="/dashboard/code"
            className="text-violet-300 hover:text-violet-200 inline-flex items-center gap-2"
          >
            <ArrowLeft className="w-3 h-3" />
            Back to problems
          </Link>
          <div className="text-bone-300 mt-6">Problem not found.</div>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="h-[calc(100vh-1rem)] flex flex-col">
        {/* Top bar */}
        <div className="px-6 py-3 border-b border-white/5 flex items-center justify-between flex-shrink-0">
          <Link
            to="/dashboard/code"
            className="inline-flex items-center gap-2 text-sm text-bone-400 hover:text-bone-200 transition-colors"
          >
            <ArrowLeft className="w-3 h-3" />
            All problems
          </Link>

          <div className="flex items-center gap-3">
            <span
              className={`text-xs px-2 py-1 rounded-full ${
                problem.difficulty === 'EASY'
                  ? 'bg-cyan-500/10 text-cyan-300'
                  : problem.difficulty === 'MEDIUM'
                  ? 'bg-violet-500/10 text-violet-300'
                  : 'bg-magenta-500/10 text-magenta-300'
              }`}
            >
              {problem.difficulty[0] + problem.difficulty.slice(1).toLowerCase()}
            </span>
            <span className="font-display text-base text-bone-50">
              {problem.title}
            </span>
          </div>

          <div className="text-xs text-bone-400">
            {problem.submissionCount} submission
            {problem.submissionCount === 1 ? '' : 's'}
          </div>
        </div>

        {/* Two-pane layout */}
        <div className="flex-1 grid grid-cols-12 overflow-hidden">
          {/* Left — problem statement */}
          <div className="col-span-5 border-r border-white/5 overflow-y-auto p-6">
            <div className="prose prose-invert prose-sm max-w-none">
              <ReactMarkdown remarkPlugins={[remarkGfm]}>
                {problem.statement}
              </ReactMarkdown>
            </div>

            {problem.testCases.length > 0 && (
              <div className="mt-8">
                <div className="text-xs uppercase tracking-wider text-bone-400 mb-3">
                  Examples
                </div>
                <div className="space-y-3">
                  {problem.testCases.map((tc, i) => (
                    <div
                      key={i}
                      className="rounded-xl border border-white/10 bg-ink-950/40 p-4 font-mono text-xs"
                    >
                      <div className="text-bone-400 mb-1">Input</div>
                      <pre className="text-bone-100 whitespace-pre-wrap mb-3">
                        {tc.input}
                      </pre>
                      <div className="text-bone-400 mb-1">Expected output</div>
                      <pre className="text-bone-100 whitespace-pre-wrap">
                        {tc.expectedOutput}
                      </pre>
                    </div>
                  ))}
                </div>
              </div>
            )}

            <div className="mt-6 flex items-center gap-4 text-xs text-bone-400 pt-4 border-t border-white/5">
              <span className="flex items-center gap-1">
                <Clock className="w-3 h-3" />
                {problem.timeLimitMs}ms
              </span>
              <span className="flex items-center gap-1">
                <Cpu className="w-3 h-3" />
                {problem.memoryLimitMb}MB
              </span>
              {problem.hiddenTestCount > 0 && (
                <span>+ {problem.hiddenTestCount} hidden tests</span>
              )}
            </div>
          </div>

          {/* Right — editor + output */}
          <div className="col-span-7 flex flex-col overflow-hidden">
            {/* Editor toolbar */}
            <div className="px-4 py-2 border-b border-white/5 flex items-center justify-between flex-shrink-0">
              <div className="flex items-center gap-2">
                <select
                  value={language}
                  onChange={(e) => setLanguage(e.target.value)}
                  className="bg-ink-950 border border-white/10 rounded-lg px-3 py-1.5 text-sm text-bone-100 focus:outline-none focus:border-violet-500/50"
                >
                  {LANGUAGES.map((l) => (
                    <option key={l.id} value={l.id}>
                      {l.label}
                    </option>
                  ))}
                </select>
                <button
                  onClick={resetCode}
                  title="Reset to starter code"
                  className="w-8 h-8 rounded-lg border border-white/10 text-bone-400 hover:text-bone-200 hover:bg-white/5 transition-colors flex items-center justify-center"
                >
                  <RotateCcw className="w-3 h-3" />
                </button>
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={() => runMutation.mutate()}
                  disabled={runMutation.isPending || submitMutation.isPending}
                  className="px-4 py-1.5 rounded-lg border border-white/10 text-bone-100 hover:bg-white/5 disabled:opacity-50 disabled:cursor-not-allowed transition-colors text-sm flex items-center gap-2"
                >
                  {runMutation.isPending ? (
                    <span className="w-3 h-3 border-2 border-bone-300/30 border-t-bone-300 rounded-full animate-spin" />
                  ) : (
                    <Play className="w-3 h-3" />
                  )}
                  Run
                </button>
                <button
                  onClick={() => submitMutation.mutate()}
                  disabled={runMutation.isPending || submitMutation.isPending}
                  className="px-4 py-1.5 rounded-lg bg-bone-50 text-ink-950 hover:bg-white disabled:opacity-50 disabled:cursor-not-allowed transition-colors text-sm font-medium flex items-center gap-2"
                >
                  {submitMutation.isPending ? (
                    <span className="w-3 h-3 border-2 border-ink-950/30 border-t-ink-950 rounded-full animate-spin" />
                  ) : (
                    <Send className="w-3 h-3" />
                  )}
                  Submit
                </button>
              </div>
            </div>

            {/* Monaco */}
            <div className="flex-1 min-h-0">
              <Editor
                height="100%"
                language={monacoLang}
                value={code}
                onChange={(v) => setCode(v || '')}
                theme="vs-dark"
                options={{
                  minimap: { enabled: false },
                  fontSize: 14,
                  fontFamily: 'JetBrains Mono, Menlo, monospace',
                  lineNumbers: 'on',
                  scrollBeyondLastLine: false,
                  tabSize: 4,
                  insertSpaces: true,
                  wordWrap: 'on',
                  padding: { top: 12, bottom: 12 },
                }}
              />
            </div>

            {/* Bottom panel */}
            <div className="h-72 border-t border-white/5 flex flex-col flex-shrink-0">
              <div className="px-4 pt-2 flex items-center gap-1 border-b border-white/5">
                <TabBtn
                  active={rightTab === 'tests'}
                  onClick={() => setRightTab('tests')}
                  icon={<Code2 className="w-3 h-3" />}
                  label="Custom input"
                />
                <TabBtn
                  active={rightTab === 'output'}
                  onClick={() => setRightTab('output')}
                  icon={<Play className="w-3 h-3" />}
                  label="Output"
                  badge={runOutput ? '•' : undefined}
                />
                <TabBtn
                  active={rightTab === 'submission'}
                  onClick={() => setRightTab('submission')}
                  icon={<Send className="w-3 h-3" />}
                  label="Submission"
                  badge={submitResult ? '•' : undefined}
                />
                <TabBtn
                  active={rightTab === 'history'}
                  onClick={() => setRightTab('history')}
                  icon={<History className="w-3 h-3" />}
                  label={`History · ${history.length}`}
                />
              </div>

              <div className="flex-1 overflow-y-auto p-4">
                {rightTab === 'tests' && (
                  <div>
                    <div className="text-xs uppercase tracking-wider text-bone-400 mb-2">
                      Standard input
                    </div>
                    <textarea
                      value={stdin}
                      onChange={(e) => setStdin(e.target.value)}
                      placeholder="Input for the Run button…"
                      rows={6}
                      className="w-full px-3 py-2 bg-ink-950 border border-white/10 rounded-lg text-bone-50 font-mono text-xs focus:outline-none focus:border-violet-500/50 resize-none"
                    />
                  </div>
                )}

                {rightTab === 'output' && (
                  <div>
                    {!runOutput && (
                      <div className="text-bone-400 text-sm text-center py-8">
                        Hit <span className="text-violet-300">Run</span> to
                        execute against the input on the left.
                      </div>
                    )}
                    {runOutput && (
                      <div className="space-y-3 text-xs font-mono">
                        <div className="flex items-center gap-2 text-bone-300">
                          <span
                            className={
                              runOutput.status === 'Accepted'
                                ? 'text-cyan-300'
                                : 'text-magenta-300'
                            }
                          >
                            {runOutput.status}
                          </span>
                          {runOutput.time != null && (
                            <span className="text-bone-400">
                              · {(runOutput.time * 1000).toFixed(0)}ms
                            </span>
                          )}
                          {runOutput.memory != null && (
                            <span className="text-bone-400">
                              · {runOutput.memory} KB
                            </span>
                          )}
                        </div>
                        {runOutput.stdout && (
                          <div>
                            <div className="text-bone-400 mb-1">stdout</div>
                            <pre className="bg-ink-950 border border-white/10 rounded-lg p-3 text-bone-100 whitespace-pre-wrap overflow-x-auto">
                              {runOutput.stdout}
                            </pre>
                          </div>
                        )}
                        {runOutput.stderr && (
                          <div>
                            <div className="text-magenta-400 mb-1">stderr</div>
                            <pre className="bg-magenta-500/5 border border-magenta-500/30 rounded-lg p-3 text-magenta-100 whitespace-pre-wrap overflow-x-auto">
                              {runOutput.stderr}
                            </pre>
                          </div>
                        )}
                        {runOutput.compileOutput && (
                          <div>
                            <div className="text-magenta-400 mb-1">
                              compile error
                            </div>
                            <pre className="bg-magenta-500/5 border border-magenta-500/30 rounded-lg p-3 text-magenta-100 whitespace-pre-wrap overflow-x-auto">
                              {runOutput.compileOutput}
                            </pre>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                )}

                {rightTab === 'submission' && (
                  <div>
                    {!submitResult && (
                      <div className="text-bone-400 text-sm text-center py-8">
                        Hit <span className="text-violet-300">Submit</span> to
                        run against all test cases.
                      </div>
                    )}
                    {submitResult && (
                      <SubmissionView result={submitResult} />
                    )}
                  </div>
                )}

                {rightTab === 'history' && (
                  <div className="space-y-1">
                    {history.length === 0 && (
                      <div className="text-bone-400 text-sm text-center py-8">
                        No submissions yet.
                      </div>
                    )}
                    {history.map((s) => (
                      <div
                        key={s.id}
                        className="flex items-center gap-3 px-3 py-2 rounded-lg border border-white/5 hover:bg-white/[0.02] transition-colors"
                      >
                        <VerdictBadge verdict={s.verdict} />
                        <span className="text-xs text-bone-300 flex-1">
                          {s.passedTests}/{s.totalTests} passed
                        </span>
                        <span className="text-xs text-bone-400 font-mono">
                          {s.language}
                        </span>
                        {s.runtimeMs != null && (
                          <span className="text-xs text-bone-400 font-mono">
                            {s.runtimeMs}ms
                          </span>
                        )}
                        <span className="text-xs text-bone-400">
                          {new Date(s.submittedAt).toLocaleString()}
                        </span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}

const TabBtn = ({
  active,
  onClick,
  icon,
  label,
  badge,
}: {
  active: boolean;
  onClick: () => void;
  icon: React.ReactNode;
  label: string;
  badge?: string;
}) => (
  <button
    onClick={onClick}
    className={`px-3 py-2 text-xs flex items-center gap-2 border-b-2 transition-colors ${
      active
        ? 'border-violet-500 text-bone-50'
        : 'border-transparent text-bone-400 hover:text-bone-200'
    }`}
  >
    {icon}
    {label}
    {badge && <span className="text-violet-300">{badge}</span>}
  </button>
);

const VerdictBadge = ({ verdict }: { verdict: string }) => {
  const map: Record<string, { label: string; color: string }> = {
    ACCEPTED: { label: 'Accepted', color: 'text-cyan-300 bg-cyan-500/10' },
    WRONG_ANSWER: {
      label: 'Wrong answer',
      color: 'text-magenta-300 bg-magenta-500/10',
    },
    TIME_LIMIT: {
      label: 'Time limit',
      color: 'text-magenta-300 bg-magenta-500/10',
    },
    RUNTIME_ERROR: {
      label: 'Runtime error',
      color: 'text-magenta-300 bg-magenta-500/10',
    },
    COMPILE_ERROR: {
      label: 'Compile error',
      color: 'text-magenta-300 bg-magenta-500/10',
    },
    PENDING: { label: 'Pending', color: 'text-bone-300 bg-white/5' },
  };
  const v = map[verdict] ?? map.PENDING;
  return (
    <span className={`text-[10px] px-2 py-0.5 rounded-full ${v.color}`}>
      {v.label}
    </span>
  );
};

const SubmissionView = ({ result }: { result: SubmitResult }) => {
  const allPassed = result.verdict === 'ACCEPTED';
  return (
    <div>
      {/* Verdict banner */}
      <div
        className={`rounded-xl border p-4 mb-4 ${
          allPassed
            ? 'border-cyan-500/30 bg-cyan-500/5'
            : 'border-magenta-500/30 bg-magenta-500/5'
        }`}
      >
        <div className="flex items-center gap-3 mb-1">
          {allPassed ? (
            <CheckCircle2 className="w-5 h-5 text-cyan-300" />
          ) : (
            <XCircle className="w-5 h-5 text-magenta-300" />
          )}
          <div
            className={`font-display text-lg ${
              allPassed ? 'text-cyan-100' : 'text-magenta-100'
            }`}
          >
            {result.verdict.replace('_', ' ')}
          </div>
        </div>
        <div className="text-xs text-bone-300">
          {result.passedTests} / {result.totalTests} tests passed
          {result.runtimeMs != null && ` · ${result.runtimeMs}ms total`}
        </div>
      </div>

      {result.errorOutput && (
        <div className="mb-4 rounded-xl border border-magenta-500/30 bg-magenta-500/5 p-3">
          <div className="text-xs text-magenta-400 mb-1 uppercase tracking-wider">
            Error
          </div>
          <pre className="text-xs font-mono text-magenta-100 whitespace-pre-wrap overflow-x-auto">
            {result.errorOutput}
          </pre>
        </div>
      )}

      {/* Per-case */}
      <div className="space-y-2">
        {result.results.map((r, i) => (
          <details
            key={i}
            className={`rounded-lg border ${
              r.passed
                ? 'border-cyan-500/20 bg-cyan-500/[0.03]'
                : 'border-magenta-500/20 bg-magenta-500/[0.03]'
            } overflow-hidden`}
          >
            <summary className="px-3 py-2 flex items-center gap-2 cursor-pointer text-xs">
              {r.passed ? (
                <CheckCircle2 className="w-3 h-3 text-cyan-300" />
              ) : (
                <XCircle className="w-3 h-3 text-magenta-300" />
              )}
              <span className="text-bone-100">
                Test {i + 1} {r.isHidden && '(hidden)'}
              </span>
              {r.runtimeMs != null && (
                <span className="ml-auto text-bone-400 font-mono">
                  {r.runtimeMs}ms
                </span>
              )}
              <ChevronRight className="w-3 h-3 text-bone-400" />
            </summary>
            <div className="px-3 pb-3 text-xs font-mono space-y-2">
              <div>
                <div className="text-bone-400 mb-1">Input</div>
                <pre className="bg-ink-950/60 border border-white/5 rounded p-2 whitespace-pre-wrap">
                  {r.input}
                </pre>
              </div>
              <div>
                <div className="text-bone-400 mb-1">Expected</div>
                <pre className="bg-ink-950/60 border border-white/5 rounded p-2 whitespace-pre-wrap">
                  {r.expected}
                </pre>
              </div>
              {!r.passed && (
                <div>
                  <div className="text-magenta-400 mb-1">Got</div>
                  <pre className="bg-magenta-500/5 border border-magenta-500/20 rounded p-2 whitespace-pre-wrap text-magenta-100">
                    {r.actual || '(no output)'}
                  </pre>
                </div>
              )}
              {r.error && (
                <div>
                  <div className="text-magenta-400 mb-1">Error</div>
                  <pre className="bg-magenta-500/5 border border-magenta-500/20 rounded p-2 whitespace-pre-wrap text-magenta-100">
                    {r.error}
                  </pre>
                </div>
              )}
            </div>
          </details>
        ))}
      </div>
    </div>
  );
};

// Suppress unused warning
void AnimatePresence;
void motion;
