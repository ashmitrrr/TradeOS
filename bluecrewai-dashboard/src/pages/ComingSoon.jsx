import { Link } from 'react-router-dom'
import { Clock, ArrowLeft } from 'lucide-react'
import Shell from '../components/Shell'

export default function ComingSoon({ agent = 'This agent', accent = 'var(--bc-blue)' }) {
  const active = agent.toLowerCase().includes('admin') ? 'admin' : 'safety'

  return (
    <Shell
      active={active}
      breadcrumb={`Workspace / Agents`}
      title={agent}
      subtitle="This agent is currently in development."
    >
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: '60vh', textAlign: 'center' }}>
        <div style={{ width: 80, height: 80, borderRadius: 20, background: `${accent}1A`, color: accent, display: 'grid', placeItems: 'center', marginBottom: 24, fontSize: 36 }}>
          {active === 'admin' ? '🎙️' : '🦺'}
        </div>

        <div style={{ marginBottom: 8 }}>
          <span className="bc-pill bc-pill-mute" style={{ fontSize: 13 }}>
            <Clock size={13} /> Coming Soon
          </span>
        </div>

        <h1 style={{ fontSize: 28, fontWeight: 700, letterSpacing: '-0.02em', margin: '16px 0 8px' }}>
          {agent} is on the way
        </h1>

        <p style={{ fontSize: 16, color: 'var(--bc-ink-3)', maxWidth: 420, lineHeight: 1.6, marginBottom: 32 }}>
          {active === 'admin'
            ? 'Voice memo → invoice in 30 seconds. Xero sync. Auto SMS follow-ups. Launching soon.'
            : 'Generate a compliant SWMS in 2 minutes. Photo → hazard report. Toolbox talk logs. Launching soon.'}
        </p>

        <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', justifyContent: 'center' }}>
          <Link to="/dashboard">
            <button className="bc-btn bc-btn-ghost">
              <ArrowLeft size={16} /> Back to dashboard
            </button>
          </Link>
          <a href="mailto:ashmit@bluecrewai.com?subject=BlueCrewAI%20Beta%20Access" target="_blank" rel="noopener noreferrer">
            <button className="bc-btn bc-btn-primary">
              Get notified when it launches
            </button>
          </a>
        </div>
      </div>
    </Shell>
  )
}
