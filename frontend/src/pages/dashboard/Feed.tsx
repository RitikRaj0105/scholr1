import { useState } from 'react';
import { useQuery, useInfiniteQuery } from '@tanstack/react-query';
import { motion, AnimatePresence } from 'framer-motion';
import { Link } from 'react-router-dom';
import { Search, Loader2, Compass, UserPlus, Users } from 'lucide-react';
import { DashboardLayout } from '@/components/dashboard/DashboardLayout';
import { CreatePost } from '@/components/social/CreatePost';
import { PostCard, type PostData, type SocialUser } from '@/components/social/PostCard';
import { api } from '@/lib/api';

interface FeedPage {
  posts: PostData[];
  nextCursor: string | null;
}

export default function Feed() {
  const [search, setSearch] = useState('');
  const [showSearch, setShowSearch] = useState(false);

  // Infinite feed
  const {
    data,
    isLoading,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
  } = useInfiniteQuery<FeedPage>({
    queryKey: ['feed'],
    queryFn: async ({ pageParam }) => {
      const params = new URLSearchParams();
      if (pageParam) params.set('cursor', pageParam as string);
      return (await api.get(`/social/feed?${params.toString()}`)).data;
    },
    getNextPageParam: (last) => last.nextCursor,
    initialPageParam: undefined as string | undefined,
  });

  const posts: PostData[] = (data?.pages ?? []).flatMap((p) => p.posts);

  // User search (only when typing)
  const { data: searchResults = [], isLoading: searchLoading } = useQuery<
    (SocialUser & { _count: { followers: number } })[]
  >({
    queryKey: ['user-search', search],
    queryFn: async () =>
      (await api.get(`/social/search?q=${encodeURIComponent(search)}`)).data.users,
    enabled: search.trim().length >= 2,
  });

  return (
    <DashboardLayout>
      <div className="p-6 lg:p-8 max-w-3xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
          className="mb-5 flex items-end justify-between gap-3 flex-wrap"
        >
          <div>
            <p className="text-xs text-violet-400 font-medium uppercase tracking-wider mb-1">
              Community
            </p>
            <h1 className="font-display text-3xl text-bone-50">
              Your <span className="text-violet-400">feed.</span>
            </h1>
          </div>
          <button
            onClick={() => setShowSearch(!showSearch)}
            className="flex items-center gap-1.5 px-3 py-2 rounded-lg border border-white/[0.06] text-bone-300 hover:bg-white/[0.03] text-xs transition-colors"
          >
            <Search className="w-3.5 h-3.5" />
            Find people
          </button>
        </motion.div>

        {/* Search */}
        <AnimatePresence>
          {showSearch && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="overflow-hidden mb-4"
            >
              <div className="rounded-2xl border border-white/[0.06] bg-ink-900/60 p-4">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-bone-400" />
                  <input
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    placeholder="Search by name or email…"
                    autoFocus
                    className="w-full pl-10 pr-4 py-2 bg-ink-950 border border-white/[0.08] rounded-lg text-sm text-bone-50 placeholder:text-bone-400/50 focus:outline-none focus:border-violet-500/40"
                  />
                </div>
                {search.trim().length >= 2 && (
                  <div className="mt-3 space-y-1">
                    {searchLoading && (
                      <p className="text-xs text-bone-400 text-center py-3">Searching…</p>
                    )}
                    {!searchLoading && searchResults.length === 0 && (
                      <p className="text-xs text-bone-400 text-center py-3">
                        No people found
                      </p>
                    )}
                    {searchResults.map((u) => (
                      <Link
                        key={u.id}
                        to={`/dashboard/profile/${u.id}`}
                        className="flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-white/[0.03] transition-colors"
                      >
                        <div className="w-9 h-9 rounded-full bg-violet-600 flex items-center justify-center text-white text-xs font-semibold flex-shrink-0">
                          {(u.firstName?.[0] || u.email[0]).toUpperCase()}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm text-bone-100 truncate">
                            {u.firstName || u.lastName
                              ? `${u.firstName ?? ''} ${u.lastName ?? ''}`.trim()
                              : u.email.split('@')[0]}
                          </p>
                          <p className="text-xs text-bone-400 truncate">
                            {u.headline || u.email}
                          </p>
                        </div>
                        <span className="text-[10px] text-bone-400 flex items-center gap-1 flex-shrink-0">
                          <Users className="w-2.5 h-2.5" />
                          {u._count.followers}
                        </span>
                      </Link>
                    ))}
                  </div>
                )}
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Create post */}
        <div className="mb-4">
          <CreatePost />
        </div>

        {/* Feed */}
        {isLoading && (
          <div className="rounded-2xl border border-white/[0.06] bg-ink-900/60 p-10 text-center text-bone-400 text-sm flex items-center justify-center gap-2">
            <Loader2 className="w-4 h-4 animate-spin" />
            Loading feed…
          </div>
        )}

        {!isLoading && posts.length === 0 && (
          <div className="rounded-2xl border border-white/[0.06] bg-ink-900/60 p-10 text-center">
            <Compass className="w-10 h-10 text-bone-400/30 mx-auto mb-3" />
            <p className="text-sm text-bone-300 mb-1">Your feed is quiet</p>
            <p className="text-xs text-bone-400 mb-4">
              Follow people to see their posts here, or share your own first post above
            </p>
            <button
              onClick={() => setShowSearch(true)}
              className="inline-flex items-center gap-2 px-3 py-1.5 rounded-lg bg-violet-600 hover:bg-violet-500 text-white text-xs font-medium transition-colors"
            >
              <UserPlus className="w-3 h-3" />
              Find people to follow
            </button>
          </div>
        )}

        <div className="space-y-3">
          <AnimatePresence>
            {posts.map((p) => (
              <PostCard key={p.id} post={p} />
            ))}
          </AnimatePresence>
        </div>

        {hasNextPage && (
          <button
            onClick={() => fetchNextPage()}
            disabled={isFetchingNextPage}
            className="mt-4 w-full py-2.5 rounded-lg border border-white/[0.06] text-bone-300 text-xs hover:bg-white/[0.03] transition-colors flex items-center justify-center gap-2"
          >
            {isFetchingNextPage ? (
              <>
                <Loader2 className="w-3 h-3 animate-spin" />
                Loading more…
              </>
            ) : (
              'Load more posts'
            )}
          </button>
        )}
      </div>
    </DashboardLayout>
  );
}
