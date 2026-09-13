import { Navigate, Outlet } from 'react-router-dom'
import { useAuthStore } from '../features/auth/useAuthStore'
import { PageSpinner } from '../components/ui'

export function ProtectedRoute() {
  const status = useAuthStore((s) => s.status)

  if (status === 'checking') return <PageSpinner />
  if (status === 'guest') return <Navigate to="/login" replace />
  return <Outlet />
}

export function PublicOnlyRoute() {
  const status = useAuthStore((s) => s.status)

  if (status === 'authenticated') return <Navigate to="/habitos" replace />
  return <Outlet />
}
