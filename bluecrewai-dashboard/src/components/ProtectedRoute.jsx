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
  const { session, profile } = useAuth()
  const location = useLocation()

  // Still loading auth or profile
  if (session === undefined || (session !== null && profile === undefined)) {
    return <Spinner />
  }

  // Not authenticated
  if (!session) {
    return <Navigate to="/login" replace state={{ from: location }} />
  }

  // Authenticated but no profile → onboarding (unless already there)
  if (profile === null && location.pathname !== '/onboarding') {
    return <Navigate to="/onboarding" replace />
  }

  // Has profile but on onboarding → dashboard
  if (profile && location.pathname === '/onboarding') {
    return <Navigate to="/dashboard" replace />
  }

  return children
}
