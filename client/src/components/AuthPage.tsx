import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';

type Mode = 'login' | 'signup' | 'forgot' | 'reset';

// Password strength rules
const PW_RULES = [
  { label: '8+ characters', test: (p: string) => p.length >= 8 },
  { label: 'Uppercase letter', test: (p: string) => /[A-Z]/.test(p) },
  { label: 'Lowercase letter', test: (p: string) => /[a-z]/.test(p) },
  { label: 'Number', test: (p: string) => /\d/.test(p) },
  { label: 'Special character', test: (p: string) => /[!@#$%^&*()_+\-=[\]{};':"\\|,.<>/?]/.test(p) },
];

function passwordStrength(pw: string): { score: number; label: string; color: string } {
  const passed = PW_RULES.filter(r => r.test(pw)).length;
  if (passed <= 1) return { score: passed, label: 'Weak', color: '#ef4444' };
  if (passed <= 2) return { score: passed, label: 'Fair', color: '#f59e0b' };
  if (passed <= 3) return { score: passed, label: 'Good', color: '#3b82f6' };
  if (passed <= 4) return { score: passed, label: 'Strong', color: '#10b981' };
  return { score: passed, label: 'Very Strong', color: '#059669' };
}

export default function AuthPage() {
  const [mode, setMode] = useState<Mode>('login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [loading, setLoading] = useState(false);

  // Check for password reset token in URL
  useEffect(() => {
    const hash = window.location.hash;
    if (hash && hash.includes('type=recovery')) {
      setMode('reset');
    }
  }, []);

  const clearMessages = () => { setError(''); setSuccess(''); };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    clearMessages();
    if (!email.trim() || !password) { setError('Please fill in all fields.'); return; }

    setLoading(true);
    const { error } = await supabase.auth.signInWithPassword({ email: email.trim(), password });
    setLoading(false);

    if (error) {
      if (error.message.includes('Invalid login')) {
        setError('Invalid email or password. Please try again.');
      } else if (error.message.includes('Email not confirmed')) {
        setError('Please verify your email before logging in. Check your inbox.');
      } else {
        setError(error.message);
      }
    }
  };

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    clearMessages();
    if (!email.trim() || !password || !confirmPassword) { setError('Please fill in all fields.'); return; }

    // Validate email
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) { setError('Please enter a valid email address.'); return; }

    // Validate password strength
    const failedRules = PW_RULES.filter(r => !r.test(password));
    if (failedRules.length > 0) {
      setError(`Password needs: ${failedRules.map(r => r.label.toLowerCase()).join(', ')}`);
      return;
    }

    if (password !== confirmPassword) { setError('Passwords do not match.'); return; }

    setLoading(true);
    const { error } = await supabase.auth.signUp({
      email: email.trim(),
      password,
      options: {
        emailRedirectTo: window.location.origin,
      },
    });
    setLoading(false);

    if (error) {
      if (error.message.includes('already registered')) {
        setError('An account with this email already exists. Try logging in.');
      } else {
        setError(error.message);
      }
    } else {
      setSuccess('Account created! Check your email for a verification link.');
      setPassword('');
      setConfirmPassword('');
    }
  };

  const handleForgotPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    clearMessages();
    if (!email.trim()) { setError('Please enter your email address.'); return; }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) { setError('Please enter a valid email address.'); return; }

    setLoading(true);
    const { error } = await supabase.auth.resetPasswordForEmail(email.trim(), {
      redirectTo: `${window.location.origin}/#type=recovery`,
    });
    setLoading(false);

    if (error) {
      setError(error.message);
    } else {
      setSuccess('Password reset email sent! Check your inbox and spam folder.');
    }
  };

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    clearMessages();
    if (!password || !confirmPassword) { setError('Please fill in all fields.'); return; }

    const failedRules = PW_RULES.filter(r => !r.test(password));
    if (failedRules.length > 0) {
      setError(`Password needs: ${failedRules.map(r => r.label.toLowerCase()).join(', ')}`);
      return;
    }

    if (password !== confirmPassword) { setError('Passwords do not match.'); return; }

    setLoading(true);
    const { error } = await supabase.auth.updateUser({ password });
    setLoading(false);

    if (error) {
      setError(error.message);
    } else {
      setSuccess('Password updated successfully! Redirecting to login…');
      setTimeout(() => {
        window.location.hash = '';
        window.location.reload();
      }, 2000);
    }
  };

  const switchMode = (newMode: Mode) => {
    setMode(newMode);
    clearMessages();
    setPassword('');
    setConfirmPassword('');
    setShowPassword(false);
  };

  const strength = passwordStrength(password);
  const showStrength = (mode === 'signup' || mode === 'reset') && password.length > 0;

  return (
    <div
      className="min-h-screen flex items-center justify-center p-4"
      style={{ background: 'var(--bg-page)' }}
    >
      <div className="w-full max-w-[400px]">
        {/* Logo */}
        <div className="flex flex-col items-center mb-8">
          <div
            className="w-12 h-12 rounded-2xl flex items-center justify-center mb-4"
            style={{ background: 'var(--accent)', boxShadow: '0 4px 24px rgba(99,102,241,0.25)' }}
          >
            <svg className="w-6 h-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
              <rect x="3" y="3" width="8" height="8" rx="1" /><rect x="13" y="3" width="8" height="8" rx="1" />
              <rect x="3" y="13" width="8" height="8" rx="1" /><rect x="13" y="13" width="8" height="8" rx="1" />
            </svg>
          </div>
          <h1 className="text-xl font-bold tracking-[-0.02em]" style={{ color: 'var(--text-primary)' }}>
            Priority Matrix
          </h1>
          <p className="text-sm mt-1" style={{ color: 'var(--text-tertiary)' }}>
            {mode === 'login' && 'Sign in to your workspace'}
            {mode === 'signup' && 'Create your account'}
            {mode === 'forgot' && 'Reset your password'}
            {mode === 'reset' && 'Set a new password'}
          </p>
        </div>

        {/* Card */}
        <div
          className="rounded-2xl p-6"
          style={{
            background: 'var(--bg-surface)',
            border: '1px solid var(--border)',
            boxShadow: 'var(--shadow-lg)',
          }}
        >
          {/* Error / Success */}
          {error && (
            <div
              className="mb-4 p-3 rounded-xl text-sm flex items-start gap-2.5"
              style={{ background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.15)', color: '#ef4444' }}
            >
              <svg className="w-4 h-4 mt-0.5 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <circle cx="12" cy="12" r="10" /><path strokeLinecap="round" d="M12 8v4m0 4h.01" />
              </svg>
              <span>{error}</span>
            </div>
          )}
          {success && (
            <div
              className="mb-4 p-3 rounded-xl text-sm flex items-start gap-2.5"
              style={{ background: 'rgba(16,185,129,0.08)', border: '1px solid rgba(16,185,129,0.15)', color: '#10b981' }}
            >
              <svg className="w-4 h-4 mt-0.5 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <span>{success}</span>
            </div>
          )}

          <form onSubmit={
            mode === 'login' ? handleLogin :
            mode === 'signup' ? handleSignup :
            mode === 'forgot' ? handleForgotPassword :
            handleResetPassword
          }>
            {/* Email (not for reset) */}
            {mode !== 'reset' && (
              <div className="mb-4">
                <label className="block text-[11px] font-semibold uppercase tracking-wider mb-1.5" style={{ color: 'var(--text-tertiary)' }}>
                  Email
                </label>
                <input
                  type="email"
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  placeholder="you@example.com"
                  autoComplete="email"
                  className="w-full h-10 px-3 rounded-lg text-sm outline-none transition-all duration-200"
                  style={{
                    background: 'var(--bg-inset)',
                    border: '1px solid var(--border)',
                    color: 'var(--text-primary)',
                  }}
                  onFocus={e => e.currentTarget.style.borderColor = 'var(--accent)'}
                  onBlur={e => e.currentTarget.style.borderColor = 'var(--border)'}
                />
              </div>
            )}

            {/* Password (not for forgot) */}
            {mode !== 'forgot' && (
              <div className="mb-4">
                <label className="block text-[11px] font-semibold uppercase tracking-wider mb-1.5" style={{ color: 'var(--text-tertiary)' }}>
                  {mode === 'reset' ? 'New Password' : 'Password'}
                </label>
                <div className="relative">
                  <input
                    type={showPassword ? 'text' : 'password'}
                    value={password}
                    onChange={e => setPassword(e.target.value)}
                    placeholder="••••••••"
                    autoComplete={mode === 'login' ? 'current-password' : 'new-password'}
                    className="w-full h-10 px-3 pr-10 rounded-lg text-sm outline-none transition-all duration-200"
                    style={{
                      background: 'var(--bg-inset)',
                      border: '1px solid var(--border)',
                      color: 'var(--text-primary)',
                    }}
                    onFocus={e => e.currentTarget.style.borderColor = 'var(--accent)'}
                    onBlur={e => e.currentTarget.style.borderColor = 'var(--border)'}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-2 top-1/2 -translate-y-1/2 p-1 rounded transition-colors"
                    style={{ color: 'var(--text-quaternary)' }}
                    tabIndex={-1}
                  >
                    {showPassword ? (
                      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
                        <path strokeLinecap="round" d="M3.98 8.223A10.477 10.477 0 001.934 12c1.292 4.338 5.31 7.5 10.066 7.5.993 0 1.953-.138 2.863-.395M6.228 6.228A10.45 10.45 0 0112 4.5c4.756 0 8.773 3.162 10.065 7.498a10.523 10.523 0 01-4.293 5.774M6.228 6.228L3 3m3.228 3.228l3.65 3.65m7.894 7.894L21 21m-3.228-3.228l-3.65-3.65m0 0a3 3 0 10-4.243-4.243m4.242 4.242L9.88 9.88" />
                      </svg>
                    ) : (
                      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
                        <path strokeLinecap="round" d="M2.036 12.322a1.012 1.012 0 010-.639C3.423 7.51 7.36 4.5 12 4.5c4.638 0 8.573 3.007 9.963 7.178.07.207.07.431 0 .639C20.577 16.49 16.64 19.5 12 19.5c-4.638 0-8.573-3.007-9.963-7.178z" />
                        <circle cx="12" cy="12" r="3" />
                      </svg>
                    )}
                  </button>
                </div>

                {/* Password strength meter */}
                {showStrength && (
                  <div className="mt-2">
                    <div className="flex gap-1 mb-1">
                      {[1, 2, 3, 4, 5].map(i => (
                        <div
                          key={i}
                          className="h-1 flex-1 rounded-full transition-all duration-300"
                          style={{
                            background: i <= strength.score ? strength.color : 'var(--bg-inset)',
                          }}
                        />
                      ))}
                    </div>
                    <p className="text-[10px] font-medium" style={{ color: strength.color }}>
                      {strength.label}
                    </p>
                  </div>
                )}

                {/* Forgot password link (login only) */}
                {mode === 'login' && (
                  <button
                    type="button"
                    onClick={() => switchMode('forgot')}
                    className="block text-[12px] font-medium mt-2 transition-colors"
                    style={{ color: 'var(--accent)' }}
                    onMouseEnter={e => e.currentTarget.style.opacity = '0.8'}
                    onMouseLeave={e => e.currentTarget.style.opacity = '1'}
                  >
                    Forgot password?
                  </button>
                )}
              </div>
            )}

            {/* Confirm password (signup & reset only) */}
            {(mode === 'signup' || mode === 'reset') && (
              <div className="mb-5">
                <label className="block text-[11px] font-semibold uppercase tracking-wider mb-1.5" style={{ color: 'var(--text-tertiary)' }}>
                  Confirm Password
                </label>
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={confirmPassword}
                  onChange={e => setConfirmPassword(e.target.value)}
                  placeholder="••••••••"
                  autoComplete="new-password"
                  className="w-full h-10 px-3 rounded-lg text-sm outline-none transition-all duration-200"
                  style={{
                    background: 'var(--bg-inset)',
                    border: '1px solid var(--border)',
                    color: 'var(--text-primary)',
                  }}
                  onFocus={e => e.currentTarget.style.borderColor = 'var(--accent)'}
                  onBlur={e => e.currentTarget.style.borderColor = 'var(--border)'}
                />
                {confirmPassword && password !== confirmPassword && (
                  <p className="text-[10px] mt-1 font-medium" style={{ color: '#ef4444' }}>
                    Passwords don't match
                  </p>
                )}
              </div>
            )}

            {/* Submit */}
            <button
              type="submit"
              disabled={loading}
              className="w-full h-10 rounded-lg text-sm font-semibold text-white transition-all duration-200 flex items-center justify-center gap-2"
              style={{
                background: loading ? 'var(--accent-hover)' : 'var(--accent)',
                opacity: loading ? 0.7 : 1,
                cursor: loading ? 'not-allowed' : 'pointer',
              }}
              onMouseEnter={e => { if (!loading) e.currentTarget.style.background = 'var(--accent-hover)'; }}
              onMouseLeave={e => { if (!loading) e.currentTarget.style.background = 'var(--accent)'; }}
            >
              {loading && (
                <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                </svg>
              )}
              {mode === 'login' && 'Sign In'}
              {mode === 'signup' && 'Create Account'}
              {mode === 'forgot' && 'Send Reset Link'}
              {mode === 'reset' && 'Update Password'}
            </button>
          </form>

          {/* Mode switch */}
          <div className="mt-5 pt-4 text-center text-sm" style={{ borderTop: '1px solid var(--border)', color: 'var(--text-tertiary)' }}>
            {mode === 'login' && (
              <>
                Don't have an account?{' '}
                <button onClick={() => switchMode('signup')} className="font-semibold" style={{ color: 'var(--accent)' }}>
                  Sign Up
                </button>
              </>
            )}
            {mode === 'signup' && (
              <>
                Already have an account?{' '}
                <button onClick={() => switchMode('login')} className="font-semibold" style={{ color: 'var(--accent)' }}>
                  Sign In
                </button>
              </>
            )}
            {mode === 'forgot' && (
              <>
                Remember your password?{' '}
                <button onClick={() => switchMode('login')} className="font-semibold" style={{ color: 'var(--accent)' }}>
                  Back to Sign In
                </button>
              </>
            )}
            {mode === 'reset' && (
              <>
                <button onClick={() => switchMode('login')} className="font-semibold" style={{ color: 'var(--accent)' }}>
                  Back to Sign In
                </button>
              </>
            )}
          </div>
        </div>

        {/* Security note */}
        <p className="text-center text-[10px] mt-6" style={{ color: 'var(--text-quaternary)' }}>
          Secured with Supabase Auth · End-to-end encrypted · Row-level security
        </p>
      </div>
    </div>
  );
}
