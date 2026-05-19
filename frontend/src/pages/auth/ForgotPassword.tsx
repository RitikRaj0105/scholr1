import { useState } from 'react';
import { Link } from 'react-router-dom';
import { AuthShell, AuthInput, AuthButton } from '@/components/auth/AuthShell';
import { api } from '@/lib/api';

export default function ForgotPassword() {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [done, setDone] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      await api.post('/auth/forgot-password', { email });
      setDone(true);
    } catch (err: any) {
      setError(err?.response?.data?.error || 'Something went wrong.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthShell
      eyebrow="Reset password"
      title={<>Forgot it. It happens.</>}
      subtitle="Tell us the email on your account. We'll send a recovery link."
      footer={
        <>
          Remembered it?{' '}
          <Link
            to="/login"
            className="text-bone-100 underline underline-offset-4 hover:text-violet-300 transition-colors"
          >
            Back to sign in
          </Link>
        </>
      }
    >
      {done ? (
        <div className="rounded-2xl border border-cyan-500/30 bg-cyan-500/5 p-6">
          <div className="flex items-start gap-3">
            <div className="w-10 h-10 rounded-xl bg-cyan-500/20 border border-cyan-500/30 flex items-center justify-center flex-shrink-0">
              <svg
                width="20"
                height="20"
                viewBox="0 0 24 24"
                fill="none"
                stroke="#67e8f9"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <polyline points="20 6 9 17 4 12" />
              </svg>
            </div>
            <div>
              <div className="font-display text-lg text-bone-50 mb-1">
                Check your inbox
              </div>
              <p className="text-sm text-bone-300/90">
                If an account exists for <span className="text-bone-100">{email}</span>,
                we just sent a recovery link. It'll expire in 1 hour.
              </p>
            </div>
          </div>
        </div>
      ) : (
        <form onSubmit={onSubmit}>
          <AuthInput
            label="Email"
            type="email"
            placeholder="you@university.edu"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />

          {error && (
            <div className="mb-4 px-4 py-3 rounded-xl bg-magenta-500/10 border border-magenta-500/30 text-magenta-200 text-sm">
              {error}
            </div>
          )}

          <AuthButton type="submit" disabled={loading}>
            {loading ? 'Sending…' : 'Send recovery link'}
          </AuthButton>
        </form>
      )}
    </AuthShell>
  );
}
