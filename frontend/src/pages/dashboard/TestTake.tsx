import { useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { useQuery, useMutation } from '@tanstack/react-query';
import { motion, AnimatePresence } from 'framer-motion';
import {
  ChevronLeft,
  ChevronRight,
  CheckCircle2,
  XCircle,
  ArrowLeft,
  Trophy,
} from 'lucide-react';
import { DashboardLayout } from '@/components/dashboard/DashboardLayout';
import { api } from '@/lib/api';

type QuestionType =
  | 'MCQ'
  | 'MULTI_SELECT'
  | 'DESCRIPTIVE'
  | 'CODING'
  | 'TRUE_FALSE'
  | 'FILL_BLANK';

interface Question {
  id: string;
  prompt: string;
  type: QuestionType;
  options: string[] | null;
  marks: number;
  topic?: string | null;
  difficulty?: string;
}

interface GradedQuestion extends Question {
  correctAnswer: string | null;
  explanation: string | null;
  userAnswer: string | null;
  isCorrect: boolean;
}

interface Exam {
  id: string;
  title: string;
  type: string;
  durationMin: number;
  totalMarks: number;
  questions: Question[];
}

interface SubmitResult {
  attempt: { id: string; score: number; totalMarks: number; percentage: number };
  questions: GradedQuestion[];
}

export default function TestTake() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [current, setCurrent] = useState(0);
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [result, setResult] = useState<SubmitResult | null>(null);

  const { data, isLoading, error: loadError } = useQuery<{ exam: Exam }>({
    queryKey: ['exam', id],
    queryFn: async () => (await api.get(`/exams/${id}`)).data,
    enabled: !!id,
  });
  const exam = data?.exam;

  const submit = useMutation({
    mutationFn: async () =>
      (await api.post(`/exams/${id}/submit`, { answers })).data as SubmitResult,
    onSuccess: (data) => {
      setResult(data);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    },
  });

  if (isLoading) {
    return (
      <DashboardLayout>
        <div className="p-8 flex items-center gap-3 text-bone-300">
          <span className="w-2 h-2 rounded-full bg-violet-500 animate-pulse" />
          Loading test…
        </div>
      </DashboardLayout>
    );
  }

  if (loadError || !exam) {
    return (
      <DashboardLayout>
        <div className="p-8">
          <div className="text-bone-300 mb-4">Test not found.</div>
          <Link
            to="/dashboard/tests"
            className="text-violet-300 hover:text-violet-200 inline-flex items-center gap-2"
          >
            <ArrowLeft className="w-3 h-3" />
            Back to tests
          </Link>
        </div>
      </DashboardLayout>
    );
  }

  // ─── RESULTS VIEW ─────────────────────────────────
  if (result) {
    const { attempt, questions } = result;
    const tone =
      attempt.percentage >= 70
        ? { color: 'cyan', label: 'Strong work.' }
        : attempt.percentage >= 50
        ? { color: 'violet', label: 'Decent. Sharpen the gaps.' }
        : { color: 'magenta', label: 'Worth a revision pass.' };

    const ringClasses =
      tone.color === 'cyan'
        ? 'bg-cyan-500/10 border-cyan-500/30 text-cyan-300'
        : tone.color === 'violet'
        ? 'bg-violet-500/10 border-violet-500/30 text-violet-300'
        : 'bg-magenta-500/10 border-magenta-500/30 text-magenta-300';

    return (
      <DashboardLayout>
        <div className="p-8 max-w-3xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="text-center mb-12"
          >
            <div
              className={`inline-flex w-20 h-20 rounded-3xl border items-center justify-center mb-6 ${ringClasses}`}
            >
              <Trophy className="w-9 h-9" />
            </div>
            <div className="text-xs uppercase tracking-[0.3em] text-bone-400 mb-3">
              Your score
            </div>
            <div className="font-display text-7xl text-bone-50 leading-none mb-2 tabular-nums">
              {attempt.percentage}%
            </div>
            <div className="text-bone-300 mb-1">
              {attempt.score} of {attempt.totalMarks} marks
            </div>
            <div className="text-bone-400 italic">{tone.label}</div>
          </motion.div>

          <h2 className="font-display text-2xl text-bone-50 mb-6">Review</h2>

          <div className="space-y-4">
            {questions.map((q, i) => (
              <motion.div
                key={q.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.4, delay: i * 0.04 }}
                className={`rounded-2xl border p-5 ${
                  q.isCorrect
                    ? 'border-cyan-500/30 bg-cyan-500/[0.04]'
                    : 'border-magenta-500/30 bg-magenta-500/[0.04]'
                }`}
              >
                <div className="flex items-start gap-3 mb-4">
                  {q.isCorrect ? (
                    <CheckCircle2 className="w-5 h-5 text-cyan-300 flex-shrink-0 mt-1" />
                  ) : (
                    <XCircle className="w-5 h-5 text-magenta-300 flex-shrink-0 mt-1" />
                  )}
                  <div className="flex-1">
                    <div className="text-xs text-bone-400 mb-1">
                      Question {i + 1} · {q.marks}{' '}
                      {q.marks === 1 ? 'mark' : 'marks'}
                    </div>
                    <div className="text-bone-50 leading-relaxed">
                      {q.prompt}
                    </div>
                  </div>
                </div>

                {q.options && Array.isArray(q.options) && (
                  <div className="space-y-1.5 mb-3 ml-8">
                    {q.options.map((opt, j) => {
                      const isUser = q.userAnswer === opt;
                      const isCorr = q.correctAnswer === opt;
                      return (
                        <div
                          key={j}
                          className={`px-3 py-2 rounded-lg text-sm flex items-center gap-2 ${
                            isCorr
                              ? 'bg-cyan-500/10 text-cyan-50 border border-cyan-500/30'
                              : isUser
                              ? 'bg-magenta-500/10 text-magenta-50 border border-magenta-500/30'
                              : 'text-bone-400'
                          }`}
                        >
                          <span className="font-mono text-xs w-4">
                            {String.fromCharCode(65 + j)}
                          </span>
                          <span className="flex-1">{opt}</span>
                          {isCorr && (
                            <span className="text-[10px] uppercase tracking-wider">
                              correct
                            </span>
                          )}
                          {isUser && !isCorr && (
                            <span className="text-[10px] uppercase tracking-wider">
                              your answer
                            </span>
                          )}
                        </div>
                      );
                    })}
                  </div>
                )}

                {q.explanation && (
                  <div className="ml-8 mt-3 p-3 rounded-lg bg-ink-950/40 border border-white/5">
                    <div className="text-xs uppercase tracking-wider text-bone-400 mb-1">
                      Explanation
                    </div>
                    <div className="text-sm text-bone-200 leading-relaxed">
                      {q.explanation}
                    </div>
                  </div>
                )}
              </motion.div>
            ))}
          </div>

          <div className="mt-10 flex gap-3 justify-center">
            <button
              onClick={() => navigate('/dashboard/tests')}
              className="px-6 py-3 rounded-full border border-white/10 text-bone-200 hover:bg-white/5 transition-colors"
            >
              All tests
            </button>
            <button
              onClick={() => {
                setAnswers({});
                setCurrent(0);
                setResult(null);
              }}
              className="px-6 py-3 rounded-full bg-bone-50 text-ink-950 hover:bg-white transition-colors"
            >
              Retake
            </button>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  // ─── TAKE VIEW ────────────────────────────────────
  const questions = exam.questions || [];
  const q = questions[current];
  const progress =
    questions.length > 0 ? ((current + 1) / questions.length) * 100 : 0;
  const answered = Object.values(answers).filter((v) => v && v.trim()).length;
  const allAnswered = questions.length > 0 && answered === questions.length;

  return (
    <DashboardLayout>
      <div className="p-8 max-w-3xl mx-auto">
        <div className="mb-8">
          <Link
            to="/dashboard/tests"
            className="inline-flex items-center gap-2 text-sm text-bone-400 hover:text-bone-200 mb-6 transition-colors"
          >
            <ArrowLeft className="w-3 h-3" />
            All tests
          </Link>
          <div className="text-xs uppercase tracking-wider text-bone-400 mb-1">
            {exam.type}
          </div>
          <h1 className="font-display text-3xl text-bone-50 mb-5 leading-tight">
            {exam.title}
          </h1>
          <div className="flex items-center gap-3">
            <div className="flex-1 h-1 rounded-full bg-white/5 overflow-hidden">
              <motion.div
                initial={{ width: 0 }}
                animate={{ width: `${progress}%` }}
                transition={{ duration: 0.4 }}
                className="h-full bg-gradient-to-r from-violet-500 to-cyan-400"
              />
            </div>
            <span className="text-sm text-bone-400 font-mono whitespace-nowrap tabular-nums">
              {current + 1} / {questions.length}
            </span>
          </div>
        </div>

        <AnimatePresence mode="wait">
          {q && (
            <motion.div
              key={q.id}
              initial={{ opacity: 0, x: 30 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -30 }}
              transition={{ duration: 0.3 }}
              className="rounded-3xl border border-white/10 bg-ink-900/40 p-8 mb-6"
            >
              <div className="text-xs uppercase tracking-wider text-bone-400 mb-3">
                Question {current + 1} · {q.marks}{' '}
                {q.marks === 1 ? 'mark' : 'marks'}
              </div>
              <h2 className="font-display text-2xl text-bone-50 mb-8 leading-snug">
                {q.prompt}
              </h2>

              {q.type === 'MCQ' && q.options && Array.isArray(q.options) && (
                <div className="space-y-2">
                  {q.options.map((opt, j) => {
                    const selected = answers[q.id] === opt;
                    return (
                      <button
                        key={j}
                        onClick={() => setAnswers({ ...answers, [q.id]: opt })}
                        className={`w-full text-left px-5 py-4 rounded-xl border transition-all flex items-center gap-3 ${
                          selected
                            ? 'border-violet-500/50 bg-violet-500/10 text-bone-50'
                            : 'border-white/10 text-bone-200 hover:border-white/20 hover:bg-white/[0.02]'
                        }`}
                      >
                        <span
                          className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-mono flex-shrink-0 ${
                            selected
                              ? 'bg-violet-500 text-white'
                              : 'bg-white/5 text-bone-400'
                          }`}
                        >
                          {String.fromCharCode(65 + j)}
                        </span>
                        <span>{opt}</span>
                      </button>
                    );
                  })}
                </div>
              )}

              {q.type === 'TRUE_FALSE' && (
                <div className="grid grid-cols-2 gap-3">
                  {['True', 'False'].map((opt) => {
                    const selected = answers[q.id] === opt;
                    return (
                      <button
                        key={opt}
                        onClick={() => setAnswers({ ...answers, [q.id]: opt })}
                        className={`px-5 py-4 rounded-xl border transition-all font-medium ${
                          selected
                            ? 'border-violet-500/50 bg-violet-500/10 text-bone-50'
                            : 'border-white/10 text-bone-200 hover:border-white/20'
                        }`}
                      >
                        {opt}
                      </button>
                    );
                  })}
                </div>
              )}

              {(q.type === 'DESCRIPTIVE' || q.type === 'FILL_BLANK') && (
                <textarea
                  value={answers[q.id] || ''}
                  onChange={(e) =>
                    setAnswers({ ...answers, [q.id]: e.target.value })
                  }
                  rows={q.type === 'DESCRIPTIVE' ? 6 : 2}
                  placeholder="Your answer…"
                  className="w-full px-5 py-4 bg-ink-950 border border-white/10 rounded-xl text-bone-50 placeholder:text-bone-400/50 focus:outline-none focus:border-violet-500/50 resize-none"
                />
              )}
            </motion.div>
          )}
        </AnimatePresence>

        <div className="flex items-center justify-between gap-3">
          <button
            onClick={() => setCurrent((c) => Math.max(0, c - 1))}
            disabled={current === 0}
            className="px-4 py-2.5 rounded-full border border-white/10 text-bone-300 hover:bg-white/5 disabled:opacity-30 disabled:cursor-not-allowed transition-colors flex items-center gap-2"
          >
            <ChevronLeft className="w-4 h-4" />
            Previous
          </button>

          <div className="text-xs text-bone-400">
            {answered} of {questions.length} answered
          </div>

          {current < questions.length - 1 ? (
            <button
              onClick={() =>
                setCurrent((c) => Math.min(questions.length - 1, c + 1))
              }
              className="px-4 py-2.5 rounded-full border border-white/10 text-bone-300 hover:bg-white/5 transition-colors flex items-center gap-2"
            >
              Next
              <ChevronRight className="w-4 h-4" />
            </button>
          ) : (
            <button
              onClick={() => submit.mutate()}
              disabled={!allAnswered || submit.isPending}
              className="px-6 py-2.5 rounded-full bg-bone-50 text-ink-950 hover:bg-white disabled:opacity-30 disabled:cursor-not-allowed transition-colors font-medium"
            >
              {submit.isPending ? 'Submitting…' : 'Submit test'}
            </button>
          )}
        </div>
      </div>
    </DashboardLayout>
  );
}
