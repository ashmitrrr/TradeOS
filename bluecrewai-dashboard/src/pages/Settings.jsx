import { useEffect, useState } from 'react'
import { Check, Upload, Trash2, Eye, EyeOff } from 'lucide-react'
import Shell from '../components/Shell'
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

const TABS = ['Profile & Business', 'Password']

function Field({ label, hint, children }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
      <label className="bc-label">{label}</label>
      {children}
      {hint && <div style={{ fontSize: 12, color: 'var(--bc-ink-4)' }}>{hint}</div>}
    </div>
  )
}

function SectionCard({ title, sub, children }) {
  return (
    <div className="bc-card" style={{ padding: 22 }}>
      <div style={{ marginBottom: 18 }}>
        <h3 style={{ fontSize: 15, fontWeight: 700 }}>{title}</h3>
        {sub && <div style={{ fontSize: 13, color: 'var(--bc-ink-3)', marginTop: 2 }}>{sub}</div>}
      </div>
      {children}
    </div>
  )
}

export default function Settings() {
  const { session, profile, refreshProfile } = useAuth()
  const [tab, setTab] = useState(0)
  const [saving, setSaving] = useState(false)
  const [saveMsg, setSaveMsg] = useState('')
  const [error, setError] = useState('')

  const [form, setForm] = useState({
    business_name: '',
    trade: '',
    labour_rate: '',
    callout_fee: '',
    payment_terms: '',
    logo_base64: '',
  })

  const [pwForm, setPwForm] = useState({ current: '', next: '', confirm: '' })
  const [showPw, setShowPw] = useState(false)
  const [pwMsg, setPwMsg] = useState('')
  const [pwError, setPwError] = useState('')

  // Hydrate form when profile loads
  useEffect(() => {
    if (profile) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setForm({
        business_name: profile.business_name || '',
        trade: profile.trade || '',
        labour_rate: profile.labour_rate != null ? String(profile.labour_rate) : '',
        callout_fee: profile.callout_fee != null ? String(profile.callout_fee) : '',
        payment_terms: profile.payment_terms || '14 days',
        logo_base64: profile.logo_base64 || '',
      })
    }
  }, [profile])

  function set(field) {
    return e => setForm(f => ({ ...f, [field]: e.target.value }))
  }

  async function handleSave(e) {
    e.preventDefault()
    setError('')
    setSaveMsg('')
    setSaving(true)

    try {
      const { error: dbErr } = await supabase.from('profiles').upsert({
        id: session.user.id,
        email: session.user.email,
        business_name: form.business_name,
        trade: form.trade,
        labour_rate: parseFloat(form.labour_rate) || 0,
        callout_fee: parseFloat(form.callout_fee) || 0,
        payment_terms: form.payment_terms,
        logo_base64: form.logo_base64,
        updated_at: new Date().toISOString(),
      })
      if (dbErr) throw dbErr
      await refreshProfile()
      setSaveMsg('Changes saved!')
      setTimeout(() => setSaveMsg(''), 3000)
    } catch (e) {
      setError(e.message)
    } finally {
      setSaving(false)
    }
  }

  async function handleLogoUpload(e) {
    const file = e.target.files?.[0]
    if (!file) return
    if (file.size > 2 * 1024 * 1024) { setError('Logo must be under 2 MB.'); return }
    const reader = new FileReader()
    reader.onload = ev => setForm(f => ({ ...f, logo_base64: ev.target.result }))
    reader.readAsDataURL(file)
  }

  async function handlePasswordChange(e) {
    e.preventDefault()
    setPwError('')
    setPwMsg('')
    if (pwForm.next.length < 8) { setPwError('Password must be at least 8 characters.'); return }
    if (pwForm.next !== pwForm.confirm) { setPwError('Passwords do not match.'); return }

    const { error } = await supabase.auth.updateUser({ password: pwForm.next })
    if (error) { setPwError(error.message); return }
    setPwMsg('Password updated successfully.')
    setPwForm({ current: '', next: '', confirm: '' })
    setTimeout(() => setPwMsg(''), 4000)
  }

  const fullName = session?.user?.user_metadata?.full_name || session?.user?.email?.split('@')[0] || ''
  const initials = fullName.slice(0, 2).toUpperCase()

  return (
    <Shell
      active="settings"
      breadcrumb="Workspace / Account"
      title="Settings"
      subtitle="Your profile, business info, and branding."
      topbarRight={
        tab === 0 && (
          <button
            className="bc-btn bc-btn-primary"
            onClick={handleSave}
            disabled={saving}
            form="settings-form"
          >
            <Check size={15} /> {saving ? 'Saving…' : saveMsg || 'Save changes'}
          </button>
        )
      }
    >
      {/* Tabs */}
      <div style={{ display: 'flex', gap: 4, marginBottom: 24, borderBottom: '1px solid var(--bc-border)' }}>
        {TABS.map((t, i) => (
          <button
            key={t}
            onClick={() => setTab(i)}
            style={{
              padding: '10px 16px', fontSize: 13, fontWeight: 600,
              background: 'none', border: 'none', cursor: 'pointer',
              color: i === tab ? 'var(--bc-blue)' : 'var(--bc-ink-3)',
              borderBottom: `2px solid ${i === tab ? 'var(--bc-blue)' : 'transparent'}`,
              marginBottom: -1,
              transition: 'color .15s',
            }}
          >
            {t}
          </button>
        ))}
      </div>

      {tab === 0 && (
        <form id="settings-form" onSubmit={handleSave}>
          <div style={{ display: 'grid', gridTemplateColumns: '1.4fr 1fr', gap: 20 }}>
            {/* Left column */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
              <SectionCard
                title="Business details"
                sub="These appear on every quote and invoice PDF."
              >
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
                  <Field label="Business name">
                    <input type="text" className="bc-input" value={form.business_name} onChange={set('business_name')} placeholder="Penrith Plumbing Co." />
                  </Field>
                  <Field label="Trade">
                    <select className="bc-select" value={form.trade} onChange={set('trade')}>
                      <option value="">Select trade…</option>
                      {TRADES.map(t => <option key={t} value={t}>{t}</option>)}
                    </select>
                  </Field>
                  <Field label="Hourly labour rate (AUD, ex GST)">
                    <div style={{ position: 'relative' }}>
                      <span style={{ position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)', color: 'var(--bc-ink-3)', fontWeight: 600 }}>$</span>
                      <input type="number" className="bc-input" style={{ paddingLeft: 28 }} value={form.labour_rate} onChange={set('labour_rate')} placeholder="95" min="0" step="0.01" />
                    </div>
                  </Field>
                  <Field label="Call-out fee (AUD, ex GST)">
                    <div style={{ position: 'relative' }}>
                      <span style={{ position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)', color: 'var(--bc-ink-3)', fontWeight: 600 }}>$</span>
                      <input type="number" className="bc-input" style={{ paddingLeft: 28 }} value={form.callout_fee} onChange={set('callout_fee')} placeholder="0" min="0" step="0.01" />
                    </div>
                  </Field>
                </div>
                <div style={{ marginTop: 16 }}>
                  <Field label="Payment terms" hint="Shown in the footer of every quote and invoice.">
                    <select className="bc-select" value={form.payment_terms} onChange={set('payment_terms')}>
                      {PAYMENT_TERMS.map(t => <option key={t} value={t}>{t}</option>)}
                    </select>
                  </Field>
                </div>
              </SectionCard>

              <SectionCard title="Logo & branding" sub="Your logo appears top-right on every PDF.">
                <div style={{ display: 'flex', gap: 18, alignItems: 'center' }}>
                  {form.logo_base64 ? (
                    <img
                      src={form.logo_base64}
                      alt="Logo preview"
                      style={{ width: 80, height: 80, borderRadius: 12, objectFit: 'contain', border: '1px solid var(--bc-border)', background: 'var(--bc-sunken)', padding: 8 }}
                    />
                  ) : (
                    <div style={{ width: 80, height: 80, borderRadius: 12, background: 'var(--bc-sunken)', border: '2px dashed var(--bc-border)', display: 'grid', placeItems: 'center', color: 'var(--bc-ink-4)' }}>
                      <Upload size={22} />
                    </div>
                  )}
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: 14, fontWeight: 600, marginBottom: 4 }}>Logo on PDFs</div>
                    <div style={{ fontSize: 12, color: 'var(--bc-ink-3)', marginBottom: 12 }}>PNG or JPG. Up to 2 MB.</div>
                    <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                      <label className="bc-btn bc-btn-ghost" style={{ cursor: 'pointer', fontSize: 13 }}>
                        <Upload size={14} /> {form.logo_base64 ? 'Replace' : 'Upload logo'}
                        <input type="file" accept="image/png,image/jpeg,image/svg+xml" style={{ display: 'none' }} onChange={handleLogoUpload} />
                      </label>
                      {form.logo_base64 && (
                        <button
                          type="button"
                          className="bc-btn bc-btn-ghost"
                          style={{ color: 'var(--bc-danger)', fontSize: 13 }}
                          onClick={() => setForm(f => ({ ...f, logo_base64: '' }))}
                        >
                          <Trash2 size={14} /> Remove
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              </SectionCard>
            </div>

            {/* Right column */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
              <SectionCard title="Your account">
                <div style={{ display: 'flex', alignItems: 'center', gap: 14, marginBottom: 18, padding: '14px', background: 'var(--bc-sunken)', borderRadius: 12 }}>
                  <div style={{ width: 48, height: 48, borderRadius: 12, background: '#FFD9B5', display: 'grid', placeItems: 'center', color: '#7A4A1F', fontWeight: 700, fontSize: 18, flexShrink: 0 }}>
                    {initials}
                  </div>
                  <div>
                    <div style={{ fontSize: 15, fontWeight: 700 }}>{fullName || '—'}</div>
                    <div style={{ fontSize: 12, color: 'var(--bc-ink-3)' }}>{session?.user?.email}</div>
                  </div>
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                  <Field label="Name">
                    <input
                      type="text"
                      className="bc-input"
                      defaultValue={fullName}
                      onBlur={async e => {
                        await supabase.auth.updateUser({ data: { full_name: e.target.value } })
                      }}
                      placeholder="Your full name"
                    />
                  </Field>
                  <Field label="Email" hint="Contact support to change your email.">
                    <input type="email" className="bc-input" value={session?.user?.email || ''} readOnly style={{ opacity: .7, cursor: 'not-allowed' }} />
                  </Field>
                </div>
              </SectionCard>

              {error && (
                <div style={{ padding: '12px 16px', background: 'var(--bc-danger-bg)', borderRadius: 10, fontSize: 13, color: 'var(--bc-danger)' }}>
                  {error}
                </div>
              )}

              {saveMsg && (
                <div style={{ padding: '12px 16px', background: 'var(--bc-success-bg)', borderRadius: 10, fontSize: 13, color: 'var(--bc-success)', display: 'flex', alignItems: 'center', gap: 8 }}>
                  <Check size={14} /> {saveMsg}
                </div>
              )}
            </div>
          </div>
        </form>
      )}

      {tab === 1 && (
        <div style={{ maxWidth: 480 }}>
          <SectionCard title="Change password" sub="Use a strong password of at least 8 characters.">
            <form onSubmit={handlePasswordChange} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              <Field label="New password">
                <div style={{ position: 'relative' }}>
                  <input
                    type={showPw ? 'text' : 'password'}
                    className="bc-input"
                    value={pwForm.next}
                    onChange={e => setPwForm(f => ({ ...f, next: e.target.value }))}
                    placeholder="Min. 8 characters"
                    style={{ paddingRight: 44 }}
                    required
                  />
                  <button type="button" onClick={() => setShowPw(v => !v)}
                    style={{ position: 'absolute', right: 12, top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', color: 'var(--bc-ink-4)', cursor: 'pointer' }}>
                    {showPw ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>
              </Field>
              <Field label="Confirm new password">
                <input
                  type={showPw ? 'text' : 'password'}
                  className="bc-input"
                  value={pwForm.confirm}
                  onChange={e => setPwForm(f => ({ ...f, confirm: e.target.value }))}
                  placeholder="Repeat password"
                  required
                />
              </Field>

              {pwError && <div style={{ padding: '10px 12px', background: 'var(--bc-danger-bg)', borderRadius: 8, fontSize: 13, color: 'var(--bc-danger)' }}>{pwError}</div>}
              {pwMsg  && <div style={{ padding: '10px 12px', background: 'var(--bc-success-bg)', borderRadius: 8, fontSize: 13, color: 'var(--bc-success)', display: 'flex', alignItems: 'center', gap: 6 }}><Check size={13} /> {pwMsg}</div>}

              <button type="submit" className="bc-btn bc-btn-primary" style={{ alignSelf: 'flex-start', padding: '11px 24px' }}>
                Update password
              </button>
            </form>
          </SectionCard>
        </div>
      )}
    </Shell>
  )
}
