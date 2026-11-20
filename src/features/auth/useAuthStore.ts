import { create } from 'zustand'
import type { Role } from '../../api/types'

export interface SessionUser {
  id: string
  name: string
  role: Role
}

// - checking: ainda não sabemos (boot, aguardando /refresh)
// - authenticated / guest: sessão confirmada ou recusada pelo servidor
// - unreachable: o /refresh do boot falhou por rede, timeout ou 5xx. A sessão
//   pode muito bem existir (cookie válido), então não mandamos pro login —
//   as rotas protegidas mostram "API indisponível" com um retry (#11).
export type AuthStatus = 'checking' | 'authenticated' | 'guest' | 'unreachable'

interface AuthState {
  accessToken: string | null
  user: SessionUser | null
  status: AuthStatus
  setSession: (session: { accessToken: string; id: string; name: string; role: Role }) => void
  updateUser: (patch: Partial<Pick<SessionUser, 'name'>>) => void
  clearSession: () => void
  setStatus: (status: AuthStatus) => void
}

// accessToken só existe em memória (nunca localStorage — API-REFERENCE.md
// já descarta storage persistente por causa de XSS). Isso significa que um
// F5 zera este store; ver src/features/auth/bootstrap.ts pro boot silencioso
// via /refresh.
export const useAuthStore = create<AuthState>((set) => ({
  accessToken: null,
  user: null,
  status: 'checking',
  setSession: ({ accessToken, id, name, role }) =>
    set({ accessToken, user: { id, name, role }, status: 'authenticated' }),
  // Atualiza só os dados exibidos do usuário (ex. depois do PATCH de perfil),
  // sem tocar no token (#26).
  updateUser: (patch) => set((s) => (s.user ? { user: { ...s.user, ...patch } } : {})),
  clearSession: () => set({ accessToken: null, user: null, status: 'guest' }),
  setStatus: (status) => set({ status }),
}))
