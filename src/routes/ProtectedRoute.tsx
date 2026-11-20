import { Navigate, Outlet } from 'react-router-dom'
import { useAuthStore } from '../features/auth/useAuthStore'
import { bootstrapSession } from '../features/auth/bootstrap'
import { PageSpinner, QueryError } from '../components/ui'
import { usePageTitle } from '../lib/usePageTitle'

// O /refresh do boot falhou por rede/5xx: a sessão pode existir, então em vez
// de mandar pro login oferecemos tentar de novo (#11).
export function SessionUnreachable() {
  usePageTitle('API indisponível')
  return (
    <main className="mx-auto w-full max-w-lg px-4 py-16">
      <QueryError title="Não foi possível falar com a API" onRetry={() => void bootstrapSession()} />
    </main>
  )
}

export function ProtectedRoute() {
  const status = useAuthStore((s) => s.status)

  if (status === 'checking') return <PageSpinner label="Verificando sessão..." />
  if (status === 'unreachable') return <SessionUnreachable />
  if (status === 'guest') return <Navigate to="/login" replace />
  return <Outlet />
}

// Em 'unreachable' o login continua acessível: quem quiser pode tentar entrar
// de novo (o próprio POST /login mostra o erro se a API seguir fora).
export function PublicOnlyRoute() {
  const status = useAuthStore((s) => s.status)

  if (status === 'authenticated') return <Navigate to="/habitos" replace />
  return <Outlet />
}
