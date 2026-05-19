import { Navigate } from 'react-router-dom';
import { useAuthStore, isTeacher } from '@/store/authStore';

export const TeacherRoute = ({ children }: { children: React.ReactNode }) => {
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

  // Teachers and admins can access teacher pages
  if (!isTeacher(user)) {
    return (
      <div className="min-h-screen bg-ink-950 text-bone-100 flex items-center justify-center p-6">
        <div className="max-w-md text-center">
          <div className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center">
            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-emerald-400">
              <path d="M22 10v6M2 10l10-5 10 5-10 5z"/><path d="M6 12v5c3 3 9 3 12 0v-5"/>
            </svg>
          </div>
          <h1 className="font-display text-3xl text-bone-50 mb-2">Teacher access required</h1>
          <p className="text-bone-300 text-sm mb-6">
            This area is for teachers only. If you should have teacher access, ask an admin to update your role.
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
