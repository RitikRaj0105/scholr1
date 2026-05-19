import { Navigate, useLocation } from 'react-router-dom';
import { useAuthStore } from '../store/authStore';

export const ProtectedRoute = ({ children }: { children: React.ReactNode }) => {
  const status = useAuthStore((s) => s.status);
  const location = useLocation();

  if (status === 'loading' || status === 'idle') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-ink-950">
        <div className="text-bone-300 font-display text-lg flex items-center gap-3">
          <span className="w-2 h-2 rounded-full bg-violet-500 animate-pulse" />
          Loading
        </div>
      </div>
    );
  }

  if (status === 'unauthenticated') {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  return <>{children}</>;
};
