import { Navigate } from 'react-router-dom';
import { useAuthStore, isAdmin } from '@/store/authStore';

export const AdminRoute = ({ children }: { children: React.ReactNode }) => {
  const user = useAuthStore((s) => s.user);
  const status = useAuthStore((s) => s.status);

  if (status === 'loading' || status === 'idle') {
    return (
      <div className="min-h-screen bg-ink-950 flex items-center justify-center">
        <div className="text-bone-300 text-sm">Loading…</div>
      </div>
    );
  }

  if (status !== 'authenticated') {
    return <Navigate to="/login" replace />;
  }

  if (!isAdmin(user)) {
    return (
      <div className="min-h-screen bg-ink-950 text-bone-100 flex items-center justify-center p-6">
        <div className="max-w-md text-center">
          <div className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-red-500/10 border border-red-500/20 flex items-center justify-center">
            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-red-400"><circle cx="12" cy="12" r="10"/><line x1="4.93" x2="19.07" y1="4.93" y2="19.07"/></svg>
          </div>
          <h1 className="font-display text-3xl text-bone-50 mb-2">Admin access required</h1>
          <p className="text-bone-300 text-sm mb-6">
            This area is for administrators only. If you should have access, ask another admin to promote your account.
          </p>
          <a
            href="/dashboard"
            className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-violet-600 hover:bg-violet-500 text-white text-sm font-medium transition-colors"
          >
            Back to dashboard
          </a>
        </div>
      </div>
    );
  }

  return <>{children}</>;
};
