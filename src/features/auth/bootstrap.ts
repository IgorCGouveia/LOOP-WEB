import { isAuthRejection } from '../../api/client'
import { refresh } from '../../api/auth'
import { useAuthStore } from './useAuthStore'

// Boot da sessão: o accessToken só vive em memória, então um F5 zera o store.
// O cookie httpOnly de refresh sobrevive — tentamos /refresh antes de decidir.
//
// - sucesso: refreshSession() já gravou a sessão ('authenticated')
// - 401/403: refreshSession() já limpou ('guest') → login
// - rede/timeout/5xx: 'unreachable'. O cookie pode estar válido, então não
//   mandamos pro login; as rotas protegidas oferecem "Tentar de novo" (#11).
export function bootstrapSession(): Promise<void> {
  useAuthStore.getState().setStatus('checking')
  return refresh().then(
    () => undefined,
    (err: unknown) => {
      if (!isAuthRejection(err)) useAuthStore.getState().setStatus('unreachable')
    },
  )
}
