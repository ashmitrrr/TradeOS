import { Link, useNavigate } from 'react-router-dom'
import {
  LayoutDashboard, Bell, FileText, Briefcase, HardHat,
  CreditCard, Settings, Search, Lock, Sparkles, LogOut,
  ClipboardList,
} from 'lucide-react'
import { useAuth } from '../hooks/useAuth'

function NavItem({ icon, label, active, badge, locked, to, onClick, external }) {
  const cls = ['nav-item', active ? 'active' : '', locked ? 'locked' : ''].filter(Boolean).join(' ')

  const inner = (
    <>
      {icon}
      <span style={{ flex: 1 }}>{label}</span>
      {locked && <Lock size={14} />}
      {badge && (
        <span style={{
          background: 'var(--bc-blue)', color: 'white',
          fontSize: 10, fontWeight: 700, padding: '2px 6px',
          borderRadius: 999, lineHeight: 1,
        }}>{badge}</span>
      )}
    </>
  )

  if (external) {
    return (
      <a href={to} target="_blank" rel="noopener noreferrer" className={cls}>
        {inner}
      </a>
    )
  }
  if (to) {
    return <Link to={to} className={cls}>{inner}</Link>
  }
  return (
    <div className={cls} onClick={onClick} role="button" tabIndex={0}>
      {inner}
    </div>
  )
}

function SidebarGroup({ label }) {
  return (
    <div style={{
      fontSize: 11, fontWeight: 600, color: 'var(--bc-ink-4)',
      textTransform: 'uppercase', letterSpacing: '.06em',
      padding: '20px 10px 8px',
    }}>
      {label}
    </div>
  )
}

