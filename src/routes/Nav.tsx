import { Link, useNavigate } from 'react-router-dom'
import { useAuthStore } from '../features/auth/useAuthStore'
import { logout } from '../api/auth'

export function Nav() {
  const navigate = useNavigate()
  const status = useAuthStore((s) => s.status)
  const user = useAuthStore((s) => s.user)
  const clearSession = useAuthStore((s) => s.clearSession)

  if (status !== 'authenticated' || !user) return null

  async function handleLogout() {
    await logout().catch(() => {})
    clearSession()
    navigate('/login')
  }

  return (
    <nav className="flex items-center justify-between border-b border-border px-4 py-3 text-sm">
      <div className="flex items-center gap-5">
        <Link to="/habitos" className="font-mono font-semibold text-text">
          loop
        </Link>
        <Link to="/habitos" className="text-muted hover:text-text">
          Hábitos
        </Link>
        <Link to="/perfil" className="text-muted hover:text-text">
          Minha conta
        </Link>
        {user.role === 'ADMIN' && (
          <>
            <Link to="/admin/usuarios" className="text-muted hover:text-text">
              Admin: Usuários
            </Link>
            <Link to="/admin/habitos" className="text-muted hover:text-text">
              Admin: Hábitos
            </Link>
          </>
        )}
      </div>
      <button onClick={handleLogout} className="text-muted hover:text-text">
        Sair
      </button>
    </nav>
  )
}
