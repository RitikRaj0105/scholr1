import { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { motion, AnimatePresence } from 'framer-motion';
import Editor from '@monaco-editor/react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import {
  ArrowLeft,
  Save,
  Plus,
  Trash2,
  Eye,
  EyeOff,
  AlertCircle,
  CheckCircle2,
} from 'lucide-react';
import { AdminLayout } from '@/components/admin/AdminLayout';
import { api } from '@/lib/api';

interface TestCase {
  input: string;
  expectedOutput: string;
  isHidden: boolean;
}

interface ProblemFormData {
  slug: string;
  title: string;
  statement: string;
  difficulty: 'EASY' | 'MEDIUM' | 'HARD' | 'EXPERT';
  tags: string[];
  starterCode: Record<string, string>;
  testCases: TestCase[];
  timeLimitMs: number;
  memoryLimitMb: number;
}

const LANGUAGES = [
  { id: 'python', label: 'Python', monaco: 'python' },
  { id: 'javascript', label: 'JavaScript', monaco: 'javascript' },
  { id: 'cpp', label: 'C++', monaco: 'cpp' },
  { id: 'java', label: 'Java', monaco: 'java' },
];

const STARTER_TEMPLATES: Record<string, string> = {
  python: `# Read input and print output\n`,
  javascript: `const input = require('fs').readFileSync(0, 'utf-8').trim();\n// Your solution here\n`,
  cpp: `#include <iostream>\nusing namespace std;\nint main() {\n    // Your solution here\n    return 0;\n}\n`,
  java: `import java.util.*;\npublic class Main {\n    public static void main(String[] args) {\n        // Your solution here\n    }\n}\n`,
};

const slugify = (s: string) =>
  s
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 80);

