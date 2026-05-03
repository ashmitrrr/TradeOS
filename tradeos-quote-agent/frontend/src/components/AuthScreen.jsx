// AuthScreen — login/signup form for BlueCrewAI accounts
import { useState } from 'react';
import { supabase, isSupabaseConfigured } from '../lib/supabase.js';

export default function AuthScreen({ onAuth }) {
  const [mode, setMode] = useState('login'); // 'login' | 'signup' | 'forgot'
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState(null);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);
    setMessage(null);
    setLoading(true);

    try {
      if (mode === 'signup') {
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

  const isValid = email.includes('@') && (mode === 'forgot' || password.length >= 6);

  return (
    <div className="auth-screen">
      <div className="auth-card">
        <div className="auth-brand">
          <img src="/logo.png" alt="BlueCrewAI" className="auth-logo" />
          <h1 className="auth-title">
            {mode === 'signup' ? 'Create Account' : mode === 'forgot' ? 'Reset Password' : 'Welcome Back'}
          </h1>
          <p className="auth-subtitle">
            {mode === 'signup'
              ? 'Start generating professional quotes in seconds'
              : mode === 'forgot'
              ? 'Enter your email and we\'ll send a reset link'
              : 'Sign in to your BlueCrewAI account'}
          </p>
        </div>

        {error && <div className="auth-error">{error}</div>}
        {message && <div className="auth-message">{message}</div>}

        <form onSubmit={handleSubmit}>
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
            <span>
              Don't have an account?{' '}
              <button onClick={() => { setMode('signup'); setError(null); setMessage(null); }}>
                Create one
              </button>
            </span>
          ) : (
            <span>
              Already have an account?{' '}
              <button onClick={() => { setMode('login'); setError(null); setMessage(null); }}>
                Sign in
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
