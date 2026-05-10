import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import {
  ClipboardList, DollarSign, TrendingUp, Calendar,
  ExternalLink, Clock,
} from 'lucide-react'
import Shell from '../components/Shell'
import { supabase } from '../lib/supabase'
import { useAuth } from '../hooks/useAuth'

function StatTile({ icon, value, label, sub, accent = 'var(--bc-blue)' }) {
  return (
    <div className="bc-card" style={{ padding: 18, display: 'flex', flexDirection: 'column', gap: 10 }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div style={{ width: 34, height: 34, borderRadius: 9, background: 'var(--bc-blue-50)', color: accent, display: 'grid', placeItems: 'center' }}>
          {icon}
        </div>
        {sub != null && (
          <span className="bc-pill bc-pill-success">↑ {sub}</span>
        )}
      </div>
      <div>
        <div style={{ fontSize: 26, fontWeight: 700, letterSpacing: '-0.02em', lineHeight: 1.05 }}>{value}</div>
        <div style={{ fontSize: 12, color: 'var(--bc-ink-3)', marginTop: 4 }}>{label}</div>
      </div>
    </div>
  )
}

function AgentCard({ number, name, tagline, accent, active, ctaLabel, ctaHref, comingSoon }) {
  return (
    <div className="bc-card" style={{ padding: 20, display: 'flex', flexDirection: 'column', gap: 14, position: 'relative', overflow: 'hidden' }}>
      {/* Coloured top stripe */}
      <div style={{ position: 'absolute', inset: '0 0 auto 0', height: 3, background: accent, borderRadius: '16px 16px 0 0' }} />

      <div style={{ display: 'flex', alignItems: 'flex-start', gap: 12 }}>
        <div style={{ width: 44, height: 44, borderRadius: 12, background: `${accent}1A`, color: accent, display: 'grid', placeItems: 'center', fontSize: 22, flexShrink: 0 }}>
          {number === 1 ? '📋' : number === 2 ? '🎙️' : '🦺'}
        </div>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
            <span className="eyebrow">AGENT 0{number}</span>
            {active && <span className="bc-pill bc-pill-success"><span style={{ width: 6, height: 6, background: 'var(--bc-success)', borderRadius: 99 }} /> Active</span>}
            {comingSoon && <span className="bc-pill bc-pill-mute">Coming Soon</span>}
          </div>
          <div style={{ fontSize: 17, fontWeight: 700, letterSpacing: '-0.01em', marginTop: 4 }}>{name}</div>
        </div>
      </div>

      <p style={{ fontSize: 13, color: 'var(--bc-ink-3)', lineHeight: 1.5, margin: 0 }}>{tagline}</p>

      {active && (
        <a href={ctaHref} target="_blank" rel="noopener noreferrer" style={{ textDecoration: 'none' }}>
          <button className="bc-btn bc-btn-primary" style={{ width: '100%', background: accent }}>
            <ExternalLink size={16} /> {ctaLabel}
          </button>
        </a>
      )}

      {comingSoon && (
        <div style={{ padding: '12px 14px', background: 'var(--bc-sunken)', borderRadius: 10, fontSize: 13, color: 'var(--bc-ink-3)', textAlign: 'center' }}>
          In development — launching soon.
        </div>
      )}

      {!active && !comingSoon && (
        <Link to="/billing">
          <button className="bc-btn bc-btn-dark" style={{ width: '100%' }}>
            Add to plan →
          </button>
        </Link>
      )}
    </div>
  )
}

function QuoteRow({ quote }) {
  const date = new Date(quote.created_at).toLocaleDateString('en-AU', { day: 'numeric', month: 'short' })
  const total = typeof quote.total === 'number' ? `$${quote.total.toLocaleString('en-AU', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}` : '—'

  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 14, padding: '13px 4px', borderBottom: '1px solid var(--bc-border)' }}>
      <div style={{ width: 36, height: 36, borderRadius: 9, background: 'var(--bc-blue-50)', color: 'var(--bc-blue)', display: 'grid', placeItems: 'center', flexShrink: 0 }}>
        <ClipboardList size={16} />
      </div>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontSize: 14, fontWeight: 600, color: 'var(--bc-ink)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
          {quote.client_name || 'Unknown client'}
        </div>
        <div style={{ fontSize: 12, color: 'var(--bc-ink-3)', marginTop: 2 }}>
          {quote.quote_number || '—'} · {date}
        </div>
      </div>
      <div style={{ fontWeight: 700, fontSize: 14, color: 'var(--bc-ink)' }}>{total}</div>
    </div>
  )
}

