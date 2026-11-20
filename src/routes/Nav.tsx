import { Link, NavLink, useNavigate } from 'react-router-dom'
import type { ReactNode } from 'react'
import { useAuthStore } from '../features/auth/useAuthStore'
import { logout } from '../api/auth'
import { LogOutIcon, ListIcon, UserIcon, UsersIcon } from '../components/icons'

// Below `sm` the label is visually hidden but kept in the accessibility tree,
// so the link's accessible name is always the same text sighted users see.
const responsiveLabel = 'sr-only sm:not-sr-only'

function NavItem({ to, end, children, icon }: { to: string; end?: boolean; children: ReactNode; icon: ReactNode }) {
  // NavLink sets aria-current="page" from the same match that drives the styling,
  // so the visual and the announced active state cannot drift apart.
  return (
    <NavLink
      to={to}
      end={end}
      className={({ isActive }) =>
        `flex items-center gap-1.5 border-b-2 py-1 transition-colors ${
          isActive ? 'border-accent text-text' : 'border-transparent text-muted hover:text-text'
        }`
      }
    >
      {icon}
      <span className={responsiveLabel}>{children}</span>
    </NavLink>
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
        {/* `end`: keeps today's behavior where "Hábitos" is active only on the list itself. */}
        <NavItem to="/habitos" end icon={<ListIcon width={16} height={16} />}>
          Hábitos
        </NavItem>
        <NavItem to="/perfil" icon={<UserIcon width={16} height={16} />}>
          Minha conta
        </NavItem>
        {user.role === 'ADMIN' && (
          <>
            <NavItem to="/admin/usuarios" icon={<UsersIcon width={16} height={16} />}>
              Usuários
            </NavItem>
            <NavItem to="/admin/habitos" icon={<ListIcon width={16} height={16} />}>
              Todos hábitos
            </NavItem>
          </>
        )}
      </div>
      <button
        type="button"
        onClick={handleLogout}
        className="flex shrink-0 items-center gap-1.5 text-muted hover:text-text"
      >
        <LogOutIcon width={16} height={16} />
        <span className={responsiveLabel}>Sair</span>
      </button>
    </nav>
  )
}
