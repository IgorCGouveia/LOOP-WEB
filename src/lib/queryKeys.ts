import { useAuthStore } from '../features/auth/useAuthStore'

// Toda query cujo resultado depende de quem está logado leva o id do usuário
// da sessão na chave. Mesmo que o cache não fosse limpo numa troca silenciosa
// de identidade (setSession direto, sem logout), a sessão nova nunca reusaria
// as entradas da anterior. O prefixo comum ['session', uid] também deixa
// invalidar tudo de uma sessão com uma chave só.
export const queryKeys = {
  myHabits: (uid: string) => ['session', uid, 'habits'] as const,
  checkins: (uid: string, habitId: string) => ['session', uid, 'checkins', habitId] as const,
  adminUsers: (uid: string) => ['session', uid, 'admin', 'users'] as const,
  adminAllHabits: (uid: string) => ['session', uid, 'admin', 'habits'] as const,
  adminUserHabits: (uid: string, userId: string) => ['session', uid, 'admin', 'users', userId, 'habits'] as const,
  adminUserCheckins: (uid: string, userId: string) =>
    ['session', uid, 'admin', 'users', userId, 'checkins'] as const,
}

// As páginas que usam as chaves acima ficam atrás de ProtectedRoute/AdminRoute,
// então `user` existe sempre que elas renderizam.
export function useSessionUserId(): string {
  return useAuthStore((s) => s.user?.id ?? '')
}
