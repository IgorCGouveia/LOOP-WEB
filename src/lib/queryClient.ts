import { QueryClient } from '@tanstack/react-query'

// Uma instância só, compartilhada entre o <QueryClientProvider> (main.tsx) e o
// fim de sessão (features/auth/session.ts), que precisa limpar o cache fora do
// React — por exemplo no interceptor do Axios quando o refresh é rejeitado.
export const queryClient = new QueryClient()
