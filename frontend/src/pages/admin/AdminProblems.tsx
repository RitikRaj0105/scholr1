import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { motion, AnimatePresence } from 'framer-motion';
import { Plus, Search, Edit2, Trash2, Code2 } from 'lucide-react';
import { AdminLayout } from '@/components/admin/AdminLayout';
import { api } from '@/lib/api';

interface ProblemRow {
  id: string;
  slug: string;
  title: string;
  difficulty: 'EASY' | 'MEDIUM' | 'HARD' | 'EXPERT';
  tags: string[];
  createdAt: string;
  _count: { submissions: number };
}

const DIFF_COLOR = {
  EASY: 'text-emerald-400 bg-emerald-500/10 border-emerald-500/15',
  MEDIUM: 'text-amber-400 bg-amber-500/10 border-amber-500/15',
  HARD: 'text-red-400 bg-red-500/10 border-red-500/15',
  EXPERT: 'text-violet-400 bg-violet-500/10 border-violet-500/15',
};

export default function AdminProblems() {
  const qc = useQueryClient();
  const [search, setSearch] = useState('');
  const [confirmDelete, setConfirmDelete] = useState<string | null>(null);

  const { data: problems = [], isLoading } = useQuery<ProblemRow[]>({
    queryKey: ['admin-problems'],
    queryFn: async () => (await api.get('/admin/problems')).data.problems,
  });

  const del = useMutation({
    mutationFn: (slug: string) => api.delete(`/admin/problems/${slug}`),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['admin-problems'] });
      qc.invalidateQueries({ queryKey: ['code-problems'] });
      qc.invalidateQueries({ queryKey: ['admin-stats'] });
      setConfirmDelete(null);
    },
  });

  const filtered = problems.filter((p) =>
    search
      ? p.title.toLowerCase().includes(search.toLowerCase()) ||
        p.slug.toLowerCase().includes(search.toLowerCase())
      : true
  );

  return (
    <AdminLayout>
      <div className="p-6 lg:p-8 max-w-7xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
          className="mb-6 flex items-end justify-between gap-4 flex-wrap"
        >
          <div>
            <p className="text-xs text-red-400 font-medium uppercase tracking-wider mb-1">
              Admin
            </p>
            <h1 className="font-display text-3xl text-bone-50">
              Coding problems
              <span className="text-bone-400 text-xl ml-2 font-mono">
                {problems.length}
              </span>
            </h1>
          </div>
          <Link
            to="/admin/problems/new"
            className="px-4 py-2 rounded-lg bg-violet-600 hover:bg-violet-500 text-white text-sm font-medium flex items-center gap-2 transition-colors"
          >
            <Plus className="w-4 h-4" />
            New problem
          </Link>
        </motion.div>

        {/* Search */}
        <div className="relative mb-4">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-bone-400" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by title or slug…"
            className="w-full pl-10 pr-4 py-2 bg-ink-900/60 border border-white/[0.06] rounded-lg text-sm text-bone-50 placeholder:text-bone-400/50 focus:outline-none focus:border-violet-500/40"
          />
        </div>

        {/* Table */}
        <div className="rounded-2xl border border-white/[0.06] bg-ink-900/60 overflow-hidden">
          {isLoading && (
            <div className="p-12 text-center text-bone-400 text-sm">
              Loading problems…
            </div>
          )}

          {!isLoading && problems.length === 0 && (
            <div className="p-12 text-center">
              <Code2 className="w-10 h-10 text-bone-400/30 mx-auto mb-3" />
              <p className="text-bone-300 text-sm mb-1">No problems yet</p>
              <p className="text-bone-400 text-xs mb-4">
                Create your first coding problem to get started
              </p>
              <Link
                to="/admin/problems/new"
                className="inline-flex items-center gap-2 px-3 py-1.5 rounded-lg bg-violet-600 hover:bg-violet-500 text-white text-sm font-medium transition-colors"
              >
                <Plus className="w-3.5 h-3.5" />
                Create first problem
              </Link>
            </div>
          )}

          {!isLoading && problems.length > 0 && filtered.length === 0 && (
            <div className="p-12 text-center text-bone-400 text-sm">
              No problems match your search.
            </div>
          )}

          {filtered.length > 0 && (
            <div className="divide-y divide-white/[0.04]">
              <div className="grid grid-cols-12 gap-3 px-5 py-2.5 text-[10px] uppercase tracking-wider text-bone-400 font-medium bg-white/[0.02]">
                <div className="col-span-5">Title</div>
                <div className="col-span-3">Tags</div>
                <div className="col-span-1 text-right">Subs</div>
                <div className="col-span-2">Difficulty</div>
                <div className="col-span-1 text-right">Actions</div>
              </div>

              <AnimatePresence initial={false}>
                {filtered.map((p, i) => (
                  <motion.div
                    key={p.id}
                    layout
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, x: -16 }}
                    transition={{ duration: 0.25, delay: i * 0.02 }}
                    className="group grid grid-cols-12 gap-3 px-5 py-3 items-center hover:bg-white/[0.02] transition-colors"
                  >
                    <div className="col-span-5 min-w-0">
                      <div className="text-sm text-bone-100 truncate">
                        {p.title}
                      </div>
                      <div className="text-[11px] text-bone-400 font-mono truncate">
                        {p.slug}
                      </div>
                    </div>
                    <div className="col-span-3 flex flex-wrap gap-1">
                      {p.tags.slice(0, 3).map((t) => (
                        <span
                          key={t}
                          className="text-[10px] px-1.5 py-0.5 rounded bg-white/[0.04] text-bone-300"
                        >
                          {t}
                        </span>
                      ))}
                      {p.tags.length > 3 && (
                        <span className="text-[10px] text-bone-400">
                          +{p.tags.length - 3}
                        </span>
                      )}
                    </div>
                    <div className="col-span-1 text-right text-xs font-mono text-bone-300">
                      {p._count.submissions}
                    </div>
                    <div className="col-span-2">
                      <span
                        className={`text-[10px] px-1.5 py-0.5 rounded border uppercase tracking-wider ${DIFF_COLOR[p.difficulty]}`}
                      >
                        {p.difficulty}
                      </span>
                    </div>
                    <div className="col-span-1 flex items-center justify-end gap-1">
                      <Link
                        to={`/admin/problems/${p.slug}`}
                        className="w-7 h-7 rounded-md text-bone-400 hover:text-violet-400 hover:bg-violet-500/10 flex items-center justify-center transition-colors"
                        title="Edit"
                      >
                        <Edit2 className="w-3.5 h-3.5" />
                      </Link>
                      <button
                        onClick={() => setConfirmDelete(p.slug)}
                        className="w-7 h-7 rounded-md text-bone-400 hover:text-red-400 hover:bg-red-500/10 flex items-center justify-center transition-colors"
                        title="Delete"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </motion.div>
                ))}
              </AnimatePresence>
            </div>
          )}
        </div>
      </div>

      {/* Delete confirmation */}
      <AnimatePresence>
        {confirmDelete && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-ink-950/80 backdrop-blur-sm flex items-center justify-center z-50 p-6"
            onClick={() => setConfirmDelete(null)}
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              transition={{ duration: 0.2 }}
              onClick={(e) => e.stopPropagation()}
              className="w-full max-w-md rounded-2xl border border-red-500/20 bg-ink-900 p-6"
            >
              <h3 className="font-display text-xl text-bone-50 mb-2">
                Delete problem?
              </h3>
              <p className="text-sm text-bone-300 mb-4">
                This permanently deletes <span className="font-mono text-violet-400">{confirmDelete}</span> and{' '}
                <span className="text-red-400">all submissions</span> from every user. Cannot be undone.
              </p>
              <div className="flex gap-2">
                <button
                  onClick={() => setConfirmDelete(null)}
                  className="flex-1 py-2 rounded-lg border border-white/[0.08] text-bone-300 text-sm hover:bg-white/[0.02] transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={() => del.mutate(confirmDelete)}
                  disabled={del.isPending}
                  className="flex-1 py-2 rounded-lg bg-red-600 hover:bg-red-500 text-white text-sm font-medium disabled:opacity-50 transition-colors"
                >
                  {del.isPending ? 'Deleting…' : 'Delete forever'}
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </AdminLayout>
  );
}
