import { useState } from 'react'
import { Link, useNavigate, Navigate } from 'react-router-dom'
import { Eye, EyeOff, ArrowRight } from 'lucide-react'
import { supabase } from '../lib/supabase'
import { useAuth } from '../hooks/useAuth'

function StatChip({ n, label }) {
  return (
    <div style={{
      background: 'rgba(255,255,255,.08)', border: '1px solid rgba(255,255,255,.1)',
      borderRadius: 12, padding: '12px 14px', minWidth: 100,
    }}>
      <div style={{ fontSize: 22, fontWeight: 700, letterSpacing: '-0.02em' }}>{n}</div>
      <div style={{ fontSize: 11, color: 'rgba(255,255,255,.65)', marginTop: 2 }}>{label}</div>
    </div>
  )
}

export default function Login() {
  const { session, loading: authLoading } = useAuth()
  const navigate = useNavigate()

  const [email, setEmail]       = useState('')
  const [password, setPassword] = useState('')
  const [showPw, setShowPw]     = useState(false)
  const [error, setError]       = useState('')
  const [loading, setLoading]   = useState(false)

  if (authLoading) return null  // still resolving session from storage
  if (session) return <Navigate to="/dashboard" replace />

  async function handleSubmit(e) {
    e.preventDefault()
    setError('')
    setLoading(true)
    const { error } = await supabase.auth.signInWithPassword({ email, password })
    setLoading(false)
    if (error) { setError(error.message); return }
    navigate('/dashboard', { replace: true })
  }

  async function handleGoogle() {
    await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: { redirectTo: `${window.location.origin}/dashboard` },
    })
  }

  return (
    <div className="auth-split">
      {/* ── Left — form ── */}
      <div className="auth-form-panel">
        {/* Logo */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <div style={{
            width: 36, height: 36, borderRadius: 10, background: 'var(--bc-ink)',
            display: 'grid', placeItems: 'center', color: 'white', fontWeight: 800, fontSize: 15,
          }}>b</div>
          <span style={{ fontWeight: 700, fontSize: 17, letterSpacing: '-0.02em', color: 'var(--bc-ink)' }}>
            bluecrew<span style={{ color: 'var(--bc-blue)' }}>ai</span>
          </span>
        </div>

        <div className="auth-form-inner">
          <div style={{ fontSize: 13, color: 'var(--bc-blue)', fontWeight: 600, marginBottom: 8 }}>
            Welcome back
          </div>
          <h1 style={{ fontSize: 32, fontWeight: 700, letterSpacing: '-0.02em', lineHeight: 1.15, marginBottom: 12, color: 'var(--bc-ink)' }}>
            Sign in to your<br />workspace.
          </h1>
          <p style={{ color: 'var(--bc-ink-3)', fontSize: 14, marginBottom: 28 }}>
            Run your agents, see your history, manage billing.
          </p>

          <form onSubmit={handleSubmit}>
            {/* Email */}
            <label className="bc-label" htmlFor="email">Email</label>
            <input
              id="email"
              type="email"
              value={email}
              onChange={e => setEmail(e.target.value)}
              placeholder="you@yourcompany.com.au"
              className={`bc-input${error ? ' bc-input-error' : ''}`}
              style={{ marginBottom: 14 }}
              required
              autoFocus
            />

            {/* Password */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
              <label className="bc-label" htmlFor="password" style={{ margin: 0 }}>Password</label>
              <span style={{ fontSize: 13, color: 'var(--bc-blue)', fontWeight: 500, cursor: 'pointer' }}>Forgot?</span>
            </div>
            <div style={{ position: 'relative', marginBottom: 6 }}>
              <input
                id="password"
                type={showPw ? 'text' : 'password'}
                value={password}
                onChange={e => setPassword(e.target.value)}
                placeholder="••••••••••"
                className={`bc-input${error ? ' bc-input-error' : ''}`}
                style={{ paddingRight: 44 }}
                required
              />
              <button
                type="button"
                onClick={() => setShowPw(v => !v)}
                style={{ position: 'absolute', right: 12, top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', color: 'var(--bc-ink-4)', padding: 4, cursor: 'pointer' }}
              >
                {showPw ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>

            {error && (
              <div style={{ fontSize: 13, color: 'var(--bc-danger)', marginBottom: 14, padding: '8px 12px', background: 'var(--bc-danger-bg)', borderRadius: 8 }}>
                {error}
              </div>
            )}

            <button
              type="submit"
              className="bc-btn bc-btn-primary"
              style={{ width: '100%', padding: '13px 16px', fontSize: 15, marginTop: error ? 0 : 16 }}
              disabled={loading}
            >
              {loading ? 'Signing in…' : <><span>Sign in</span><ArrowRight size={16} /></>}
            </button>
          </form>

          {/* Divider */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, margin: '22px 0', color: 'var(--bc-ink-4)', fontSize: 12 }}>
            <div style={{ flex: 1, height: 1, background: 'var(--bc-border)' }} />
            or
            <div style={{ flex: 1, height: 1, background: 'var(--bc-border)' }} />
          </div>

          <button
            className="bc-btn bc-btn-ghost"
            style={{ width: '100%', padding: '11px 16px' }}
            onClick={handleGoogle}
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
              <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
              <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
              <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z" fill="#FBBC05"/>
              <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
            </svg>
            Continue with Google
          </button>

          <div style={{ marginTop: 28, fontSize: 13, color: 'var(--bc-ink-3)' }}>
            New to BlueCrewAI?{' '}
            <Link to="/signup" style={{ color: 'var(--bc-blue)', fontWeight: 600 }}>Create account →</Link>
          </div>
        </div>

        <div style={{ display: 'flex', gap: 16, fontSize: 12, color: 'var(--bc-ink-4)' }}>
          <span>🇦🇺 Sydney</span>
          <span>·</span>
          <span>Privacy</span>
          <span>·</span>
          <span>Terms</span>
        </div>
      </div>

      {/* ── Right — brand panel ── */}
      <div className="auth-brand-panel">
        {/* Decorative grid */}
        <div style={{
          position: 'absolute', inset: 0,
          backgroundImage: 'linear-gradient(rgba(255,255,255,.06) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,.06) 1px, transparent 1px)',
          backgroundSize: '40px 40px',
          maskImage: 'radial-gradient(circle at 70% 30%, black, transparent 70%)',
          WebkitMaskImage: 'radial-gradient(circle at 70% 30%, black, transparent 70%)',
        }} />
        <div style={{ position: 'absolute', top: -80, right: -80, width: 280, height: 280, borderRadius: '50%', background: '#2979FF', filter: 'blur(80px)', opacity: .5 }} />

        {/* Top badge */}
        <div style={{ position: 'relative', display: 'flex', alignItems: 'center', gap: 8, fontSize: 12, color: 'rgba(255,255,255,.7)' }}>
          <span style={{ width: 6, height: 6, background: '#3FE08C', borderRadius: 99, boxShadow: '0 0 8px #3FE08C' }} />
          Beta · 47 tradies on the platform
        </div>

        {/* Main content */}
        <div style={{ position: 'relative' }}>
          <div style={{ fontSize: 12, color: 'rgba(255,255,255,.65)', fontWeight: 600, letterSpacing: '.04em', textTransform: 'uppercase', marginBottom: 12 }}>
            This week on BlueCrew
          </div>
          <div style={{ display: 'flex', gap: 8, marginBottom: 24, flexWrap: 'wrap' }}>
            <StatChip n="184" label="quotes sent" />
            <StatChip n="$612k" label="invoiced" />
            <StatChip n="312hrs" label="saved" />
          </div>

          {/* Testimonial */}
          <div style={{ background: 'rgba(255,255,255,.07)', backdropFilter: 'blur(8px)', border: '1px solid rgba(255,255,255,.12)', padding: 22, borderRadius: 16 }}>
            <p style={{ margin: 0, fontSize: 18, lineHeight: 1.4, fontWeight: 500, letterSpacing: '-0.01em' }}>
              "Sent a quote while still standing in the client's garden. They accepted it before I'd driven away. Closed three extra jobs that week."
            </p>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginTop: 16 }}>
              <div style={{ width: 36, height: 36, borderRadius: 99, background: '#FFB48C', display: 'grid', placeItems: 'center', color: '#5C2A0A', fontWeight: 700 }}>TR</div>
              <div>
                <div style={{ fontWeight: 600, fontSize: 14 }}>Tim R.</div>
                <div style={{ fontSize: 12, color: 'rgba(255,255,255,.65)' }}>Landscaper · Brisbane, QLD</div>
              </div>
            </div>
          </div>
        </div>

        <div style={{ position: 'relative', fontSize: 12, color: 'rgba(255,255,255,.55)' }}>
          AI built for people who work with their hands, not their keyboards.
        </div>
      </div>
    </div>
  )
}