export default function Dashboard() {
  const { session, profile } = useAuth()
  const [quotes, setQuotes] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!session) return
    async function load() {
      const { data } = await supabase
        .from('quotes')
        .select('*')
        .eq('user_id', session.user.id)
        .order('created_at', { ascending: false })
      setQuotes(data || [])
      setLoading(false)
    }
    load()
  }, [session])

  const fullName = session?.user?.user_metadata?.full_name || ''
  const firstName = fullName.split(' ')[0] || session?.user?.email?.split('@')[0] || 'there'

  const totalQuotes = quotes.length
  const totalValue  = quotes.reduce((s, q) => s + (q.total || 0), 0)

  const now = new Date()
  const monthQuotes = quotes.filter(q => {
    const d = new Date(q.created_at)
    return d.getFullYear() === now.getFullYear() && d.getMonth() === now.getMonth()
  })
  const monthValue = monthQuotes.reduce((s, q) => s + (q.total || 0), 0)

  const recentQuotes = quotes.slice(0, 5)

  const fmtCurrency = (n) => `$${n.toLocaleString('en-AU', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}`

  const today = new Date().toLocaleDateString('en-AU', { weekday: 'long', day: 'numeric', month: 'long' })

  return (
    <Shell
      active="home"
      breadcrumb="Workspace / Dashboard"
      title={`G'day, ${firstName}. 👋`}
      subtitle={today}
      topbarRight={
        <a href="https://quote.bluecrewai.com" target="_blank" rel="noopener noreferrer">
          <button className="bc-btn bc-btn-primary">📋 New quote</button>
        </a>
      }
    >
      {/* ── Stats row ── */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 16, marginBottom: 28 }}>
        <StatTile
          icon={<ClipboardList size={18} />}
          value={loading ? '—' : String(totalQuotes)}
          label="Total quotes sent"
        />
        <StatTile
          icon={<DollarSign size={18} />}
          value={loading ? '—' : fmtCurrency(totalValue)}
          label="Total invoiced via BlueCrew"
        />
        <StatTile
          icon={<Calendar size={18} />}
          value={loading ? '—' : String(monthQuotes.length)}
          label="Quotes this month"
        />
        <StatTile
          icon={<TrendingUp size={18} />}
          value={loading ? '—' : fmtCurrency(monthValue)}
          label="Revenue this month"
        />
      </div>

      {/* ── Agents ── */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14 }}>
        <div>
          <h2 style={{ fontSize: 18, fontWeight: 700, letterSpacing: '-0.01em' }}>Your agents</h2>
          <div style={{ fontSize: 13, color: 'var(--bc-ink-3)', marginTop: 2 }}>Tap any card to start.</div>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 16, marginBottom: 28 }}>
        <AgentCard
          number={1}
          name="Quote Agent"
          tagline="Send the quote before you leave the driveway. Win more jobs."
          accent="var(--agent-quote)"
          active
          ctaLabel="Open Quote Agent"
          ctaHref="https://quote.bluecrewai.com"
        />
        <AgentCard
          number={2}
          name="Admin Agent"
          tagline="Stop doing invoices at 9pm. Voice memo → invoice in 30 seconds."
          accent="var(--agent-admin)"
          comingSoon
        />
        <AgentCard
          number={3}
          name="Safety Agent"
          tagline="Generate compliant SWMS in 2 minutes. Never risk a $10K fine."
          accent="var(--agent-safety)"
          comingSoon
        />
      </div>

      {/* ── Recent quotes + plan summary ── */}
      <div style={{ display: 'grid', gridTemplateColumns: '1.7fr 1fr', gap: 16 }}>
        {/* Recent quotes */}
        <div className="bc-card" style={{ padding: 20 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 }}>
            <h3 style={{ fontSize: 15, fontWeight: 700 }}>Recent quotes</h3>
            <Link to="/quotes" style={{ fontSize: 12, color: 'var(--bc-blue)', fontWeight: 600 }}>See all →</Link>
          </div>

          {loading && (
            <div style={{ padding: '24px 0', display: 'flex', justifyContent: 'center' }}>
              <div className="spinner" style={{ width: 24, height: 24, borderWidth: 2 }} />
            </div>
          )}

          {!loading && recentQuotes.length === 0 && (
            <div style={{ padding: '32px 0', textAlign: 'center' }}>
              <div style={{ fontSize: 32, marginBottom: 10 }}>📋</div>
              <div style={{ fontSize: 14, fontWeight: 600, marginBottom: 6 }}>No quotes yet</div>
              <div style={{ fontSize: 13, color: 'var(--bc-ink-3)', marginBottom: 18 }}>Send your first quote using the Quote Agent.</div>
              <a href="https://quote.bluecrewai.com" target="_blank" rel="noopener noreferrer">
                <button className="bc-btn bc-btn-primary" style={{ fontSize: 13 }}>Open Quote Agent →</button>
              </a>
            </div>
          )}

          {!loading && recentQuotes.map(q => <QuoteRow key={q.id} quote={q} />)}
        </div>

        {/* Right column */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          {/* Plan card */}
          <div className="bc-card" style={{ padding: 18 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 }}>
              <span className="eyebrow">Current plan</span>
              <span className="bc-pill bc-pill-blue">Beta</span>
            </div>
            <div style={{ fontSize: 17, fontWeight: 700, letterSpacing: '-0.01em' }}>Quote Agent</div>
            <div style={{ fontSize: 13, color: 'var(--bc-ink-3)', marginTop: 2 }}>Active · beta access</div>
            <div style={{ height: 1, background: 'var(--bc-border)', margin: '14px 0' }} />
            <Link to="/billing">
              <button className="bc-btn bc-btn-dark" style={{ width: '100%' }}>
                <Clock size={15} /> Manage billing
              </button>
            </Link>
          </div>

          {/* Tip card */}
          <div style={{ background: 'linear-gradient(135deg, var(--bc-blue-50) 0%, white 100%)', border: '1px solid var(--bc-border)', borderRadius: 16, padding: 18 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
              <span style={{ fontSize: 16 }}>✨</span>
              <span style={{ fontSize: 12, color: 'var(--bc-blue-700)', fontWeight: 700, letterSpacing: '.04em' }}>TIP OF THE DAY</span>
            </div>
            <div style={{ fontSize: 14, fontWeight: 600, lineHeight: 1.4, marginBottom: 10 }}>
              Add your logo so PDFs go out under your business name, not BlueCrewAI's.
            </div>
            <Link to="/settings" style={{ fontSize: 13, color: 'var(--bc-blue)', fontWeight: 600 }}>
              Set up branding →
            </Link>
          </div>

          {/* Business profile quick view */}
          {profile && (
            <div className="bc-card" style={{ padding: 16 }}>
              <div className="eyebrow" style={{ marginBottom: 10 }}>Your profile</div>
              <div style={{ fontSize: 14, fontWeight: 600 }}>{profile.business_name}</div>
              <div style={{ fontSize: 13, color: 'var(--bc-ink-3)', marginTop: 2 }}>{profile.trade}</div>
              {profile.labour_rate > 0 && (
                <div style={{ fontSize: 12, color: 'var(--bc-ink-4)', marginTop: 6 }}>
                  ${profile.labour_rate}/hr · {profile.payment_terms}
                </div>
              )}
              <Link to="/settings" style={{ display: 'block', marginTop: 12 }}>
                <button className="bc-btn bc-btn-ghost" style={{ fontSize: 12, padding: '7px 14px' }}>Edit profile</button>
              </Link>
            </div>
          )}
        </div>
      </div>
    </Shell>
  )
}
