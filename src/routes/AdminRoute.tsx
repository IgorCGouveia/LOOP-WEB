import { Navigate, Outlet } from 'react-router-dom'
import { useAuthStore } from '../features/auth/useAuthStore'
import { PageSpinner } from '../components/ui'

// Checagem client-side é só UX (evita renderizar a tela pra quem não vai
// conseguir usar) — a API já resolve ownership/role de novo no servidor
// pra cada endpoint de admin, então esconder a rota aqui nunca é a defesa
// real. Mesma lógica de "não confiar no request", ver Desc/README.md.
export function AdminRoute() {
  const status = useAuthStore((s) => s.status)
  const role = useAuthStore((s) => s.user?.role)

  if (status === 'checking') return <PageSpinner />
  if (status === 'guest') return <Navigate to="/login" replace />
  if (role !== 'ADMIN') return <Navigate to="/habitos" replace />
  return <Outlet />
}
