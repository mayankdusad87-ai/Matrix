import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';

type Mode = 'login' | 'signup' | 'forgot' | 'reset';

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
  if (passed <= 4) return { score: passed, label: 'Strong', color: '#22c55e' };
  return { score: passed, label: 'Very Strong', color: '#10b981' };
}

export default function AuthPage() {
  const [mode, setMode] = useState<Mode>('login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [loading, setLoading] = useState(false);

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
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) { setError('Please enter a valid email address.'); return; }
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
      options: { emailRedirectTo: window.location.origin },
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
    if (error) { setError(error.message); } else {
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
    if (error) { setError(error.message); } else {
      setSuccess('Password updated successfully! Redirecting to login…');
      setTimeout(() => { window.location.hash = ''; window.location.reload(); }, 2000);
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

  const headings: Record<Mode, { title: string; subtitle: string }> = {
    login: { title: 'Welcome back', subtitle: 'Sign in to your workspace' },
    signup: { title: 'Get Started', subtitle: 'Create your account and take control of your tasks.' },
    forgot: { title: 'Forgot Password?', subtitle: "Enter your email and we'll send a reset link." },
    reset: { title: 'New Password', subtitle: 'Choose a strong password for your account.' },
  };

  const features = [
    {
      icon: (
        <svg className="w-7 h-7" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
          <rect x="3" y="3" width="8" height="8" rx="1" /><rect x="13" y="3" width="8" height="8" rx="1" />
          <rect x="3" y="13" width="8" height="8" rx="1" /><rect x="13" y="13" width="8" height="8" rx="1" />
        </svg>
      ),
      label: 'Visual\nPrioritisation',
    },
    {
      icon: (
        <svg className="w-7 h-7" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M13 10V3L4 14h7v7l9-11h-7z" />
        </svg>
      ),
      label: 'Focus on\nwhat matters',
    },
    {
      icon: (
        <svg className="w-7 h-7" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
        </svg>
      ),
      label: 'Track\nprogress',
    },
  ];

  return (
    <div className="min-h-screen relative overflow-hidden">
      {/* ── Background: photo + warm overlays ── */}
      <div className="absolute inset-0" style={{
        backgroundImage: 'url(/bg-login.jpg)',
        backgroundSize: 'cover',
        backgroundPosition: 'center',
      }} />
      {/* Warm red/amber color overlay */}
      <div className="absolute inset-0" style={{
        background: 'linear-gradient(135deg, rgba(80,20,10,0.7) 0%, rgba(120,30,15,0.5) 40%, rgba(160,50,20,0.4) 60%, rgba(100,25,10,0.6) 100%)',
      }} />
      {/* Red curtain effect on the right */}
      <div className="absolute inset-0" style={{
        background: `
          linear-gradient(to right, transparent 55%, rgba(140,20,10,0.45) 75%, rgba(120,15,8,0.6) 100%),
          radial-gradient(ellipse at 20% 80%, rgba(200,120,60,0.15) 0%, transparent 50%),
          radial-gradient(ellipse at 80% 20%, rgba(180,40,20,0.1) 0%, transparent 40%)
        `,
      }} />
      {/* Subtle vignette */}
      <div className="absolute inset-0" style={{
        background: 'radial-gradient(ellipse at center, transparent 30%, rgba(10,2,2,0.35) 100%)',
      }} />

      {/* ── Content ── */}
      <div className="relative z-10 min-h-screen flex">

        {/* ── Left: branding overlaid on background ── */}
        <div className="hidden lg:flex lg:w-[52%] flex-col justify-between p-10 xl:p-14">
          {/* Logo */}
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ background: 'rgba(220,40,40,0.2)', backdropFilter: 'blur(8px)' }}>
              <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="#ef4444" strokeWidth={2}>
                <rect x="3" y="3" width="8" height="8" rx="1" /><rect x="13" y="3" width="8" height="8" rx="1" />
                <rect x="3" y="13" width="8" height="8" rx="1" /><rect x="13" y="13" width="8" height="8" rx="1" />
              </svg>
            </div>
            <span className="text-xl font-bold tracking-[-0.02em] text-white">Priorix</span>
          </div>

          {/* Hero */}
          <div className="max-w-lg">
            <p className="text-[11px] font-semibold uppercase tracking-[0.25em] mb-5" style={{ color: 'rgba(255,200,160,0.7)' }}>
              Good to see you again
            </p>
            <h1 className="text-[44px] xl:text-[56px] font-bold leading-[1.05] mb-4 text-white">
              Turn effort<br />
              into <span style={{ color: '#ef4444' }}>impact.</span>
            </h1>
            <p className="text-[16px] font-medium" style={{ color: 'rgba(255,255,255,0.5)' }}>
              Prioritise. Execute. Deliver.
            </p>
          </div>

          {/* Feature cards — light frosted glass */}
          <div className="flex items-stretch gap-5">
            {features.map((f, i) => (
              <div key={i} className="flex flex-col items-center gap-3 px-7 py-5 rounded-2xl" style={{
                background: 'rgba(255,255,255,0.12)',
                backdropFilter: 'blur(16px)',
                border: '1px solid rgba(255,255,255,0.15)',
              }}>
                <div className="w-12 h-12 rounded-xl flex items-center justify-center" style={{ background: 'rgba(255,255,255,0.15)', color: '#ef4444' }}>
                  {f.icon}
                </div>
                <span className="text-[12px] font-medium text-center whitespace-pre-line leading-snug" style={{ color: 'rgba(255,255,255,0.7)' }}>
                  {f.label}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* ── Right: floating form card ── */}
        <div className="flex-1 flex items-center justify-center p-6 md:p-10">
          <div className="w-full max-w-[420px] rounded-2xl p-8 md:p-10" style={{
            background: '#ffffff',
            boxShadow: '0 25px 60px rgba(0,0,0,0.3), 0 0 1px rgba(0,0,0,0.1)',
          }}>
            {/* Mobile logo */}
            <div className="flex items-center gap-2 mb-8 lg:hidden">
              <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ background: 'rgba(220,38,38,0.1)' }}>
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="#DC2626" strokeWidth={2}>
                  <rect x="3" y="3" width="8" height="8" rx="1" /><rect x="13" y="3" width="8" height="8" rx="1" />
                  <rect x="3" y="13" width="8" height="8" rx="1" /><rect x="13" y="13" width="8" height="8" rx="1" />
                </svg>
              </div>
              <span className="text-[15px] font-bold tracking-[-0.02em]" style={{ color: '#111827' }}>Priorix</span>
            </div>

            {/* Heading */}
            <div className="mb-7">
              <h2 className="text-[26px] font-bold mb-1" style={{ color: '#111827' }}>
                {headings[mode].title}
              </h2>
              <p className="text-[14px]" style={{ color: '#6b7280' }}>
                {headings[mode].subtitle}
              </p>
            </div>

            {/* Error / Success */}
            {error && (
              <div className="mb-5 p-3.5 rounded-xl text-[13px] flex items-start gap-2.5"
                style={{ background: 'rgba(239,68,68,0.06)', border: '1px solid rgba(239,68,68,0.15)', color: '#dc2626' }}>
                <svg className="w-4 h-4 mt-0.5 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <circle cx="12" cy="12" r="10" /><path strokeLinecap="round" d="M12 8v4m0 4h.01" />
                </svg>
                <span>{error}</span>
              </div>
            )}
            {success && (
              <div className="mb-5 p-3.5 rounded-xl text-[13px] flex items-start gap-2.5"
                style={{ background: 'rgba(16,185,129,0.06)', border: '1px solid rgba(16,185,129,0.15)', color: '#059669' }}>
                <svg className="w-4 h-4 mt-0.5 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <span>{success}</span>
              </div>
            )}

            {/* Form */}
            <form onSubmit={
              mode === 'login' ? handleLogin :
              mode === 'signup' ? handleSignup :
              mode === 'forgot' ? handleForgotPassword :
              handleResetPassword
            }>
              {/* Email */}
              {mode !== 'reset' && (
                <div className="mb-4">
                  <label className="block text-[13px] font-semibold mb-1.5" style={{ color: '#374151' }}>
                    Email
                  </label>
                  <div className="relative">
                    <div className="absolute left-3.5 top-1/2 -translate-y-1/2" style={{ color: '#9ca3af' }}>
                      <svg className="w-[16px] h-[16px]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                      </svg>
                    </div>
                    <input
                      type="email" value={email} onChange={e => setEmail(e.target.value)}
                      placeholder="you@company.com" autoComplete="email"
                      className="w-full h-[46px] pl-10 pr-3.5 rounded-xl text-[14px] outline-none transition-all duration-200"
                      style={{ background: '#f9fafb', border: '1px solid #e5e7eb', color: '#111827' }}
                      onFocus={e => { e.currentTarget.style.borderColor = '#DC2626'; e.currentTarget.style.boxShadow = '0 0 0 3px rgba(220,38,38,0.08)'; e.currentTarget.style.background = '#ffffff'; }}
                      onBlur={e => { e.currentTarget.style.borderColor = '#e5e7eb'; e.currentTarget.style.boxShadow = 'none'; e.currentTarget.style.background = '#f9fafb'; }}
                    />
                  </div>
                </div>
              )}

              {/* Password */}
              {mode !== 'forgot' && (
                <div className="mb-3">
                  <label className="block text-[13px] font-semibold mb-1.5" style={{ color: '#374151' }}>
                    Password
                  </label>
                  <div className="relative">
                    <div className="absolute left-3.5 top-1/2 -translate-y-1/2" style={{ color: '#9ca3af' }}>
                      <svg className="w-[16px] h-[16px]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
                        <rect x="3" y="11" width="18" height="11" rx="2" /><path d="M7 11V7a5 5 0 0110 0v4" />
                      </svg>
                    </div>
                    <input
                      type={showPassword ? 'text' : 'password'} value={password}
                      onChange={e => setPassword(e.target.value)} placeholder="Enter your password"
                      autoComplete={mode === 'login' ? 'current-password' : 'new-password'}
                      className="w-full h-[46px] pl-10 pr-11 rounded-xl text-[14px] outline-none transition-all duration-200"
                      style={{ background: '#f9fafb', border: '1px solid #e5e7eb', color: '#111827' }}
                      onFocus={e => { e.currentTarget.style.borderColor = '#DC2626'; e.currentTarget.style.boxShadow = '0 0 0 3px rgba(220,38,38,0.08)'; e.currentTarget.style.background = '#ffffff'; }}
                      onBlur={e => { e.currentTarget.style.borderColor = '#e5e7eb'; e.currentTarget.style.boxShadow = 'none'; e.currentTarget.style.background = '#f9fafb'; }}
                    />
                    <button type="button" onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 p-1 rounded transition-colors"
                      style={{ color: '#9ca3af' }} tabIndex={-1}>
                      {showPassword ? (
                        <svg className="w-[18px] h-[18px]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
                          <path strokeLinecap="round" d="M3.98 8.223A10.477 10.477 0 001.934 12c1.292 4.338 5.31 7.5 10.066 7.5.993 0 1.953-.138 2.863-.395M6.228 6.228A10.45 10.45 0 0112 4.5c4.756 0 8.773 3.162 10.065 7.498a10.523 10.523 0 01-4.293 5.774M6.228 6.228L3 3m3.228 3.228l3.65 3.65m7.894 7.894L21 21m-3.228-3.228l-3.65-3.65m0 0a3 3 0 10-4.243-4.243m4.242 4.242L9.88 9.88" />
                        </svg>
                      ) : (
                        <svg className="w-[18px] h-[18px]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
                          <path strokeLinecap="round" d="M2.036 12.322a1.012 1.012 0 010-.639C3.423 7.51 7.36 4.5 12 4.5c4.638 0 8.573 3.007 9.963 7.178.07.207.07.431 0 .639C20.577 16.49 16.64 19.5 12 19.5c-4.638 0-8.573-3.007-9.963-7.178z" />
                          <circle cx="12" cy="12" r="3" />
                        </svg>
                      )}
                    </button>
                  </div>

                  {/* Password strength */}
                  {showStrength && (
                    <div className="mt-2.5">
                      <div className="flex gap-1 mb-1.5">
                        {[1, 2, 3, 4, 5].map(i => (
                          <div key={i} className="h-[3px] flex-1 rounded-full transition-all duration-300"
                            style={{ background: i <= strength.score ? strength.color : '#e5e7eb' }} />
                        ))}
                      </div>
                      <p className="text-[11px] font-medium" style={{ color: strength.color }}>{strength.label}</p>
                    </div>
                  )}

                  {/* Remember me + Forgot */}
                  {mode === 'login' && (
                    <div className="flex items-center justify-between mt-4">
                      <label className="flex items-center gap-2 cursor-pointer select-none">
                        <div className="w-[18px] h-[18px] rounded flex items-center justify-center transition-all duration-200"
                          style={{
                            background: rememberMe ? '#DC2626' : 'transparent',
                            border: rememberMe ? '1px solid #DC2626' : '1px solid #d1d5db',
                          }}
                          onClick={() => setRememberMe(!rememberMe)}>
                          {rememberMe && (
                            <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="#ffffff" strokeWidth={3}>
                              <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                            </svg>
                          )}
                        </div>
                        <span className="text-[13px]" style={{ color: '#6b7280' }} onClick={() => setRememberMe(!rememberMe)}>
                          Keep me signed in
                        </span>
                      </label>
                      <button type="button" onClick={() => switchMode('forgot')}
                        className="text-[13px] font-medium transition-colors underline underline-offset-2" style={{ color: '#DC2626' }}>
                        Forgot password?
                      </button>
                    </div>
                  )}
                </div>
              )}

              {/* Confirm password */}
              {(mode === 'signup' || mode === 'reset') && (
                <div className="mb-5">
                  <label className="block text-[13px] font-semibold mb-1.5" style={{ color: '#374151' }}>
                    Confirm Password
                  </label>
                  <div className="relative">
                    <div className="absolute left-3.5 top-1/2 -translate-y-1/2" style={{ color: '#9ca3af' }}>
                      <svg className="w-[16px] h-[16px]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
                        <rect x="3" y="11" width="18" height="11" rx="2" /><path d="M7 11V7a5 5 0 0110 0v4" />
                      </svg>
                    </div>
                    <input type={showPassword ? 'text' : 'password'} value={confirmPassword}
                      onChange={e => setConfirmPassword(e.target.value)} placeholder="Confirm your password"
                      autoComplete="new-password"
                      className="w-full h-[46px] pl-10 pr-3.5 rounded-xl text-[14px] outline-none transition-all duration-200"
                      style={{ background: '#f9fafb', border: '1px solid #e5e7eb', color: '#111827' }}
                      onFocus={e => { e.currentTarget.style.borderColor = '#DC2626'; e.currentTarget.style.boxShadow = '0 0 0 3px rgba(220,38,38,0.08)'; e.currentTarget.style.background = '#ffffff'; }}
                      onBlur={e => { e.currentTarget.style.borderColor = '#e5e7eb'; e.currentTarget.style.boxShadow = 'none'; e.currentTarget.style.background = '#f9fafb'; }}
                    />
                  </div>
                  {confirmPassword && password !== confirmPassword && (
                    <p className="text-[11px] mt-1.5 font-medium" style={{ color: '#dc2626' }}>Passwords don't match</p>
                  )}
                </div>
              )}

              {/* Submit */}
              <button type="submit" disabled={loading}
                className="w-full h-[48px] rounded-xl text-[15px] font-semibold transition-all duration-200 flex items-center justify-center gap-2 mt-6"
                style={{
                  background: loading ? 'rgba(160,30,30,0.7)' : 'linear-gradient(135deg, #DC2626 0%, #991b1b 100%)',
                  color: '#ffffff',
                  cursor: loading ? 'not-allowed' : 'pointer',
                  boxShadow: loading ? 'none' : '0 4px 14px rgba(220,38,38,0.25)',
                }}
                onMouseEnter={e => { if (!loading) { e.currentTarget.style.background = 'linear-gradient(135deg, #b91c1c 0%, #7f1d1d 100%)'; e.currentTarget.style.boxShadow = '0 6px 20px rgba(220,38,38,0.35)'; } }}
                onMouseLeave={e => { if (!loading) { e.currentTarget.style.background = 'linear-gradient(135deg, #DC2626 0%, #991b1b 100%)'; e.currentTarget.style.boxShadow = '0 4px 14px rgba(220,38,38,0.25)'; } }}
              >
                {loading ? (
                  <svg className="w-5 h-5 animate-spin" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                  </svg>
                ) : (
                  <>
                    {mode === 'login' && 'Sign In  →'}
                    {mode === 'signup' && 'Create Account'}
                    {mode === 'forgot' && 'Send Reset Link'}
                    {mode === 'reset' && 'Update Password'}
                  </>
                )}
              </button>
            </form>

            {/* Mode switch */}
            <div className="mt-7 text-center">
              {mode === 'login' && (
                <div className="flex flex-col items-center gap-3">
                  <div className="w-full flex items-center gap-3">
                    <div className="flex-1 h-px" style={{ background: '#e5e7eb' }} />
                    <span className="text-[13px]" style={{ color: '#9ca3af' }}>New to Priorix?</span>
                    <div className="flex-1 h-px" style={{ background: '#e5e7eb' }} />
                  </div>
                  <button onClick={() => switchMode('signup')}
                    className="w-full h-[44px] rounded-xl text-[14px] font-semibold transition-all duration-200"
                    style={{ border: '1.5px solid #DC2626', color: '#DC2626', background: 'transparent' }}
                    onMouseEnter={e => { e.currentTarget.style.background = 'rgba(220,38,38,0.04)'; }}
                    onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; }}
                  >
                    Create an account
                  </button>
                </div>
              )}
              {mode === 'signup' && (
                <span className="text-[14px]" style={{ color: '#6b7280' }}>
                  Already have an account?{' '}
                  <button onClick={() => switchMode('login')} className="font-semibold transition-colors" style={{ color: '#DC2626' }}>
                    Sign in
                  </button>
                </span>
              )}
              {mode === 'forgot' && (
                <span className="text-[14px]" style={{ color: '#6b7280' }}>
                  Remember your password?{' '}
                  <button onClick={() => switchMode('login')} className="font-semibold transition-colors" style={{ color: '#DC2626' }}>
                    Back to Sign in
                  </button>
                </span>
              )}
              {mode === 'reset' && (
                <button onClick={() => switchMode('login')} className="text-[14px] font-semibold transition-colors" style={{ color: '#DC2626' }}>
                  Back to Sign in
                </button>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
