// AuthScreen — login/signup form for BlueCrewAI accounts
import { useState } from 'react';
import { supabase, isSupabaseConfigured } from '../lib/supabase.js';

export default function AuthScreen({ onAuth }) {
  const [mode, setMode] = useState('login'); // 'login' | 'signup' | 'forgot' | 'trial'
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [trialCode, setTrialCode] = useState('');
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState(null);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);
    setMessage(null);
    setLoading(true);

    try {
      if (mode === 'trial') {
        const validCodes = ['BluecrewAIBETA001', 'BluecrewAIBETA002', 'BluecrewAIBETA003'];
        if (validCodes.includes(trialCode.trim())) {
          if (onAuth) onAuth(trialCode.trim());
        } else {
          throw new Error('Invalid Beta Trial Code');
        }
      } else if (mode === 'signup') {
        const { data, error: signUpError } = await supabase.auth.signUp({
          email: email.trim().toLowerCase(),
          password,
        });
        if (signUpError) throw signUpError;
        // If email confirmation is enabled, show message
        if (data.user && !data.session) {
          setMessage('Check your email to confirm your account, then sign in.');
          setMode('login');
        }
        // If session exists immediately (no email confirmation), onAuth will fire via listener
      } else if (mode === 'forgot') {
        const { error: resetError } = await supabase.auth.resetPasswordForEmail(
          email.trim().toLowerCase(),
          { redirectTo: window.location.origin }
        );
        if (resetError) throw resetError;
        setMessage('Password reset link sent — check your email.');
        setMode('login');
      } else {
        const { error: signInError } = await supabase.auth.signInWithPassword({
          email: email.trim().toLowerCase(),
          password,
        });
        if (signInError) throw signInError;
        // onAuth will fire via the auth state listener in App.jsx
      }
    } catch (err) {
      setError(err.message || 'Something went wrong');
    } finally {
      setLoading(false);
    }
  };

  // For login: enable as soon as both fields have content — let the server validate.
  // For signup: keep the 6-char floor as a UX hint.
  const isValid =
    mode === 'trial'
      ? trialCode.trim().length > 0
      : mode === 'forgot'
      ? email.includes('@')
      : mode === 'signup'
      ? email.includes('@') && password.length >= 6
      : email.includes('@') && password.length > 0;

  return (
    <div className="auth-screen">
      <div className="auth-card">
        <div className="auth-brand">
          <img src="/logo.png" alt="BlueCrewAI" className="auth-logo" />
          <h1 className="auth-title">
            {mode === 'trial' ? 'Beta Access' : mode === 'signup' ? 'Create Account' : mode === 'forgot' ? 'Reset Password' : 'Welcome Back'}
          </h1>
          <p className="auth-subtitle">
            {mode === 'trial'
              ? 'Enter your beta trial code'
              : mode === 'signup'
              ? 'Start generating professional quotes in seconds'
              : mode === 'forgot'
              ? 'Enter your email and we\'ll send a reset link'
              : 'Sign in to your BlueCrewAI account'}
          </p>
        </div>

        {error && <div className="auth-error">{error}</div>}
        {message && <div className="auth-message">{message}</div>}

        <form onSubmit={handleSubmit}>
          {mode === 'trial' ? (
            <div className="field">
              <label htmlFor="auth-trial">Trial Code</label>
              <input
                id="auth-trial"
                type="text"
                placeholder="Enter Beta Code"
                value={trialCode}
                onChange={(e) => setTrialCode(e.target.value)}
                autoComplete="off"
              />
            </div>
          ) : (
            <>
              <div className="field">
                <label htmlFor="auth-email">Email</label>
                <input
                  id="auth-email"
                  type="email"
                  placeholder="you@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  autoComplete="email"
                  autoCapitalize="none"
                />
              </div>

              {mode !== 'forgot' && (
                <div className="field">
                  <label htmlFor="auth-password">Password</label>
                  <input
                    id="auth-password"
                    type="password"
                    placeholder={mode === 'signup' ? 'Min 6 characters' : '••••••••'}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    autoComplete={mode === 'signup' ? 'new-password' : 'current-password'}
                  />
                </div>
              )}
            </>
          )}

          {mode === 'login' && (
            <button
              type="button"
              className="auth-forgot-link"
              onClick={() => { setMode('forgot'); setError(null); setMessage(null); }}
            >
              Forgot password?
            </button>
          )}

          <button
            type="submit"
            className={`btn ${isValid && !loading ? 'btn-primary' : 'btn-disabled'}`}
            disabled={!isValid || loading}
            style={{ marginTop: '8px' }}
          >
            {loading
              ? 'Please wait…'
              : mode === 'trial'
              ? 'Enter App'
              : mode === 'signup'
              ? 'Create Account'
              : mode === 'forgot'
              ? 'Send Reset Link'
              : 'Sign In'}
          </button>
        </form>

        <div className="auth-toggle">
          {mode === 'forgot' ? (
            <span>
              Remember your password?{' '}
              <button onClick={() => { setMode('login'); setError(null); setMessage(null); }}>
                Sign in
              </button>
            </span>
          ) : mode === 'login' ? (
            <span style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              <span>
                Don't have an account?{' '}
                <button onClick={() => { setMode('signup'); setError(null); setMessage(null); }}>
                  Create one
                </button>
              </span>
              <span>
                Have a Beta Code?{' '}
                <button onClick={() => { setMode('trial'); setError(null); setMessage(null); }}>
                  Use Trial Code
                </button>
              </span>
            </span>
          ) : mode === 'signup' ? (
            <span>
              Already have an account?{' '}
              <button onClick={() => { setMode('login'); setError(null); setMessage(null); }}>
                Sign in
              </button>
            </span>
          ) : (
            <span>
              Ready to create an account?{' '}
              <button onClick={() => { setMode('signup'); setError(null); setMessage(null); }}>
                Sign up
              </button>
            </span>
          )}
        </div>

        <p className="auth-footer">
          By continuing, you agree to BlueCrewAI's terms of service.
        </p>
      </div>
    </div>
  );
}
