import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { AuthShell, AuthInput, AuthButton } from '@/components/auth/AuthShell';
import { useAuthStore } from '@/store/authStore';

export default function Signup() {
  const navigate = useNavigate();
  const signup = useAuthStore((s) => s.signup);

  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      await signup({ email, password, firstName, lastName });
      // Send to profile setup where they pick role + fill details
      navigate('/profile-setup', { replace: true });
    } catch (err: any) {
      setError(
        err?.response?.data?.error || 'Could not create account. Try again.'
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthShell
      eyebrow="Create account"
      title={
        <>
          Start your <span className="italic">edge.</span>
        </>
      }
      subtitle="Free forever. No card. 2.4M students already shipping their study system on Scholr."
      footer={
        <>
          Already have an account?{' '}
          <Link
            to="/login"
            className="text-bone-100 underline underline-offset-4 hover:text-violet-300 transition-colors"
          >
            Sign in
          </Link>
        </>
      }
    >
      <form onSubmit={onSubmit}>
        <div className="grid grid-cols-2 gap-3">
          <AuthInput
            label="First name"
            value={firstName}
            onChange={(e) => setFirstName(e.target.value)}
            required
            autoComplete="given-name"
          />
          <AuthInput
            label="Last name"
            value={lastName}
            onChange={(e) => setLastName(e.target.value)}
            required
            autoComplete="family-name"
          />
        </div>
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
          placeholder="At least 8 characters"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
          minLength={8}
          autoComplete="new-password"
        />

        {error && (
          <div className="mb-4 px-4 py-3 rounded-xl bg-magenta-500/10 border border-magenta-500/30 text-magenta-200 text-sm">
            {error}
          </div>
        )}

        <AuthButton type="submit" disabled={loading}>
          {loading ? 'Creating account…' : 'Create account'}
        </AuthButton>

        <p className="text-xs text-bone-400/70 mt-4 text-center">
          By creating an account, you agree to our Terms and Privacy Policy.
        </p>
      </form>
    </AuthShell>
  );
}
