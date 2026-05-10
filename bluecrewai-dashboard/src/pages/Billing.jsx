import { Check, Download } from 'lucide-react'

import Shell from '../components/Shell'

function PlanCard({ name, price, sub, features, cta, highlighted, current, onCta }) {
  return (
    <div className="bc-card" style={{
      padding: 22, display: 'flex', flexDirection: 'column', gap: 14,
      position: 'relative',
      border: highlighted ? '2px solid var(--bc-blue)' : '1px solid var(--bc-border)',
      background: highlighted ? 'linear-gradient(180deg, var(--bc-blue-25), white)' : 'white',
    }}>
      {highlighted && (
        <div style={{ position: 'absolute', top: -11, left: 22, background: 'var(--bc-blue)', color: 'white', fontSize: 11, fontWeight: 700, padding: '3px 10px', borderRadius: 99, letterSpacing: '.04em' }}>
          BEST VALUE
        </div>
      )}
      <div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
          <span style={{ fontSize: 14, fontWeight: 700 }}>{name}</span>
          {current && <span className="bc-pill bc-pill-blue">Current plan</span>}
        </div>
        <div style={{ fontSize: 12, color: 'var(--bc-ink-3)', marginTop: 4 }}>{sub}</div>
      </div>
      <div style={{ display: 'flex', alignItems: 'baseline', gap: 4 }}>
        <span style={{ fontSize: 30, fontWeight: 800, letterSpacing: '-0.03em' }}>${price}</span>
        <span style={{ fontSize: 13, color: 'var(--bc-ink-3)' }}>/ month</span>
      </div>
      <ul style={{ display: 'flex', flexDirection: 'column', gap: 8, flex: 1 }}>
        {features.map(f => (
          <li key={f} style={{ display: 'flex', gap: 8, fontSize: 13, color: 'var(--bc-ink-2)' }}>
            <Check size={14} style={{ color: 'var(--bc-blue)', marginTop: 2, flexShrink: 0 }} /> {f}
          </li>
        ))}
      </ul>
      <button
        className={`bc-btn ${highlighted ? 'bc-btn-primary' : current ? 'bc-btn-ghost' : 'bc-btn-dark'}`}
        style={{ marginTop: 'auto' }}
        onClick={onCta}
      >
        {cta}
      </button>
    </div>
  )
}

export default function Billing() {
  return (
    <Shell
      active="billing"
      breadcrumb="Workspace / Account"
      title="Billing & plans"
      subtitle="Manage your subscription and view billing history."
      topbarRight={
        <button className="bc-btn bc-btn-ghost"><Download size={15} /> Download invoices</button>
      }
    >
      {/* Current plan strip */}
      <div className="bc-card" style={{ padding: 22, marginBottom: 24, display: 'grid', gridTemplateColumns: '1.4fr 1fr 1fr auto', gap: 24, alignItems: 'center' }}>
        <div>
          <div className="eyebrow" style={{ marginBottom: 6 }}>Current plan</div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
            <span style={{ fontSize: 20, fontWeight: 800, letterSpacing: '-0.02em' }}>Quote Agent</span>
            <span className="bc-pill bc-pill-success">
              <span style={{ width: 6, height: 6, background: 'var(--bc-success)', borderRadius: 99 }} /> Active
            </span>
          </div>
          <div style={{ fontSize: 13, color: 'var(--bc-ink-3)', marginTop: 4 }}>Beta access · contact us to upgrade</div>
        </div>
        <div>
          <div className="eyebrow" style={{ marginBottom: 6 }}>Next charge</div>
          <div style={{ fontSize: 18, fontWeight: 700 }}>—</div>
          <div style={{ fontSize: 12, color: 'var(--bc-ink-3)', marginTop: 2 }}>Beta — no charge yet</div>
        </div>
        <div>
          <div className="eyebrow" style={{ marginBottom: 6 }}>Payment method</div>
          <div style={{ fontSize: 14, color: 'var(--bc-ink-3)' }}>Not set up yet</div>
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          <a href="mailto:ashmit@bluecrewai.com" style={{ textDecoration: 'none' }}>
            <button className="bc-btn bc-btn-primary" style={{ width: '100%' }}>Contact us to upgrade</button>
          </a>
        </div>
      </div>

      {/* Plan picker */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: 14 }}>
        <div>
          <h2 style={{ fontSize: 18, fontWeight: 700, letterSpacing: '-0.01em' }}>Choose a plan</h2>
          <div style={{ fontSize: 13, color: 'var(--bc-ink-3)', marginTop: 2 }}>All plans include a 14-day free trial.</div>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 14, marginBottom: 32 }}>
        <PlanCard
          name="Quote Agent"
          price="79"
          sub="For tradies who quote on site"
          features={['Voice-to-quote in ~28s', 'Branded PDF with your logo', 'Stripe payment link', '100 quotes / month']}
          cta="Get started"
          current
          onCta={() => window.open('mailto:ashmit@bluecrewai.com?subject=BlueCrewAI%20Quote%20Plan', '_blank')}
        />
        <PlanCard
          name="Quote + Admin"
          price="148"
          sub="Quote and invoice by voice"
          features={['Everything in Quote', 'Voice-to-invoice', 'Xero / MYOB sync', 'Auto SMS follow-ups']}
          cta="Upgrade"
          onCta={() => window.open('mailto:ashmit@bluecrewai.com?subject=BlueCrewAI%20Quote%2BAdmin%20Plan', '_blank')}
        />
        <PlanCard
          name="All 3 Agents"
          price="249"
          sub="Quote + Admin + Safety"
          features={['Everything in Quote + Admin', 'SafeWork compliant SWMS', 'Photo → hazard report', 'Priority support']}
          cta="Upgrade — save $98/mo"
          highlighted
          onCta={() => window.open('mailto:ashmit@bluecrewai.com?subject=BlueCrewAI%20All%203%20Agents', '_blank')}
        />
        <PlanCard
          name="Custom Agent"
          price="99–499"
          sub="Built to your exact workflow"
          features={['Discovery call', 'Built in 1–2 weeks', 'One-off build $1K–5K+', 'Dedicated support']}
          cta="Book a call"
          onCta={() => window.open('mailto:ashmit@bluecrewai.com?subject=BlueCrewAI%20Custom%20Agent', '_blank')}
        />
      </div>

      {/* Contact info */}
      <div className="bc-card" style={{ padding: 22, background: 'linear-gradient(135deg, var(--bc-blue-25), white)' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 16, flexWrap: 'wrap' }}>
          <div style={{ flex: 1 }}>
            <h3 style={{ fontSize: 16, fontWeight: 700, marginBottom: 4 }}>Need help choosing a plan?</h3>
            <p style={{ fontSize: 14, color: 'var(--bc-ink-3)' }}>
              We're in beta — email us and we'll set you up manually. Payments go through a Stripe link.
            </p>
          </div>
          <a href="mailto:ashmit@bluecrewai.com" style={{ textDecoration: 'none' }}>
            <button className="bc-btn bc-btn-primary">Email us →</button>
          </a>
        </div>
      </div>
    </Shell>
  )
}
