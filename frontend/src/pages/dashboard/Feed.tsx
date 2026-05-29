import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Search, Layers, MessageSquare, HardHat, Wrench, Send, Loader2, Filter,
} from 'lucide-react';
import { DashboardLayout } from '@/components/dashboard/DashboardLayout';
import { CreatePost } from '@/components/social/CreatePost';
import { PostCard, type PostData } from '@/components/social/PostCard';
import { QuickPostJob } from '@/components/dashboard/QuickPostJob';
import { JobFeedCard } from '@/components/feed/JobFeedCard';
import { ServiceFeedCard } from '@/components/feed/ServiceFeedCard';
import { api } from '@/lib/api';

type FeedKind = 'all' | 'posts' | 'jobs' | 'services';

interface FeedItem {
  kind: 'POST' | 'JOB' | 'SERVICE';
  id: string;
  createdAt: string;
  data: any;
}

const TABS: { value: FeedKind; label: string; icon: any }[] = [
  { value: 'all', label: 'All', icon: Layers },
  { value: 'posts', label: 'Posts', icon: MessageSquare },
  { value: 'jobs', label: 'Jobs', icon: HardHat },
  { value: 'services', label: 'Services', icon: Wrench },
];

export default function Feed() {
  const [tab, setTab] = useState<FeedKind>('all');
  const [search, setSearch] = useState('');
  const [searchInput, setSearchInput] = useState('');
  const navigate = useNavigate();

  const { data, isLoading } = useQuery<{ items: FeedItem[]; users?: any[] }>({
    queryKey: ['unified-feed', tab, search],
    queryFn: async () => {
      const params = new URLSearchParams();
      params.set('filter', tab);
      if (search) params.set('search', search);
      params.set('limit', '20');
      return (await api.get(`/feed/all?${params}`)).data;
    },
  });

  const items = data?.items || [];
  const users = data?.users || [];

  return (
    <DashboardLayout>
      <div className="max-w-2xl mx-auto space-y-4 pb-8">
        {/* Header */}
        <div>
          <h1 className="font-display text-2xl md:text-3xl text-white">Feed</h1>
          <p className="text-xs text-zinc-400 mt-0.5">
            Posts, jobs, and services — all in one place. Search across everything.
          </p>
        </div>

        {/* Global search */}
        <form
          onSubmit={(e) => { e.preventDefault(); setSearch(searchInput); }}
          className="relative"
        >
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500" />
          <input
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
            placeholder="Search posts, jobs, or services…"
            className="w-full pl-10 pr-3 py-2.5 bg-zinc-900 border border-zinc-700 rounded-lg text-sm text-white placeholder:text-zinc-500 focus:outline-none focus:border-violet-500"
          />
          {search && search !== searchInput && (
            <button
              type="button"
              onClick={() => { setSearch(''); setSearchInput(''); }}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-zinc-400 hover:text-white"
            >
              Clear
            </button>
          )}
        </form>

        {/* Tabs */}
        <div className="flex gap-1 p-1 rounded-lg bg-zinc-900 border border-zinc-800">
          {TABS.map((t) => {
            const Icon = t.icon;
            const active = tab === t.value;
            return (
              <button
                key={t.value}
                onClick={() => setTab(t.value)}
                className={`flex-1 flex items-center justify-center gap-1.5 px-3 py-2 rounded-md text-xs font-medium transition-all ${
                  active
                    ? 'bg-violet-600 text-white shadow'
                    : 'text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800'
                }`}
              >
                <Icon className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">{t.label}</span>
                <span className="sm:hidden">{t.value === 'all' ? 'All' : t.label}</span>
              </button>
            );
          })}
        </div>

        {/* Composers — what shows depends on the active tab */}
        {(tab === 'all' || tab === 'posts') && <CreatePost />}
        {(tab === 'all' || tab === 'jobs') && <QuickPostJob />}
        {tab === 'services' && (
          <Link
            to="/dashboard/services/me"
            className="block rounded-2xl border border-dashed border-violet-500/30 bg-violet-500/[0.04] hover:bg-violet-500/[0.08] p-4 transition-colors"
          >
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-violet-500/20 flex items-center justify-center">
                <Wrench className="w-5 h-5 text-violet-300" />
              </div>
              <div className="flex-1">
                <p className="text-sm font-medium text-zinc-100">Offer your service</p>
                <p className="text-xs text-zinc-400 mt-0.5">
                  Cook, driver, tutor, gym trainer — list yourself in 1 minute
                </p>
              </div>
              <span className="text-xs text-violet-400">Open →</span>
            </div>
          </Link>
        )}
        {/* User search results */}
        {users.length > 0 && (
          <div className="space-y-2">
            <h3 className="text-xs font-semibold text-zinc-400 uppercase tracking-wider">People</h3>
            {users.map((u: any) => (
              <Link
                key={u.id}
                to={`/dashboard/profile/${u.id}`}
                className="flex items-center gap-3 p-3 rounded-xl border border-zinc-800 bg-zinc-900 hover:border-violet-500/30 transition-colors"
              >
                <div className="w-10 h-10 rounded-full bg-violet-600 flex items-center justify-center text-white font-semibold text-sm overflow-hidden">
                  {u.avatarUrl ? <img src={u.avatarUrl} alt="" className="w-full h-full object-cover" /> : (u.firstName?.[0] || '?')}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="text-sm font-medium text-white truncate">{u.firstName} {u.lastName}</div>
                  <div className="text-xs text-zinc-400 truncate">{u.headline || u.role}</div>
                </div>
                {u.city && <span className="text-xs text-zinc-500">{u.city}</span>}
              </Link>
            ))}
          </div>
        )}

        {/* Feed items */}
        {isLoading ? (
          <div className="flex justify-center py-12">
            <Loader2 className="w-6 h-6 animate-spin text-zinc-500" />
          </div>
        ) : items.length === 0 ? (
          <div className="rounded-2xl border border-zinc-800 bg-zinc-900 p-10 text-center">
            <Layers className="w-10 h-10 mx-auto mb-3 text-zinc-700" />
            <p className="text-sm text-zinc-400">
              {search ? `No results for "${search}"` : 'Nothing here yet.'}
            </p>
            <p className="text-[11px] text-zinc-500 mt-1">
              Be the first to post something!
            </p>
          </div>
        ) : (
          <AnimatePresence mode="popLayout">
            {items.map((item, i) => (
              <motion.div
                key={`${item.kind}-${item.id}`}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -8 }}
                transition={{ delay: Math.min(i * 0.02, 0.3) }}
                layout
              >
                {item.kind === 'POST' && <PostCard post={item.data as PostData} />}
                {item.kind === 'JOB' && <JobFeedCard job={item.data} />}
                {item.kind === 'SERVICE' && <ServiceFeedCard service={item.data} />}
              </motion.div>
            ))}
          </AnimatePresence>
        )}
      </div>
    </DashboardLayout>
  );
}
