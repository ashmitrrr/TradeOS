import { Routes, Route, Navigate } from 'react-router-dom'
import ProtectedRoute from './components/ProtectedRoute'
import Login from './pages/Login'
import Signup from './pages/Signup'
import Onboarding from './pages/Onboarding'
import Dashboard from './pages/Dashboard'
import Quotes from './pages/Quotes'
import Settings from './pages/Settings'
import Billing from './pages/Billing'
import ComingSoon from './pages/ComingSoon'

export default function App() {
  return (
    <Routes>
      {/* Public */}
      <Route path="/login"  element={<Login />} />
      <Route path="/signup" element={<Signup />} />

      {/* Protected — requires auth */}
      <Route path="/onboarding" element={
        <ProtectedRoute><Onboarding /></ProtectedRoute>
      } />
      <Route path="/dashboard" element={
        <ProtectedRoute><Dashboard /></ProtectedRoute>
      } />
      <Route path="/quotes" element={
        <ProtectedRoute><Quotes /></ProtectedRoute>
      } />
      <Route path="/settings" element={
        <ProtectedRoute><Settings /></ProtectedRoute>
      } />
      <Route path="/billing" element={
        <ProtectedRoute><Billing /></ProtectedRoute>
      } />
      <Route path="/admin" element={
        <ProtectedRoute><ComingSoon agent="Admin Agent" accent="var(--agent-admin)" /></ProtectedRoute>
      } />
      <Route path="/safety" element={
        <ProtectedRoute><ComingSoon agent="Safety Agent" accent="var(--agent-safety)" /></ProtectedRoute>
      } />

      {/* Root → dashboard */}
      <Route path="/" element={<Navigate to="/dashboard" replace />} />

      {/* 404 → dashboard */}
      <Route path="*" element={<Navigate to="/dashboard" replace />} />
    </Routes>
  )
}
