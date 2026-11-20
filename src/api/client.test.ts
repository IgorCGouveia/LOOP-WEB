import { http as mswHttp, HttpResponse } from 'msw'
import { describe, expect, it } from 'vitest'
import { server } from '../test/server'
import { envelope, login } from '../test/render'
import { useAuthStore } from '../features/auth/useAuthStore'
import { queryClient } from '../lib/queryClient'
import { bootstrapSession } from '../features/auth/bootstrap'
import { listCheckins, listMyHabits } from './habits'
import { ApiError } from './envelope'

const session = { accessToken: 'token-b', expiresIn: '15m', id: 'u1', name: 'Ana', role: 'USER' as const }

// Responde 401 até a requisição chegar com o token renovado.
function requireToken(token: string, data: unknown) {
  return ({ request }: { request: Request }) =>
    request.headers.get('Authorization') === `Bearer ${token}`
      ? HttpResponse.json(envelope(data))
      : HttpResponse.json({ error: 'Token expirado' }, { status: 401 })
}

describe('refresh compartilhado (#10)', () => {
  it('dois 401 paralelos disparam um único /refresh, mesmo com rotação de token', async () => {
    let refreshCalls = 0
    server.use(
      mswHttp.get('*/me/habits', requireToken('token-b', [])),
      mswHttp.get('*/habits/h1/checkins', requireToken('token-b', [])),
      // rotação com detecção de reuso: só o primeiro refresh vale
      mswHttp.post('*/refresh', () => {
        refreshCalls += 1
        return refreshCalls === 1
          ? HttpResponse.json(envelope(session))
          : HttpResponse.json({ error: 'Refresh reutilizado' }, { status: 401 })
      }),
    )
    login({ accessToken: 'token-a' })

    await expect(Promise.all([listMyHabits(), listCheckins('h1')])).resolves.toEqual([[], []])
    expect(refreshCalls).toBe(1)
    expect(useAuthStore.getState().status).toBe('authenticated')
    expect(useAuthStore.getState().accessToken).toBe('token-b')
  })

  it('o boot duplicado do StrictMode compartilha o mesmo /refresh', async () => {
    let refreshCalls = 0
    server.use(
      mswHttp.post('*/refresh', () => {
        refreshCalls += 1
        return refreshCalls === 1
          ? HttpResponse.json(envelope(session))
          : HttpResponse.json({ error: 'Refresh reutilizado' }, { status: 401 })
      }),
    )
    await Promise.all([bootstrapSession(), bootstrapSession()])
    expect(refreshCalls).toBe(1)
    expect(useAuthStore.getState().status).toBe('authenticated')
  })
})

describe('falha de refresh: transitória x credencial recusada (#11)', () => {
  it('boot com /refresh fora do ar (rede) fica em "unreachable", não "guest"', async () => {
    server.use(mswHttp.post('*/refresh', () => HttpResponse.error()))
    await bootstrapSession()
    expect(useAuthStore.getState().status).toBe('unreachable')
  })

  it('boot com /refresh em 503 fica em "unreachable"', async () => {
    server.use(mswHttp.post('*/refresh', () => HttpResponse.json({ error: 'cold start' }, { status: 503 })))
    await bootstrapSession()
    expect(useAuthStore.getState().status).toBe('unreachable')
  })

  it('boot com /refresh em 401 vira "guest"', async () => {
    server.use(mswHttp.post('*/refresh', () => HttpResponse.json({ error: 'sem sessão' }, { status: 401 })))
    await bootstrapSession()
    expect(useAuthStore.getState().status).toBe('guest')
  })

  it('no meio da sessão, refresh com erro de rede mantém a sessão e repassa o erro', async () => {
    server.use(
      mswHttp.get('*/me/habits', () => HttpResponse.json({ error: 'expirado' }, { status: 401 })),
      mswHttp.post('*/refresh', () => HttpResponse.error()),
    )
    login({ accessToken: 'token-a' })
    await expect(listMyHabits()).rejects.not.toBeInstanceOf(ApiError)
    expect(useAuthStore.getState().status).toBe('authenticated')
    expect(useAuthStore.getState().accessToken).toBe('token-a')
  })

  it('no meio da sessão, refresh recusado encerra a sessão e limpa o cache (#3)', async () => {
    server.use(
      mswHttp.get('*/me/habits', () => HttpResponse.json({ error: 'expirado' }, { status: 401 })),
      mswHttp.post('*/refresh', () => HttpResponse.json({ error: 'revogado' }, { status: 401 })),
    )
    login({ accessToken: 'token-a' })
    queryClient.setQueryData(['session', 'u1', 'habits'], [{ id: 'h1' }])

    await expect(listMyHabits()).rejects.toMatchObject({ status: 401, message: 'Sessão expirada.' })
    expect(useAuthStore.getState().status).toBe('guest')
    expect(queryClient.getQueryCache().getAll()).toHaveLength(0)
  })
})

describe('401 sem sessão', () => {
  it('não tenta refresh e devolve o erro da própria API (ex. senha errada no login)', async () => {
    let refreshCalls = 0
    server.use(
      mswHttp.post('*/login', () => HttpResponse.json({ error: 'Credenciais inválidas' }, { status: 401 })),
      mswHttp.post('*/refresh', () => {
        refreshCalls += 1
        return HttpResponse.json({ error: 'sem sessão' }, { status: 401 })
      }),
    )
    const { login: loginRequest } = await import('./auth')
    await expect(loginRequest({ email: 'a@b.com', password: 'x' })).rejects.toMatchObject({
      status: 401,
      message: 'Credenciais inválidas',
    })
    expect(refreshCalls).toBe(0)
  })
})
