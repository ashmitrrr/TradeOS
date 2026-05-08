import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { ArrowRight, CheckCircle } from 'lucide-react'
import { supabase } from '../lib/supabase'
import { useAuth } from '../hooks/useAuth'

const TRADES = [
  'Electrician', 'Plumber', 'Carpenter', 'Builder', 'Landscaper',
  'Painter', 'Tiler', 'Concreter', 'Roofer', 'Plasterer',
  'Cleaner', 'Pest Control', 'Pool Maintenance', 'Air Conditioning / HVAC',
  'Glazier', 'Welder', 'Mechanic', 'Other',
]

const PAYMENT_TERMS = [
  '7 days', '14 days', '21 days', '30 days',
  'Due on receipt', '50% deposit, balance on completion',
]

const STEPS = ['Business', 'Rates', 'Done']

export default function Onboarding() {
  const { session, refreshProfile } = useAuth()
  const navigate = useNavigate()

  const [step, setStep] = useState(0)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  const [form, setForm] = useState({
    business_name: '',
    trade: '',
    phone: '',
    labour_rate: '',
    callout_fee: '',
    payment_terms: '14 days',
  })

  function set(field) {
    return e => setForm(f => ({ ...f, [field]: e.target.value }))
  }

  async function handleSave(e) {
    e.preventDefault()
    setError('')
    setSaving(true)

    try {
      const { error: dbErr } = await supabase.from('profiles').insert({
        id: session.user.id,
        email: session.user.email,
        business_name: form.business_name,
        trade: form.trade,
        labour_rate: parseFloat(form.labour_rate) || 0,
        callout_fee: parseFloat(form.callout_fee) || 0,
        payment_terms: form.payment_terms,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      })

      if (dbErr) throw dbErr

      if (form.phone) {
        await supabase.auth.updateUser({ data: { phone: form.phone } })
      }

      await refreshProfile()
      setStep(2)
    } catch (e) {
      setError(e.message || 'Something went wrong. Please try again.')
    } finally {
      setSaving(false)
    }
  }

  const fullName = session?.user?.user_metadata?.full_name || session?.user?.email?.split('@')[0] || 'there'
  const firstName = fullName.split(' ')[0]

  return (
    <div style={{ minHeight: '100vh', background: 'var(--bc-bg)', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '40px 20px', fontFamily: 'var(--bc-font)' }}>
      {/* Logo */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 32 }}>
        <div style={{ width: 36, height: 36, borderRadius: 10, background: 'var(--bc-ink)', display: 'grid', placeItems: 'center', color: 'white', fontWeight: 800, fontSize: 15 }}>b</div>
        <span style={{ fontWeight: 700, fontSize: 18, letterSpacing: '-0.02em', color: 'var(--bc-ink)' }}>
          bluecrew<span style={{ color: 'var(--bc-blue)' }}>ai</span>
        </span>
      </div>

      {/* Progress steps */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 32 }}>
        {STEPS.map((s, i) => (
          <div key={s} style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <div style={{
              width: 28, height: 28, borderRadius: '50%', display: 'grid', placeItems: 'center',
              fontSize: 12, fontWeight: 700,
              background: i <= step ? 'var(--bc-blue)' : 'var(--bc-border)',
              color: i <= step ? 'white' : 'var(--bc-ink-4)',
              transition: 'background .3s',
            }}>
              {i < step ? '✓' : i + 1}
            </div>
            <span style={{ fontSize: 13, fontWeight: 600, color: i <= step ? 'var(--bc-ink)' : 'var(--bc-ink-4)' }}>{s}</span>
            {i < STEPS.length - 1 && <div style={{ width: 32, height: 1, background: i < step ? 'var(--bc-blue)' : 'var(--bc-border)', margin: '0 4px', transition: 'background .3s' }} />}
          </div>
        ))}
      </div>

      {/* Card */}
      <div className="bc-card" style={{ width: '100%', maxWidth: 520, padding: 36 }}>
        {step === 0 && (
          <>
            <h1 style={{ fontSize: 26, fontWeight: 700, letterSpacing: '-0.02em', marginBottom: 8 }}>
              G'day, {firstName}! 👋
            </h1>
            <p style={{ color: 'var(--bc-ink-3)', fontSize: 14, marginBottom: 28, lineHeight: 1.5 }}>
              Let's set up your workspace. Takes 60 seconds — then you're quoting jobs.
            </p>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
              <div>
                <label className="bc-label" htmlFor="biz">Business name</label>
                <input id="biz" type="text" className="bc-input" value={form.business_name} onChange={set('business_name')} placeholder="Penrith Plumbing Co." required />
              </div>
              <div>
                <label className="bc-label" htmlFor="trade">Trade</label>
                <select id="trade" className="bc-select" value={form.trade} onChange={set('trade')} required>
                  <option value="">Select your trade…</option>
                  {TRADES.map(t => <option key={t} value={t}>{t}</option>)}
                </select>
              </div>
              <div>
                <label className="bc-label" htmlFor="phone">Mobile (optional)</label>
                <input id="phone" type="tel" className="bc-input" value={form.phone} onChange={set('phone')} placeholder="0411 555 234" />
              </div>
            </div>

            <button
              className="bc-btn bc-btn-primary"
              style={{ width: '100%', marginTop: 28, padding: '13px', fontSize: 15 }}
              onClick={() => {
                if (!form.business_name || !form.trade) {
                  setError('Please enter your business name and trade.')
                  return
                }
                setError('')
                setStep(1)
              }}
            >
              Next — Set your rates <ArrowRight size={16} />
            </button>
            {error && <div style={{ marginTop: 12, fontSize: 13, color: 'var(--bc-danger)', textAlign: 'center' }}>{error}</div>}
          </>
        )}

        {step === 1 && (
          <form onSubmit={handleSave}>
            <h2 style={{ fontSize: 22, fontWeight: 700, letterSpacing: '-0.02em', marginBottom: 8 }}>Set your rates</h2>
            <p style={{ color: 'var(--bc-ink-3)', fontSize: 14, marginBottom: 28 }}>
              These go on every quote. You can change them any time in Settings.
            </p>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
              <div>
                <label className="bc-label" htmlFor="labour">Hourly labour rate (AUD, ex GST)</label>
                <div style={{ position: 'relative' }}>
                  <span style={{ position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)', color: 'var(--bc-ink-3)', fontWeight: 600 }}>$</span>
                  <input id="labour" type="number" className="bc-input" style={{ paddingLeft: 28 }} value={form.labour_rate} onChange={set('labour_rate')} placeholder="95" min="0" step="0.01" />
                </div>
              </div>

              <div>
                <label className="bc-label" htmlFor="callout">Call-out fee (AUD, ex GST)</label>
                <div style={{ position: 'relative' }}>
                  <span style={{ position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)', color: 'var(--bc-ink-3)', fontWeight: 600 }}>$</span>
                  <input id="callout" type="number" className="bc-input" style={{ paddingLeft: 28 }} value={form.callout_fee} onChange={set('callout_fee')} placeholder="0" min="0" step="0.01" />
                </div>
                <div style={{ fontSize: 12, color: 'var(--bc-ink-4)', marginTop: 5 }}>Enter 0 if you don't charge a call-out fee.</div>
              </div>

              <div>
                <label className="bc-label" htmlFor="terms">Payment terms</label>
                <select id="terms" className="bc-select" value={form.payment_terms} onChange={set('payment_terms')}>
                  {PAYMENT_TERMS.map(t => <option key={t} value={t}>{t}</option>)}
                </select>
              </div>
            </div>

            {error && <div style={{ marginTop: 16, fontSize: 13, color: 'var(--bc-danger)', padding: '10px 12px', background: 'var(--bc-danger-bg)', borderRadius: 8 }}>{error}</div>}

            <div style={{ display: 'flex', gap: 12, marginTop: 28 }}>
              <button type="button" className="bc-btn bc-btn-ghost" style={{ flex: 0 }} onClick={() => setStep(0)}>Back</button>
              <button type="submit" className="bc-btn bc-btn-primary" style={{ flex: 1, padding: '13px', fontSize: 15 }} disabled={saving}>
                {saving ? 'Saving…' : <>Save &amp; go to dashboard <ArrowRight size={16} /></>}
              </button>
            </div>
          </form>
        )}

        {step === 2 && (
          <div style={{ textAlign: 'center', padding: '12px 0' }}>
            <CheckCircle size={52} style={{ color: 'var(--bc-success)', marginBottom: 18 }} />
            <h2 style={{ fontSize: 24, fontWeight: 700, letterSpacing: '-0.02em', marginBottom: 8 }}>You're all set!</h2>
            <p style={{ color: 'var(--bc-ink-3)', fontSize: 14, marginBottom: 28, lineHeight: 1.5 }}>
              Your workspace is ready. Head to the dashboard to send your first quote.
            </p>
            <button
              className="bc-btn bc-btn-primary"
              style={{ padding: '13px 32px', fontSize: 15 }}
              onClick={() => navigate('/dashboard', { replace: true })}
            >
              Go to dashboard <ArrowRight size={16} />
            </button>
          </div>
        )}
      </div>

      <div style={{ marginTop: 24, fontSize: 12, color: 'var(--bc-ink-4)' }}>
        🇦🇺 Sydney · Privacy · Terms
      </div>
    </div>
  )
}
