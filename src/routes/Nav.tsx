import { Link, useLocation, useNavigate } from 'react-router-dom'
import type { ReactNode } from 'react'
import { useAuthStore } from '../features/auth/useAuthStore'
import { logout } from '../api/auth'
import { LogOutIcon, ListIcon, UserIcon, UsersIcon } from '../components/icons'

function NavLink({ to, children, icon }: { to: string; children: ReactNode; icon: ReactNode }) {
  const { pathname } = useLocation()
  const active = pathname === to || (to !== '/habitos' && pathname.startsWith(to))
  return (
    <Link
      to={to}
      className={`flex items-center gap-1.5 border-b-2 py-1 transition-colors ${
        active ? 'border-accent text-text' : 'border-transparent text-muted hover:text-text'
      }`}
    >
      {icon}
      <span className="hidden sm:inline">{children}</span>
    </Link>
  )
}

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
    <nav className="sticky top-0 z-40 flex items-center justify-between gap-4 border-b border-border bg-bg/80 px-4 py-3 text-sm backdrop-blur">
      <div className="flex items-center gap-5 overflow-x-auto">
        <Link to="/habitos" className="shrink-0 font-mono font-semibold text-text">
          loop
        </Link>
        <NavLink to="/habitos" icon={<ListIcon width={16} height={16} />}>
          Hábitos
        </NavLink>
        <NavLink to="/perfil" icon={<UserIcon width={16} height={16} />}>
          Minha conta
        </NavLink>
        {user.role === 'ADMIN' && (
          <>
            <NavLink to="/admin/usuarios" icon={<UsersIcon width={16} height={16} />}>
              Usuários
            </NavLink>
            <NavLink to="/admin/habitos" icon={<ListIcon width={16} height={16} />}>
              Todos hábitos
            </NavLink>
          </>
        )}
      </div>
      <button onClick={handleLogout} className="flex shrink-0 items-center gap-1.5 text-muted hover:text-text">
        <LogOutIcon width={16} height={16} />
        <span className="hidden sm:inline">Sair</span>
      </button>
    </nav>
  )
}
