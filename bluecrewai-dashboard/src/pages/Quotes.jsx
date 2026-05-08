import { useEffect, useState } from 'react'
import { Search, ChevronDown, ChevronRight, ExternalLink } from 'lucide-react'
import Shell from '../components/Shell'
import { supabase } from '../lib/supabase'
import { useAuth } from '../hooks/useAuth'

function fmtDate(iso) {
  if (!iso) return '—'
  return new Date(iso).toLocaleDateString('en-AU', { day: 'numeric', month: 'short', year: 'numeric' })
}

function fmtMoney(n) {
  if (n == null) return '—'
  return `$${Number(n).toLocaleString('en-AU', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
}

function LineItems({ items }) {
  if (!items || !Array.isArray(items) || items.length === 0) {
    return <div style={{ padding: '12px 16px', fontSize: 13, color: 'var(--bc-ink-4)' }}>No line items recorded.</div>
  }
  return (
    <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
      <thead>
        <tr style={{ background: 'var(--bc-blue-25)' }}>
          <th style={{ padding: '8px 16px', textAlign: 'left', fontWeight: 600, color: 'var(--bc-ink-3)', fontSize: 11, letterSpacing: '.04em' }}>DESCRIPTION</th>
          <th style={{ padding: '8px 16px', textAlign: 'right', fontWeight: 600, color: 'var(--bc-ink-3)', fontSize: 11, letterSpacing: '.04em' }}>QTY</th>
          <th style={{ padding: '8px 16px', textAlign: 'right', fontWeight: 600, color: 'var(--bc-ink-3)', fontSize: 11, letterSpacing: '.04em' }}>RATE</th>
          <th style={{ padding: '8px 16px', textAlign: 'right', fontWeight: 600, color: 'var(--bc-ink-3)', fontSize: 11, letterSpacing: '.04em' }}>AMOUNT</th>
        </tr>
      </thead>
      <tbody>
        {items.map((item, i) => (
          <tr key={i} style={{ borderTop: '1px solid var(--bc-border)' }}>
            <td style={{ padding: '10px 16px' }}>{item.description || item.name || '—'}</td>
            <td style={{ padding: '10px 16px', textAlign: 'right', color: 'var(--bc-ink-3)' }}>{item.qty || item.quantity || 1}</td>
            <td style={{ padding: '10px 16px', textAlign: 'right', color: 'var(--bc-ink-3)' }}>{item.rate ? fmtMoney(item.rate) : '—'}</td>
            <td style={{ padding: '10px 16px', textAlign: 'right', fontWeight: 600 }}>{item.amount ? fmtMoney(item.amount) : fmtMoney((item.rate || 0) * (item.qty || item.quantity || 1))}</td>
          </tr>
        ))}
        {/* Totals */}
        <tr style={{ borderTop: '2px solid var(--bc-border)' }}>
          <td colSpan={3} style={{ padding: '10px 16px', textAlign: 'right', color: 'var(--bc-ink-3)', fontWeight: 600 }}>Subtotal</td>
          <td style={{ padding: '10px 16px', textAlign: 'right', fontWeight: 600 }}>{fmtMoney(items.reduce((s, i) => s + (i.amount || (i.rate || 0) * (i.qty || i.quantity || 1)), 0))}</td>
        </tr>
      </tbody>
    </table>
  )
}

function QuoteRow({ quote }) {
  const [open, setOpen] = useState(false)

  return (
    <>
      <tr
        style={{ cursor: 'pointer' }}
        onClick={() => setOpen(o => !o)}
        onMouseEnter={e => e.currentTarget.style.background = 'var(--bc-blue-25)'}
        onMouseLeave={e => e.currentTarget.style.background = ''}
      >
        <td style={{ padding: '13px 16px', color: 'var(--bc-ink-3)', fontSize: 13 }}>
          {fmtDate(quote.created_at)}
        </td>
        <td style={{ padding: '13px 16px', fontFamily: 'var(--bc-mono)', fontSize: 12, color: 'var(--bc-ink-4)' }}>
          {quote.quote_number || '—'}
        </td>
        <td style={{ padding: '13px 16px', fontWeight: 600, fontSize: 14 }}>
          {quote.client_name || '—'}
        </td>
        <td style={{ padding: '13px 16px', color: 'var(--bc-ink-3)', fontSize: 13 }}>
          {quote.client_email || '—'}
        </td>
        <td style={{ padding: '13px 16px', fontWeight: 700, fontSize: 14 }}>
          {fmtMoney(quote.total)}
        </td>
        <td style={{ padding: '13px 16px', textAlign: 'right', color: 'var(--bc-ink-4)' }}>
          {open ? <ChevronDown size={16} /> : <ChevronRight size={16} />}
        </td>
      </tr>
      {open && (
        <tr>
          <td colSpan={6} style={{ padding: 0, background: 'var(--bc-blue-25)' }}>
            <div style={{ borderTop: '1px solid var(--bc-border)', borderBottom: '1px solid var(--bc-border)' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '10px 16px', fontSize: 12, color: 'var(--bc-ink-3)' }}>
                <span>Subtotal: <strong style={{ color: 'var(--bc-ink)' }}>{fmtMoney(quote.subtotal)}</strong> · GST: <strong style={{ color: 'var(--bc-ink)' }}>{fmtMoney(quote.gst)}</strong> · Total: <strong style={{ color: 'var(--bc-ink)' }}>{fmtMoney(quote.total)}</strong></span>
                {quote.business_name && <span>{quote.business_name}</span>}
              </div>
              <LineItems items={quote.items} />
            </div>
          </td>
        </tr>
      )}
    </>
  )
}

export default function Quotes() {
  const { session } = useAuth()
  const [quotes, setQuotes] = useState([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')

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

  const filtered = quotes.filter(q =>
    !search || (q.client_name || '').toLowerCase().includes(search.toLowerCase())
  )

  const total = filtered.reduce((s, q) => s + (q.total || 0), 0)

  return (
    <Shell active="quotes" breadcrumb="Workspace / Quotes" title="Quote history"
      subtitle="All quotes sent via BlueCrewAI, newest first."
      topbarRight={
        <a href="https://quote.bluecrewai.com" target="_blank" rel="noopener noreferrer">
          <button className="bc-btn bc-btn-primary"><ExternalLink size={15} /> New quote</button>
        </a>
      }>

      {/* Search + summary */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 20 }}>
        <div style={{ position: 'relative', flex: '0 0 300px' }}>
          <Search size={15} style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: 'var(--bc-ink-4)' }} />
          <input
            type="text"
            placeholder="Search by client name…"
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="bc-input"
            style={{ paddingLeft: 36 }}
          />
        </div>
        {!loading && (
          <div style={{ fontSize: 13, color: 'var(--bc-ink-3)' }}>
            {filtered.length} {filtered.length === 1 ? 'quote' : 'quotes'}
            {filtered.length > 0 && <> · total <strong style={{ color: 'var(--bc-ink)' }}>${total.toLocaleString('en-AU', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</strong></>}
          </div>
        )}
      </div>

      {/* Table */}
      <div className="bc-card" style={{ overflow: 'hidden' }}>
        {loading ? (
          <div style={{ padding: 48, display: 'flex', justifyContent: 'center' }}>
            <div className="spinner" />
          </div>
        ) : filtered.length === 0 ? (
          <div style={{ padding: '60px 0', textAlign: 'center' }}>
            <div style={{ fontSize: 36, marginBottom: 12 }}>📋</div>
            <div style={{ fontSize: 16, fontWeight: 600, marginBottom: 8 }}>
              {search ? 'No quotes match your search' : 'No quotes yet'}
            </div>
            <div style={{ fontSize: 14, color: 'var(--bc-ink-3)', marginBottom: 24 }}>
              {search ? 'Try a different client name.' : 'Open the Quote Agent to send your first quote.'}
            </div>
            {!search && (
              <a href="https://quote.bluecrewai.com" target="_blank" rel="noopener noreferrer">
                <button className="bc-btn bc-btn-primary">Open Quote Agent →</button>
              </a>
            )}
          </div>
        ) : (
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ background: 'var(--bc-sunken)' }}>
                <th style={{ padding: '10px 16px', textAlign: 'left', fontSize: 11, color: 'var(--bc-ink-4)', fontWeight: 700, letterSpacing: '.05em' }}>DATE</th>
                <th style={{ padding: '10px 16px', textAlign: 'left', fontSize: 11, color: 'var(--bc-ink-4)', fontWeight: 700, letterSpacing: '.05em' }}>QUOTE #</th>
                <th style={{ padding: '10px 16px', textAlign: 'left', fontSize: 11, color: 'var(--bc-ink-4)', fontWeight: 700, letterSpacing: '.05em' }}>CLIENT</th>
                <th style={{ padding: '10px 16px', textAlign: 'left', fontSize: 11, color: 'var(--bc-ink-4)', fontWeight: 700, letterSpacing: '.05em' }}>EMAIL</th>
                <th style={{ padding: '10px 16px', textAlign: 'left', fontSize: 11, color: 'var(--bc-ink-4)', fontWeight: 700, letterSpacing: '.05em' }}>TOTAL</th>
                <th style={{ padding: '10px 16px', width: 40 }} />
              </tr>
            </thead>
            <tbody>
              {filtered.map(q => <QuoteRow key={q.id} quote={q} />)}
            </tbody>
          </table>
        )}
      </div>
    </Shell>
  )
}
