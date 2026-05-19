import { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { AuthShell, AuthInput, AuthButton } from '@/components/auth/AuthShell';
import { useAuthStore } from '@/store/authStore';

export default function Login() {
  const navigate = useNavigate();
  const location = useLocation();
  const login = useAuthStore((s) => s.login);

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      await login(email, password);
      // Role-based redirect: each role gets their own home
      const freshUser = useAuthStore.getState().user;
      const role = freshUser?.role;
      let target = (location.state as { from?: Location })?.from?.pathname || '/dashboard';
      if (role === 'SUPER_ADMIN' || role === 'SCHOOL_ADMIN' || role === 'COLLEGE_ADMIN') {
        target = '/admin';
      } else if (role === 'TEACHER') {
        target = '/teacher';
      }
      navigate(target, { replace: true });
    } catch (err: any) {
      setError(err?.response?.data?.error || 'Login failed. Check your email and password.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthShell
      eyebrow="Sign in"
      title={<>Welcome back.</>}
      subtitle="Your study cockpit is waiting. Pick up exactly where you left off."
      footer={
        <>
          New to Scholr?{' '}
          <Link to="/signup" className="text-bone-100 underline underline-offset-4 hover:text-violet-300 transition-colors">
            Create an account
          </Link>
        </>
      }
    >
      <form onSubmit={onSubmit}>
        <AuthInput
          label="Email"
          type="email"
          placeholder="you@university.edu"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
          autoComplete="email"
        />
        <AuthInput
          label="Password"
          type="password"
          placeholder="••••••••"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
          autoComplete="current-password"
        />

        <div className="flex items-center justify-between mb-6 text-sm">
          <label className="flex items-center gap-2 text-bone-300 cursor-pointer">
            <input type="checkbox" className="rounded border-white/20 bg-ink-900" />
            <span>Remember me</span>
          </label>
          <Link
            to="/forgot-password"
            className="text-bone-300 hover:text-violet-300 transition-colors"
          >
            Forgot password?
          </Link>
        </div>

        {error && (
          <div className="mb-4 px-4 py-3 rounded-xl bg-magenta-500/10 border border-magenta-500/30 text-magenta-200 text-sm">
            {error}
          </div>
        )}

        <AuthButton type="submit" disabled={loading}>
          {loading ? 'Signing in…' : 'Sign in'}
        </AuthButton>

        <div className="relative my-6">
          <div className="absolute inset-0 flex items-center">
            <div className="w-full border-t border-white/10" />
          </div>
          <div className="relative flex justify-center">
            <span className="px-3 bg-ink-950 text-xs text-bone-400 uppercase tracking-wider">
              or
            </span>
          </div>
        </div>

        <button
          type="button"
          className="w-full py-3 border border-white/10 rounded-xl text-bone-100 hover:bg-white/5 transition-colors flex items-center justify-center gap-3"
        >
          <svg width="18" height="18" viewBox="0 0 18 18">
            <path
              fill="#4285F4"
              d="M17.64 9.2c0-.637-.057-1.251-.164-1.84H9v3.481h4.844c-.209 1.125-.843 2.078-1.796 2.717v2.258h2.908c1.702-1.567 2.684-3.874 2.684-6.615z"
            />
            <path
              fill="#34A853"
              d="M9 18c2.43 0 4.467-.806 5.956-2.18l-2.908-2.259c-.806.54-1.836.86-3.048.86-2.344 0-4.328-1.584-5.036-3.711H.957v2.332A8.997 8.997 0 0 0 9 18z"
            />
            <path
              fill="#FBBC05"
              d="M3.964 10.71A5.41 5.41 0 0 1 3.682 9c0-.593.102-1.17.282-1.71V4.958H.957A8.996 8.996 0 0 0 0 9c0 1.452.348 2.827.957 4.042l3.007-2.332z"
            />
            <path
              fill="#EA4335"
              d="M9 3.58c1.321 0 2.508.454 3.44 1.345l2.582-2.58C13.463.891 11.426 0 9 0A8.997 8.997 0 0 0 .957 4.958L3.964 7.29C4.672 5.163 6.656 3.58 9 3.58z"
            />
          </svg>
          Continue with Google
        </button>
      </form>
    </AuthShell>
  );
}