export default function Shell({ active = 'home', title, subtitle, breadcrumb, topbarRight, children, contentBg }) {
  const { session, profile, signOut } = useAuth()
  const navigate = useNavigate()

  const fullName = session?.user?.user_metadata?.full_name || ''
  const firstName = fullName.split(' ')[0] || session?.user?.email?.split('@')[0] || 'there'
  const initials = firstName.slice(0, 2).toUpperCase()
  const businessName = profile?.business_name || firstName
  const tradeLabel = profile?.trade || session?.user?.email || ''

  async function handleSignOut() {
    await signOut()
    navigate('/login', { replace: true })
  }

  return (
    <div style={{ display: 'flex', height: '100vh', fontFamily: 'var(--bc-font)' }}>
      {/* ── Sidebar ── */}
      <aside style={{
        width: 240, background: 'white',
        borderRight: '1px solid var(--bc-border)',
        display: 'flex', flexDirection: 'column',
        padding: '20px 14px', flexShrink: 0,
        overflowY: 'auto',
      }}>
        {/* Logo */}
        <Link to="/dashboard" style={{
          display: 'block', padding: '4px 8px 24px', textDecoration: 'none',
        }}>
          <img src="/logo.png" alt="BlueCrewAI logo" style={{ height: 40, width: 'auto', display: 'block' }} />
        </Link>

        <SidebarGroup label="Workspace" />
        <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
          <NavItem icon={<LayoutDashboard size={18} />} label="Dashboard" active={active === 'home'} to="/dashboard" />
          <NavItem icon={<ClipboardList size={18} />} label="Quotes" active={active === 'quotes'} to="/quotes" />
        </div>

        <SidebarGroup label="Your agents" />
        <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
          <NavItem
            icon={<FileText size={18} />}
            label="Quote Agent"
            active={active === 'quote'}
            to="https://quote.bluecrewai.com"
            external
          />
          <NavItem
            icon={<Briefcase size={18} />}
            label="Admin Agent"
            active={active === 'admin'}
            to="/admin"
          />
          <NavItem
            icon={<HardHat size={18} />}
            label="Safety Agent"
            active={active === 'safety'}
            locked
            to="/safety"
          />
        </div>

        <SidebarGroup label="Account" />
        <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
          <NavItem icon={<CreditCard size={18} />} label="Billing & Plans" active={active === 'billing'} to="/billing" />
          <NavItem icon={<Settings size={18} />} label="Settings" active={active === 'settings'} to="/settings" />
        </div>

        <div style={{ flex: 1 }} />

        {/* Upsell card */}
        <div style={{
          background: 'linear-gradient(160deg, #14213D 0%, #0B1220 100%)',
          borderRadius: 14, padding: 14, color: 'white',
          position: 'relative', overflow: 'hidden', marginBottom: 12,
        }}>
          <div style={{ position: 'absolute', top: -20, right: -20, width: 80, height: 80, borderRadius: '50%', background: 'var(--bc-blue)', opacity: .35, filter: 'blur(20px)' }} />
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 11, color: 'rgba(255,255,255,.7)', marginBottom: 6 }}>
            <Sparkles size={12} /> Unlock the bundle
          </div>
          <div style={{ fontSize: 13, fontWeight: 600, lineHeight: 1.3, marginBottom: 12 }}>
            All 3 agents for $249/mo — save $98/mo vs separate.
          </div>
          <Link to="/billing">
            <button style={{
              width: '100%', background: 'white', color: 'var(--bc-ink)', border: 'none',
              fontFamily: 'var(--bc-font)', fontWeight: 600, fontSize: 13,
              padding: '8px 12px', borderRadius: 8, cursor: 'pointer',
            }}>Upgrade to all 3</button>
          </Link>
        </div>

        {/* User chip */}
        <div style={{
          display: 'flex', alignItems: 'center', gap: 10,
          padding: '14px 8px 0', borderTop: '1px solid var(--bc-border)',
        }}>
          <div style={{
            width: 32, height: 32, borderRadius: 8,
            background: '#FFD9B5', display: 'grid', placeItems: 'center',
            color: '#7A4A1F', fontWeight: 700, fontSize: 13, flexShrink: 0,
          }}>
            {initials}
          </div>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontSize: 13, fontWeight: 600, lineHeight: 1.2, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{businessName}</div>
            <div style={{ fontSize: 11, color: 'var(--bc-ink-4)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{tradeLabel}</div>
          </div>
          <button
            onClick={handleSignOut}
            style={{ background: 'none', border: 'none', padding: 4, cursor: 'pointer', color: 'var(--bc-ink-4)', flexShrink: 0 }}
            title="Sign out"
          >
            <LogOut size={16} />
          </button>
        </div>
      </aside>

      {/* ── Main ── */}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', minWidth: 0, overflow: 'hidden' }}>
        {/* Topbar */}
        <header style={{
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          padding: '18px 28px', borderBottom: '1px solid var(--bc-border)',
          background: 'white', gap: 16, flexShrink: 0,
        }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 3, minWidth: 0 }}>
            {breadcrumb && (
              <div style={{ fontSize: 12, color: 'var(--bc-ink-4)', fontWeight: 500 }}>{breadcrumb}</div>
            )}
            <h1 style={{ margin: 0, fontSize: 22, fontWeight: 700, letterSpacing: '-0.02em', color: 'var(--bc-ink)' }}>
              {title}
            </h1>
            {subtitle && (
              <div style={{ fontSize: 13, color: 'var(--bc-ink-3)' }}>{subtitle}</div>
            )}
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexShrink: 0 }}>
            <div style={{
              display: 'flex', alignItems: 'center', gap: 8,
              background: 'var(--bc-sunken)', padding: '8px 14px',
              borderRadius: 10, color: 'var(--bc-ink-4)', fontSize: 13, width: 220,
            }}>
              <Search size={15} />
              <span>Search…</span>
            </div>
            <button className="bc-btn bc-btn-ghost" style={{ padding: '8px 10px', position: 'relative' }}>
              <Bell size={18} />
              <span style={{ position: 'absolute', top: 7, right: 7, width: 7, height: 7, background: 'var(--bc-blue)', borderRadius: 99, border: '2px solid white' }} />
            </button>
            {topbarRight}
          </div>
        </header>

        {/* Page content */}
        <div style={{ flex: 1, overflow: 'auto', padding: 28, background: contentBg || 'var(--bc-bg)' }}>
          {children}
        </div>
      </div>
    </div>
  )
}
