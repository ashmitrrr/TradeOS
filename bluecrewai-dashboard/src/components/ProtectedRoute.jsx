import { Navigate, useLocation } from 'react-router-dom'
import { useAuth } from '../hooks/useAuth'

function Spinner() {
  return (
    <div style={{
      height: '100vh', display: 'flex', alignItems: 'center',
      justifyContent: 'center', background: 'var(--bc-bg)',
    }}>
      <div className="spinner" />
    </div>
  )
}

export default function ProtectedRoute({ children }) {
  const { session, profile, loading, profileLoading } = useAuth()
  const location = useLocation()

  // Wait for Supabase to resolve the session from storage
  if (loading) return <Spinner />

  // No session — send to login
  if (!session) {
    return <Navigate to="/login" replace state={{ from: location }} />
  }

  // Session confirmed, profile row still fetching — hold here so a slow or
  // failed fetch doesn't fire the onboarding redirect prematurely
  if (profileLoading) return <Spinner />

  // Authenticated, no profile → onboarding (new user)
  if (!profile && location.pathname !== '/onboarding') {
    return <Navigate to="/onboarding" replace />
  }

  // Already has profile → skip onboarding
  if (profile && location.pathname === '/onboarding') {
    return <Navigate to="/dashboard" replace />
  }

  return children
}
