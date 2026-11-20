import { queryClient } from '../../lib/queryClient'
import { useAuthStore } from './useAuthStore'

// Único dono do fim de sessão no client: zera o store E o cache do TanStack
// Query. Sem o segundo passo, a próxima pessoa a logar na mesma aba via os
// hábitos da anterior até o refetch chegar (#3). Não chama a API — quem
// precisa do POST /logout usa useLogout(), que só chega aqui depois que ele
// deu certo (#5).
export function clearLocalSession() {
  useAuthStore.getState().clearSession()
  queryClient.clear()
}
