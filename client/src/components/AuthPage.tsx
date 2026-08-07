import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import GlobeCanvas from './GlobeCanvas';

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
  if (passed <= 4) return { score: passed, label: 'Strong', color: '#22c55e' };
  return { score: passed, label: 'Very Strong', color: '#a3e635' };
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

  const headings: Record<Mode, { title: string; subtitle: string }> = {
    login: { title: 'Welcome Back!', subtitle: 'Sign in to manage your priorities with clarity.' },
    signup: { title: 'Get Started', subtitle: 'Create your account and take control of your tasks.' },
    forgot: { title: 'Forgot Password?', subtitle: 'Enter your email and we\'ll send a reset link.' },
    reset: { title: 'New Password', subtitle: 'Choose a strong password for your account.' },
  };

  return (
    <div
      className="min-h-screen flex flex-col items-center justify-center p-4 relative overflow-hidden"
      style={{ background: '#0a0a0a' }}
    >
      {/* Subtle radial glow behind globe */}
      <div
        className="absolute pointer-events-none"
        style={{
          top: '10%',
          left: '50%',
          transform: 'translateX(-50%)',
          width: 400,
          height: 400,
          borderRadius: '50%',
          background: 'radial-gradient(circle, rgba(163,230,53,0.06) 0%, transparent 70%)',
        }}
      />

      {/* Top-right decorative dots */}
      <div className="absolute top-6 right-6 flex items-center gap-2 opacity-40">
        <div className="w-2 h-2 rounded-full" style={{ background: '#a3e635' }} />
        <div className="w-2 h-2 rounded-full" style={{ background: '#a3e635', opacity: 0.5 }} />
      </div>

      <div className="w-full max-w-[380px] relative z-10">
        {/* Globe */}
        <div className="flex justify-center mb-6">
          <GlobeCanvas size={110} />
        </div>

        {/* Heading */}
        <div className="text-center mb-8">
          <h1
            className="text-[28px] font-bold tracking-[-0.03em] mb-2"
            style={{ color: '#ffffff' }}
          >
            {headings[mode].title}
          </h1>
          <p
            className="text-[14px] leading-relaxed"
            style={{ color: 'rgba(255,255,255,0.45)' }}
          >
            {headings[mode].subtitle}
          </p>
        </div>

        {/* Error / Success */}
        {error && (
          <div
            className="mb-5 p-3.5 rounded-xl text-[13px] flex items-start gap-2.5"
            style={{
              background: 'rgba(239,68,68,0.1)',
              border: '1px solid rgba(239,68,68,0.2)',
              color: '#f87171',
            }}
          >
            <svg className="w-4 h-4 mt-0.5 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <circle cx="12" cy="12" r="10" /><path strokeLinecap="round" d="M12 8v4m0 4h.01" />
            </svg>
            <span>{error}</span>
          </div>
        )}
        {success && (
          <div
            className="mb-5 p-3.5 rounded-xl text-[13px] flex items-start gap-2.5"
            style={{
              background: 'rgba(163,230,53,0.08)',
              border: '1px solid rgba(163,230,53,0.2)',
              color: '#a3e635',
            }}
          >
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
          {/* Email (not for reset) */}
          {mode !== 'reset' && (
            <div className="mb-5">
              <label
                className="block text-[13px] font-medium mb-2"
                style={{ color: 'rgba(255,255,255,0.7)' }}
              >
                Email address<span style={{ color: '#a3e635' }}>*</span>
              </label>
              <input
                type="email"
                value={email}
                onChange={e => setEmail(e.target.value)}
                placeholder="example@gmail.com"
                autoComplete="email"
                className="w-full h-[48px] px-4 rounded-xl text-[14px] outline-none transition-all duration-200"
                style={{
                  background: 'rgba(255,255,255,0.05)',
                  border: '1px solid rgba(255,255,255,0.1)',
                  color: '#ffffff',
                }}
                onFocus={e => {
                  e.currentTarget.style.borderColor = 'rgba(163,230,53,0.5)';
                  e.currentTarget.style.boxShadow = '0 0 0 3px rgba(163,230,53,0.08)';
                }}
                onBlur={e => {
                  e.currentTarget.style.borderColor = 'rgba(255,255,255,0.1)';
                  e.currentTarget.style.boxShadow = 'none';
                }}
              />
            </div>
          )}

          {/* Password (not for forgot) */}
          {mode !== 'forgot' && (
            <div className="mb-4">
              <label
                className="block text-[13px] font-medium mb-2"
                style={{ color: 'rgba(255,255,255,0.7)' }}
              >
                {mode === 'reset' ? 'New Password' : 'Password'}<span style={{ color: '#a3e635' }}>*</span>
              </label>
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  placeholder="@Sn123hsn#"
                  autoComplete={mode === 'login' ? 'current-password' : 'new-password'}
                  className="w-full h-[48px] px-4 pr-11 rounded-xl text-[14px] outline-none transition-all duration-200"
                  style={{
                    background: 'rgba(255,255,255,0.05)',
                    border: '1px solid rgba(255,255,255,0.1)',
                    color: '#ffffff',
                  }}
                  onFocus={e => {
                    e.currentTarget.style.borderColor = 'rgba(163,230,53,0.5)';
                    e.currentTarget.style.boxShadow = '0 0 0 3px rgba(163,230,53,0.08)';
                  }}
                  onBlur={e => {
                    e.currentTarget.style.borderColor = 'rgba(255,255,255,0.1)';
                    e.currentTarget.style.boxShadow = 'none';
                  }}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 p-1 rounded-lg transition-colors"
                  style={{ color: 'rgba(255,255,255,0.35)' }}
                  onMouseEnter={e => e.currentTarget.style.color = 'rgba(255,255,255,0.7)'}
                  onMouseLeave={e => e.currentTarget.style.color = 'rgba(255,255,255,0.35)'}
                  tabIndex={-1}
                >
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

              {/* Password strength meter */}
              {showStrength && (
                <div className="mt-2.5">
                  <div className="flex gap-1 mb-1.5">
                    {[1, 2, 3, 4, 5].map(i => (
                      <div
                        key={i}
                        className="h-[3px] flex-1 rounded-full transition-all duration-300"
                        style={{
                          background: i <= strength.score ? strength.color : 'rgba(255,255,255,0.08)',
                        }}
                      />
                    ))}
                  </div>
                  <p className="text-[11px] font-medium" style={{ color: strength.color }}>
                    {strength.label}
                  </p>
                </div>
              )}

              {/* Remember me + Forgot password (login only) */}
              {mode === 'login' && (
                <div className="flex items-center justify-between mt-3">
                  <label className="flex items-center gap-2 cursor-pointer select-none">
                    <div
                      className="w-[18px] h-[18px] rounded flex items-center justify-center transition-all duration-200"
                      style={{
                        background: rememberMe ? '#a3e635' : 'transparent',
                        border: rememberMe ? '1px solid #a3e635' : '1px solid rgba(255,255,255,0.2)',
                      }}
                      onClick={() => setRememberMe(!rememberMe)}
                    >
                      {rememberMe && (
                        <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="#0a0a0a" strokeWidth={3}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                        </svg>
                      )}
                    </div>
                    <span
                      className="text-[13px]"
                      style={{ color: 'rgba(255,255,255,0.5)' }}
                      onClick={() => setRememberMe(!rememberMe)}
                    >
                      Remember me
                    </span>
                  </label>
                  <button
                    type="button"
                    onClick={() => switchMode('forgot')}
                    className="text-[13px] font-medium transition-colors"
                    style={{ color: '#a3e635' }}
                    onMouseEnter={e => e.currentTarget.style.opacity = '0.75'}
                    onMouseLeave={e => e.currentTarget.style.opacity = '1'}
                  >
                    Forgot Password?
                  </button>
                </div>
              )}
            </div>
          )}

          {/* Confirm password (signup & reset only) */}
          {(mode === 'signup' || mode === 'reset') && (
            <div className="mb-5">
              <label
                className="block text-[13px] font-medium mb-2"
                style={{ color: 'rgba(255,255,255,0.7)' }}
              >
                Confirm Password<span style={{ color: '#a3e635' }}>*</span>
              </label>
              <input
                type={showPassword ? 'text' : 'password'}
                value={confirmPassword}
                onChange={e => setConfirmPassword(e.target.value)}
                placeholder="••••••••"
                autoComplete="new-password"
                className="w-full h-[48px] px-4 rounded-xl text-[14px] outline-none transition-all duration-200"
                style={{
                  background: 'rgba(255,255,255,0.05)',
                  border: '1px solid rgba(255,255,255,0.1)',
                  color: '#ffffff',
                }}
                onFocus={e => {
                  e.currentTarget.style.borderColor = 'rgba(163,230,53,0.5)';
                  e.currentTarget.style.boxShadow = '0 0 0 3px rgba(163,230,53,0.08)';
                }}
                onBlur={e => {
                  e.currentTarget.style.borderColor = 'rgba(255,255,255,0.1)';
                  e.currentTarget.style.boxShadow = 'none';
                }}
              />
              {confirmPassword && password !== confirmPassword && (
                <p className="text-[11px] mt-1.5 font-medium" style={{ color: '#f87171' }}>
                  Passwords don't match
                </p>
              )}
            </div>
          )}

          {/* Submit button */}
          <button
            type="submit"
            disabled={loading}
            className="w-full h-[50px] rounded-xl text-[15px] font-semibold transition-all duration-200 flex items-center justify-center gap-2.5 mt-6"
            style={{
              background: loading ? 'rgba(163,230,53,0.7)' : '#a3e635',
              color: '#0a0a0a',
              cursor: loading ? 'not-allowed' : 'pointer',
              boxShadow: loading ? 'none' : '0 0 20px rgba(163,230,53,0.2)',
            }}
            onMouseEnter={e => { if (!loading) { e.currentTarget.style.background = '#bef264'; e.currentTarget.style.boxShadow = '0 0 30px rgba(163,230,53,0.3)'; } }}
            onMouseLeave={e => { if (!loading) { e.currentTarget.style.background = '#a3e635'; e.currentTarget.style.boxShadow = '0 0 20px rgba(163,230,53,0.2)'; } }}
          >
            {loading ? (
              <svg className="w-5 h-5 animate-spin" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
              </svg>
            ) : (
              <>
                {/* Sparkle icon */}
                <svg className="w-[18px] h-[18px]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M9.813 15.904L9 18.75l-.813-2.846a4.5 4.5 0 00-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 003.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 003.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 00-3.09 3.09zM18.259 8.715L18 9.75l-.259-1.035a3.375 3.375 0 00-2.455-2.456L14.25 6l1.036-.259a3.375 3.375 0 002.455-2.456L18 2.25l.259 1.035a3.375 3.375 0 002.455 2.456L21.75 6l-1.036.259a3.375 3.375 0 00-2.455 2.456z" />
                </svg>
                {mode === 'login' && 'Sign in'}
                {mode === 'signup' && 'Create Account'}
                {mode === 'forgot' && 'Send Reset Link'}
                {mode === 'reset' && 'Update Password'}
              </>
            )}
          </button>
        </form>

        {/* Divider + Social (login only) */}
        {mode === 'login' && (
          <>
            <div className="flex items-center gap-3 my-7">
              <div className="flex-1 h-px" style={{ background: 'rgba(255,255,255,0.08)' }} />
              <span className="text-[12px] font-medium" style={{ color: 'rgba(255,255,255,0.3)' }}>
                Or continue with
              </span>
              <div className="flex-1 h-px" style={{ background: 'rgba(255,255,255,0.08)' }} />
            </div>

            <div className="flex gap-3">
              <button
                type="button"
                className="flex-1 h-[46px] rounded-xl text-[13px] font-medium flex items-center justify-center gap-2 transition-all duration-200"
                style={{
                  background: 'rgba(255,255,255,0.05)',
                  border: '1px solid rgba(255,255,255,0.1)',
                  color: 'rgba(255,255,255,0.7)',
                }}
                onMouseEnter={e => { e.currentTarget.style.background = 'rgba(255,255,255,0.08)'; e.currentTarget.style.borderColor = 'rgba(255,255,255,0.2)'; }}
                onMouseLeave={e => { e.currentTarget.style.background = 'rgba(255,255,255,0.05)'; e.currentTarget.style.borderColor = 'rgba(255,255,255,0.1)'; }}
                onClick={() => setError('Social login coming soon!')}
              >
                {/* Google icon */}
                <svg className="w-4 h-4" viewBox="0 0 24 24">
                  <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 01-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z" fill="#4285F4"/>
                  <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
                  <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
                  <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
                </svg>
                Google
              </button>
              <button
                type="button"
                className="flex-1 h-[46px] rounded-xl text-[13px] font-medium flex items-center justify-center gap-2 transition-all duration-200"
                style={{
                  background: 'rgba(255,255,255,0.05)',
                  border: '1px solid rgba(255,255,255,0.1)',
                  color: 'rgba(255,255,255,0.7)',
                }}
                onMouseEnter={e => { e.currentTarget.style.background = 'rgba(255,255,255,0.08)'; e.currentTarget.style.borderColor = 'rgba(255,255,255,0.2)'; }}
                onMouseLeave={e => { e.currentTarget.style.background = 'rgba(255,255,255,0.05)'; e.currentTarget.style.borderColor = 'rgba(255,255,255,0.1)'; }}
                onClick={() => setError('Social login coming soon!')}
              >
                {/* Apple icon */}
                <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M17.05 20.28c-.98.95-2.05.88-3.08.4-1.09-.5-2.08-.48-3.24 0-1.44.62-2.2.44-3.06-.4C2.79 15.25 3.51 7.59 9.05 7.31c1.35.07 2.29.74 3.08.8 1.18-.24 2.31-.93 3.57-.84 1.51.12 2.65.72 3.4 1.8-3.12 1.87-2.38 5.98.48 7.13-.57 1.5-1.31 2.99-2.54 4.09zM12.03 7.25c-.15-2.23 1.66-4.07 3.74-4.25.32 2.32-1.55 4.41-3.74 4.25z"/>
                </svg>
                Apple
              </button>
            </div>
          </>
        )}

        {/* Mode switch */}
        <div className="mt-8 text-center text-[14px]" style={{ color: 'rgba(255,255,255,0.4)' }}>
          {mode === 'login' && (
            <>
              Don't have an account?{' '}
              <button
                onClick={() => switchMode('signup')}
                className="font-semibold transition-colors"
                style={{ color: '#a3e635' }}
                onMouseEnter={e => e.currentTarget.style.opacity = '0.75'}
                onMouseLeave={e => e.currentTarget.style.opacity = '1'}
              >
                Sign up
              </button>
            </>
          )}
          {mode === 'signup' && (
            <>
              Already have an account?{' '}
              <button
                onClick={() => switchMode('login')}
                className="font-semibold transition-colors"
                style={{ color: '#a3e635' }}
                onMouseEnter={e => e.currentTarget.style.opacity = '0.75'}
                onMouseLeave={e => e.currentTarget.style.opacity = '1'}
              >
                Sign in
              </button>
            </>
          )}
          {mode === 'forgot' && (
            <>
              Remember your password?{' '}
              <button
                onClick={() => switchMode('login')}
                className="font-semibold transition-colors"
                style={{ color: '#a3e635' }}
                onMouseEnter={e => e.currentTarget.style.opacity = '0.75'}
                onMouseLeave={e => e.currentTarget.style.opacity = '1'}
              >
                Back to Sign in
              </button>
            </>
          )}
          {mode === 'reset' && (
            <button
              onClick={() => switchMode('login')}
              className="font-semibold transition-colors"
              style={{ color: '#a3e635' }}
              onMouseEnter={e => e.currentTarget.style.opacity = '0.75'}
              onMouseLeave={e => e.currentTarget.style.opacity = '1'}
            >
              Back to Sign in
            </button>
          )}
        </div>

        {/* Branding */}
        <div className="mt-6 flex flex-col items-center gap-1.5">
          <div className="flex items-center gap-2">
            <div
              className="w-5 h-5 rounded flex items-center justify-center"
              style={{ background: 'rgba(163,230,53,0.15)' }}
            >
              <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="#a3e635" strokeWidth={2.5}>
                <rect x="3" y="3" width="8" height="8" rx="1" /><rect x="13" y="3" width="8" height="8" rx="1" />
                <rect x="3" y="13" width="8" height="8" rx="1" /><rect x="13" y="13" width="8" height="8" rx="1" />
              </svg>
            </div>
            <span className="text-[13px] font-semibold tracking-[-0.02em]" style={{ color: 'rgba(255,255,255,0.5)' }}>
              Priorix
            </span>
          </div>
          <p className="text-[10px]" style={{ color: 'rgba(255,255,255,0.2)' }}>
            Secured with Supabase Auth · End-to-end encrypted
          </p>
        </div>
      </div>
    </div>
  );
}
