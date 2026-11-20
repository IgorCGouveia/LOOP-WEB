import { setupServer } from 'msw/node'

// Servidor MSW compartilhado. Cada teste registra os handlers de que precisa
// com server.use(...); setup.ts reseta tudo entre testes. Os paths usam o
// prefixo `*` pra casar independente do VITE_API_URL.
export const server = setupServer()
