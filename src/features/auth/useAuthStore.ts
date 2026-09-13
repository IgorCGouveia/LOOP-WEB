import { create } from 'zustand'
import type { Role } from '../../api/types'

interface SessionUser {
  id: string
  name: string
  role: Role
}

type AuthStatus = 'checking' | 'authenticated' | 'guest'

interface AuthState {
  accessToken: string | null
  user: SessionUser | null
  status: AuthStatus
  setSession: (session: { accessToken: string; id: string; name: string; role: Role }) => void
  clearSession: () => void
  setStatus: (status: AuthStatus) => void
}

// accessToken só existe em memória (nunca localStorage — API-REFERENCE.md
// já descarta storage persistente por causa de XSS). Isso significa que um
// F5 zera este store; ver src/App.tsx pro boot silencioso via /refresh.
export const useAuthStore = create<AuthState>((set) => ({
  accessToken: null,
  user: null,
  status: 'checking',
  setSession: ({ accessToken, id, name, role }) =>
    set({ accessToken, user: { id, name, role }, status: 'authenticated' }),
  clearSession: () => set({ accessToken: null, user: null, status: 'guest' }),
  setStatus: (status) => set({ status }),
}))
