// Registers jest-dom matchers (toBeInTheDocument, toHaveAttribute, ...) on Vitest's expect.
// Testing Library cleans up the DOM after each test on its own, since `globals: true` exposes afterEach.
import '@testing-library/jest-dom/vitest'
import { afterAll, afterEach, beforeAll } from 'vitest'
import { server } from './server'
import { queryClient } from '../lib/queryClient'
import { useAuthStore } from '../features/auth/useAuthStore'

// Sem retries nos testes: um erro de query aparece na hora, não depois de 3 tentativas.
queryClient.setDefaultOptions({ queries: { retry: false } })

beforeAll(() => server.listen({ onUnhandledRequest: 'error' }))
afterEach(() => {
  server.resetHandlers()
  queryClient.clear()
  useAuthStore.setState({ accessToken: null, user: null, status: 'checking' })
})
afterAll(() => server.close())