export default function AdminProblemForm() {
  const { slug: editSlug } = useParams<{ slug: string }>();
  const isEdit = Boolean(editSlug);
  const navigate = useNavigate();
  const qc = useQueryClient();

  const [form, setForm] = useState<ProblemFormData>({
    slug: '',
    title: '',
    statement:
      'Describe the problem here.\n\n**Example:**\n```\nInput: ...\nOutput: ...\n```',
    difficulty: 'EASY',
    tags: [],
    starterCode: { python: STARTER_TEMPLATES.python },
    testCases: [{ input: '', expectedOutput: '', isHidden: false }],
    timeLimitMs: 2000,
    memoryLimitMb: 128,
  });
  const [tagsInput, setTagsInput] = useState('');
  const [activeLang, setActiveLang] = useState('python');
  const [previewStatement, setPreviewStatement] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  // Load existing problem when editing
  const { data: existing } = useQuery({
    queryKey: ['admin-problem', editSlug],
    queryFn: async () =>
      (await api.get(`/admin/problems/${editSlug}`)).data.problem,
    enabled: isEdit,
  });

  useEffect(() => {
    if (existing) {
      setForm({
        slug: existing.slug,
        title: existing.title,
        statement: existing.statement,
        difficulty: existing.difficulty,
        tags: existing.tags || [],
        starterCode: existing.starterCode || { python: STARTER_TEMPLATES.python },
        testCases: existing.testCases || [
          { input: '', expectedOutput: '', isHidden: false },
        ],
        timeLimitMs: existing.timeLimitMs || 2000,
        memoryLimitMb: existing.memoryLimitMb || 128,
      });
      setTagsInput((existing.tags || []).join(', '));
      const firstLang = Object.keys(existing.starterCode || {})[0];
      if (firstLang) setActiveLang(firstLang);
    }
  }, [existing]);

  // Auto-generate slug from title when creating new
  useEffect(() => {
    if (!isEdit && form.title) {
      setForm((f) => ({ ...f, slug: slugify(f.title) }));
    }
  }, [form.title, isEdit]);

  // Update tags array when input changes
  useEffect(() => {
    const tags = tagsInput
      .split(',')
      .map((t) => t.trim().toLowerCase())
      .filter(Boolean);
    setForm((f) => ({ ...f, tags }));
  }, [tagsInput]);

  const save = useMutation({
    mutationFn: async () => {
      // Filter out empty test cases
      const cleanTests = form.testCases.filter(
        (t) => t.input || t.expectedOutput
      );
      // Filter out empty starter code entries
      const cleanStarter: Record<string, string> = {};
      for (const [lang, code] of Object.entries(form.starterCode)) {
        if (code.trim()) cleanStarter[lang] = code;
      }
      const payload = {
        ...form,
        testCases: cleanTests,
        starterCode: cleanStarter,
      };
      if (isEdit) {
        // Don't send slug on update
        const { slug: _slug, ...updateData } = payload;
        void _slug;
        return (await api.patch(`/admin/problems/${editSlug}`, updateData)).data;
      } else {
        return (await api.post('/admin/problems', payload)).data;
      }
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['admin-problems'] });
      qc.invalidateQueries({ queryKey: ['admin-stats'] });
      qc.invalidateQueries({ queryKey: ['code-problems'] });
      setSuccess(true);
      setError(null);
      setTimeout(() => navigate('/admin/problems'), 800);
    },
    onError: (err: any) => {
      setError(
        err.response?.data?.error?.message ||
          err.response?.data?.message ||
          err.message ||
          'Failed to save'
      );
      setSuccess(false);
    },
  });

  const addTestCase = () => {
    setForm((f) => ({
      ...f,
      testCases: [
        ...f.testCases,
        { input: '', expectedOutput: '', isHidden: false },
      ],
    }));
  };

  const updateTestCase = (i: number, updates: Partial<TestCase>) => {
    setForm((f) => ({
      ...f,
      testCases: f.testCases.map((t, idx) =>
        idx === i ? { ...t, ...updates } : t
      ),
    }));
  };

  const removeTestCase = (i: number) => {
    setForm((f) => ({
      ...f,
      testCases: f.testCases.filter((_, idx) => idx !== i),
    }));
  };

  const toggleLang = (lang: string) => {
    setForm((f) => {
      const next = { ...f.starterCode };
      if (next[lang]) {
        delete next[lang];
      } else {
        next[lang] = STARTER_TEMPLATES[lang] || '';
      }
      return { ...f, starterCode: next };
    });
  };

  const canSave =
    form.title.trim() &&
    form.slug.trim() &&
    form.statement.length >= 10 &&
    form.testCases.some((t) => t.input || t.expectedOutput) &&
    Object.values(form.starterCode).some((c) => c.trim());

  return (
    <AdminLayout>
      <div className="p-6 lg:p-8 max-w-6xl mx-auto">
        {/* Top bar */}
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
          className="mb-6 flex items-center justify-between gap-4 flex-wrap"
        >
          <div className="flex items-center gap-3">
            <Link
              to="/admin/problems"
              className="w-8 h-8 rounded-lg border border-white/[0.06] text-bone-400 hover:text-bone-100 hover:bg-white/[0.03] flex items-center justify-center transition-colors"
            >
              <ArrowLeft className="w-4 h-4" />
            </Link>
            <div>
              <p className="text-xs text-red-400 font-medium uppercase tracking-wider mb-0.5">
                Admin · {isEdit ? 'Edit' : 'New'} Problem
              </p>
              <h1 className="font-display text-2xl text-bone-50">
                {isEdit ? form.title || 'Editing…' : 'New coding problem'}
              </h1>
            </div>
          </div>
          <button
            onClick={() => save.mutate()}
            disabled={!canSave || save.isPending}
            className="px-4 py-2 rounded-lg bg-violet-600 hover:bg-violet-500 disabled:bg-ink-700 disabled:text-bone-400 text-white text-sm font-medium flex items-center gap-2 transition-colors disabled:cursor-not-allowed"
          >
            <Save className="w-4 h-4" />
            {save.isPending
              ? 'Saving…'
              : isEdit
              ? 'Save changes'
              : 'Create problem'}
          </button>
        </motion.div>

        <AnimatePresence>
          {error && (
            <motion.div
              initial={{ opacity: 0, y: -8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              className="mb-4 flex items-start gap-2 px-4 py-3 rounded-lg bg-red-500/10 border border-red-500/30"
            >
              <AlertCircle className="w-4 h-4 text-red-400 flex-shrink-0 mt-0.5" />
              <p className="text-sm text-red-300">{error}</p>
            </motion.div>
          )}
          {success && (
            <motion.div
              initial={{ opacity: 0, y: -8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              className="mb-4 flex items-center gap-2 px-4 py-3 rounded-lg bg-emerald-500/10 border border-emerald-500/30"
            >
              <CheckCircle2 className="w-4 h-4 text-emerald-400" />
              <p className="text-sm text-emerald-300">
                {isEdit ? 'Updated' : 'Created'}! Redirecting…
              </p>
            </motion.div>
          )}
        </AnimatePresence>

        <div className="space-y-5">
          {/* Section: Basic info */}
          <Section title="Basic info">
            <div className="grid grid-cols-12 gap-3">
              <div className="col-span-12 md:col-span-7">
                <Label>Title</Label>
                <input
                  value={form.title}
                  onChange={(e) =>
                    setForm({ ...form, title: e.target.value })
                  }
                  placeholder="e.g. Two Sum"
                  className="w-full px-3 py-2 bg-ink-950 border border-white/[0.08] rounded-lg text-sm text-bone-50 placeholder:text-bone-400/50 focus:outline-none focus:border-violet-500/40"
                />
              </div>
              <div className="col-span-12 md:col-span-5">
                <Label>Slug (URL)</Label>
                <input
                  value={form.slug}
                  onChange={(e) =>
                    setForm({ ...form, slug: slugify(e.target.value) })
                  }
                  disabled={isEdit}
                  placeholder="two-sum"
                  className="w-full px-3 py-2 bg-ink-950 border border-white/[0.08] rounded-lg text-sm font-mono text-bone-50 placeholder:text-bone-400/50 focus:outline-none focus:border-violet-500/40 disabled:opacity-50 disabled:cursor-not-allowed"
                />
                {isEdit && (
                  <p className="text-[10px] text-bone-400 mt-1">
                    Slug cannot be changed after creation
                  </p>
                )}
              </div>
              <div className="col-span-12 md:col-span-4">
                <Label>Difficulty</Label>
                <select
                  value={form.difficulty}
                  onChange={(e) =>
                    setForm({ ...form, difficulty: e.target.value as any })
                  }
                  className="w-full px-3 py-2 bg-ink-950 border border-white/[0.08] rounded-lg text-sm text-bone-50 focus:outline-none focus:border-violet-500/40"
                >
                  <option value="EASY">Easy</option>
                  <option value="MEDIUM">Medium</option>
                  <option value="HARD">Hard</option>
                  <option value="EXPERT">Expert</option>
                </select>
              </div>
              <div className="col-span-12 md:col-span-8">
                <Label>Tags (comma-separated)</Label>
                <input
                  value={tagsInput}
                  onChange={(e) => setTagsInput(e.target.value)}
                  placeholder="array, hash-table, math"
                  className="w-full px-3 py-2 bg-ink-950 border border-white/[0.08] rounded-lg text-sm text-bone-50 placeholder:text-bone-400/50 focus:outline-none focus:border-violet-500/40"
                />
                {form.tags.length > 0 && (
                  <div className="flex flex-wrap gap-1 mt-2">
                    {form.tags.map((t) => (
                      <span
                        key={t}
                        className="text-[10px] px-2 py-0.5 rounded-full bg-violet-500/10 text-violet-300 border border-violet-500/15"
                      >
                        {t}
                      </span>
                    ))}
                  </div>
                )}
              </div>
              <div className="col-span-6 md:col-span-2">
                <Label>Time (ms)</Label>
                <input
                  type="number"
                  min={100}
                  max={60000}
                  value={form.timeLimitMs}
                  onChange={(e) =>
                    setForm({
                      ...form,
                      timeLimitMs: parseInt(e.target.value) || 2000,
                    })
                  }
                  className="w-full px-3 py-2 bg-ink-950 border border-white/[0.08] rounded-lg text-sm font-mono text-bone-50 focus:outline-none focus:border-violet-500/40"
                />
              </div>
              <div className="col-span-6 md:col-span-2">
                <Label>Memory (MB)</Label>
                <input
                  type="number"
                  min={16}
                  max={1024}
                  value={form.memoryLimitMb}
                  onChange={(e) =>
                    setForm({
                      ...form,
                      memoryLimitMb: parseInt(e.target.value) || 128,
                    })
                  }
                  className="w-full px-3 py-2 bg-ink-950 border border-white/[0.08] rounded-lg text-sm font-mono text-bone-50 focus:outline-none focus:border-violet-500/40"
                />
              </div>
            </div>
          </Section>

          {/* Section: Statement */}
          <Section
            title="Problem statement"
            right={
              <button
                onClick={() => setPreviewStatement(!previewStatement)}
                className="text-xs text-violet-400 hover:text-violet-300 flex items-center gap-1 transition-colors"
              >
                {previewStatement ? (
                  <>
                    <EyeOff className="w-3 h-3" />
                    Edit
                  </>
                ) : (
                  <>
                    <Eye className="w-3 h-3" />
                    Preview
                  </>
                )}
              </button>
            }
          >
            <Label>Statement (Markdown supported)</Label>
            {previewStatement ? (
              <div className="min-h-[200px] px-4 py-3 bg-ink-950 border border-white/[0.08] rounded-lg prose prose-invert prose-sm max-w-none">
                <ReactMarkdown remarkPlugins={[remarkGfm]}>
                  {form.statement}
                </ReactMarkdown>
              </div>
            ) : (
              <textarea
                value={form.statement}
                onChange={(e) =>
                  setForm({ ...form, statement: e.target.value })
                }
                rows={10}
                placeholder="Describe the problem. Use markdown — `code`, **bold**, lists, code blocks..."
                className="w-full px-3 py-2 bg-ink-950 border border-white/[0.08] rounded-lg text-sm font-mono text-bone-50 placeholder:text-bone-400/50 focus:outline-none focus:border-violet-500/40 resize-y"
              />
            )}
            <p className="text-[11px] text-bone-400 mt-1">
              Minimum 10 characters. Use ```language for code blocks.
            </p>
          </Section>

          {/* Section: Starter code */}
          <Section title="Starter code">
            <div className="flex flex-wrap gap-1.5 mb-3">
              {LANGUAGES.map((l) => {
                const enabled = !!form.starterCode[l.id];
                return (
                  <button
                    key={l.id}
                    onClick={() => toggleLang(l.id)}
                    className={`px-3 py-1.5 rounded-lg text-xs font-medium border transition-colors ${
                      enabled
                        ? 'bg-violet-500/15 border-violet-500/30 text-violet-300'
                        : 'border-white/[0.08] text-bone-400 hover:text-bone-200 hover:border-white/[0.15]'
                    }`}
                  >
                    {enabled ? '✓' : '+'} {l.label}
                  </button>
                );
              })}
            </div>
            {Object.keys(form.starterCode).length > 0 && (
              <>
                <div className="flex gap-1 mb-2 border-b border-white/[0.06]">
                  {Object.keys(form.starterCode).map((langId) => {
                    const lang = LANGUAGES.find((l) => l.id === langId);
                    return (
                      <button
                        key={langId}
                        onClick={() => setActiveLang(langId)}
                        className={`px-3 py-2 text-xs font-medium border-b-2 -mb-px transition-colors ${
                          activeLang === langId
                            ? 'border-violet-500 text-bone-50'
                            : 'border-transparent text-bone-400 hover:text-bone-200'
                        }`}
                      >
                        {lang?.label || langId}
                      </button>
                    );
                  })}
                </div>
                <div className="rounded-lg border border-white/[0.08] overflow-hidden">
                  <Editor
                    height="240px"
                    language={
                      LANGUAGES.find((l) => l.id === activeLang)?.monaco ||
                      'plaintext'
                    }
                    value={form.starterCode[activeLang] || ''}
                    onChange={(v) =>
                      setForm({
                        ...form,
                        starterCode: {
                          ...form.starterCode,
                          [activeLang]: v || '',
                        },
                      })
                    }
                    theme="vs-dark"
                    options={{
                      minimap: { enabled: false },
                      fontSize: 13,
                      fontFamily: 'JetBrains Mono, monospace',
                      scrollBeyondLastLine: false,
                      padding: { top: 12, bottom: 12 },
                    }}
                  />
                </div>
              </>
            )}
            {Object.keys(form.starterCode).length === 0 && (
              <div className="text-center py-6 text-sm text-bone-400">
                Click a language above to enable its starter code
              </div>
            )}
          </Section>

          {/* Section: Test cases */}
          <Section
            title="Test cases"
            right={
              <button
                onClick={addTestCase}
                className="text-xs text-violet-400 hover:text-violet-300 flex items-center gap-1 transition-colors"
              >
                <Plus className="w-3 h-3" />
                Add test case
              </button>
            }
          >
            <p className="text-xs text-bone-400 mb-3">
              First 2-3 test cases should be{' '}
              <span className="text-bone-200">visible</span> (shown as examples
              to the user). Mark the rest as{' '}
              <span className="text-bone-200">hidden</span> to prevent
              hardcoding.
            </p>
            <div className="space-y-2">
              {form.testCases.map((tc, i) => (
                <div
                  key={i}
                  className="rounded-lg border border-white/[0.06] bg-ink-950/40 p-3"
                >
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xs text-bone-400 font-mono">
                      Test #{i + 1}
                    </span>
                    <div className="flex items-center gap-2">
                      <label className="flex items-center gap-1.5 text-xs text-bone-300 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={tc.isHidden}
                          onChange={(e) =>
                            updateTestCase(i, { isHidden: e.target.checked })
                          }
                          className="accent-violet-500"
                        />
                        Hidden
                      </label>
                      {form.testCases.length > 1 && (
                        <button
                          onClick={() => removeTestCase(i)}
                          className="w-6 h-6 rounded text-bone-400 hover:text-red-400 hover:bg-red-500/10 flex items-center justify-center transition-colors"
                        >
                          <Trash2 className="w-3 h-3" />
                        </button>
                      )}
                    </div>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                    <div>
                      <div className="text-[10px] text-bone-400 mb-1 uppercase tracking-wider">
                        Input (stdin)
                      </div>
                      <textarea
                        value={tc.input}
                        onChange={(e) =>
                          updateTestCase(i, { input: e.target.value })
                        }
                        rows={4}
                        placeholder="3&#10;5"
                        className="w-full px-2 py-1.5 bg-ink-950 border border-white/[0.08] rounded text-xs font-mono text-bone-50 placeholder:text-bone-400/50 focus:outline-none focus:border-violet-500/40 resize-none"
                      />
                    </div>
                    <div>
                      <div className="text-[10px] text-bone-400 mb-1 uppercase tracking-wider">
                        Expected output (stdout)
                      </div>
                      <textarea
                        value={tc.expectedOutput}
                        onChange={(e) =>
                          updateTestCase(i, { expectedOutput: e.target.value })
                        }
                        rows={4}
                        placeholder="8"
                        className="w-full px-2 py-1.5 bg-ink-950 border border-white/[0.08] rounded text-xs font-mono text-bone-50 placeholder:text-bone-400/50 focus:outline-none focus:border-violet-500/40 resize-none"
                      />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </Section>

          {/* Save button at bottom */}
          <div className="flex justify-end gap-2 pt-4">
            <Link
              to="/admin/problems"
              className="px-4 py-2 rounded-lg border border-white/[0.08] text-bone-300 text-sm hover:bg-white/[0.02] transition-colors"
            >
              Cancel
            </Link>
            <button
              onClick={() => save.mutate()}
              disabled={!canSave || save.isPending}
              className="px-4 py-2 rounded-lg bg-violet-600 hover:bg-violet-500 disabled:bg-ink-700 disabled:text-bone-400 text-white text-sm font-medium flex items-center gap-2 transition-colors disabled:cursor-not-allowed"
            >
              <Save className="w-4 h-4" />
              {save.isPending
                ? 'Saving…'
                : isEdit
                ? 'Save changes'
                : 'Create problem'}
            </button>
          </div>
        </div>
      </div>
    </AdminLayout>
  );
}

const Section = ({
  title,
  right,
  children,
}: {
  title: string;
  right?: React.ReactNode;
  children: React.ReactNode;
}) => (
  <div className="rounded-2xl border border-white/[0.06] bg-ink-900/60 p-5">
    <div className="flex items-center justify-between mb-4">
      <h3 className="font-display text-lg text-bone-50">{title}</h3>
      {right}
    </div>
    {children}
  </div>
);

const Label = ({ children }: { children: React.ReactNode }) => (
  <div className="text-[10px] text-bone-400 uppercase tracking-wider mb-1.5 font-medium">
    {children}
  </div>
);
