import { Navigate, Outlet } from 'react-router-dom'
import { useAuthStore } from '../features/auth/useAuthStore'

export function ProtectedRoute() {
  const status = useAuthStore((s) => s.status)

  if (status === 'checking') return <p className="p-6 text-center text-sm text-muted">Carregando...</p>
  if (status === 'guest') return <Navigate to="/login" replace />
  return <Outlet />
}

export function PublicOnlyRoute() {
  const status = useAuthStore((s) => s.status)

  if (status === 'authenticated') return <Navigate to="/habitos" replace />
  return <Outlet />
}
