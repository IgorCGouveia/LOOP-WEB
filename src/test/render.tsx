import { render } from '@testing-library/react'
import { QueryClientProvider } from '@tanstack/react-query'
import { MemoryRouter, Route, Routes } from 'react-router-dom'
import type { ReactNode } from 'react'
import { queryClient } from '../lib/queryClient'
import { ToastProvider } from '../components/Toast'
import { ConfirmProvider } from '../components/ConfirmDialog'
import { useAuthStore } from '../features/auth/useAuthStore'
import type { Role } from '../api/types'

export function login(user: { id?: string; name?: string; role?: Role; accessToken?: string } = {}) {
  useAuthStore.getState().setSession({
    accessToken: user.accessToken ?? 'token-a',
    id: user.id ?? 'u1',
    name: user.name ?? 'Ana',
    role: user.role ?? 'USER',
  })
}

// Renderiza com os mesmos providers do main.tsx e o QueryClient singleton,
// o mesmo que clearLocalSession() limpa.
export function renderApp(routes: ReactNode, initialPath: string) {
  return render(
    <QueryClientProvider client={queryClient}>
      <ToastProvider>
        <ConfirmProvider>
          <MemoryRouter initialEntries={[initialPath]}>
            <Routes>
              {routes}
              <Route path="/login" element={<p>tela de login</p>} />
            </Routes>
          </MemoryRouter>
        </ConfirmProvider>
      </ToastProvider>
    </QueryClientProvider>,
  )
}

export function envelope<T>(data: T) {
  return { message: 'ok', data }
}
