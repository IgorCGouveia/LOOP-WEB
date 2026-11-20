import { screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { http as mswHttp, HttpResponse } from 'msw'
import { Route } from 'react-router-dom'
import { describe, expect, it } from 'vitest'
import { Nav } from '../../routes/Nav'
import { envelope, login, renderApp } from '../../test/render'
import { server } from '../../test/server'
import { queryClient } from '../../lib/queryClient'
import { useAuthStore } from './useAuthStore'

const route = <Route path="/habitos" element={<Nav />} />

describe('logout', () => {
  it('sucesso limpa sessão e cache e vai pro login (#3)', async () => {
    login()
    queryClient.setQueryData(['session', 'u1', 'habits'], [{ id: 'h1', name: 'Hábito da Ana' }])
    server.use(mswHttp.post('*/logout', () => HttpResponse.json(envelope(null))))
    const user = userEvent.setup()
    renderApp(route, '/habitos')
    await user.click(screen.getByRole('button', { name: 'Sair' }))

    expect(await screen.findByText('tela de login')).toBeInTheDocument()
    expect(useAuthStore.getState().status).toBe('guest')
    expect(queryClient.getQueryCache().getAll()).toHaveLength(0)
  })

  it('falha de rede mantém a sessão, avisa e oferece retry (#5)', async () => {
    login()
    let attempts = 0
    server.use(
      mswHttp.post('*/logout', () => {
        attempts += 1
        return attempts === 1 ? HttpResponse.error() : HttpResponse.json(envelope(null))
      }),
    )
    const user = userEvent.setup()
    renderApp(route, '/habitos')
    await user.click(screen.getByRole('button', { name: 'Sair' }))

    expect(await screen.findByText('Não foi possível sair. Sua sessão continua ativa.')).toBeInTheDocument()
    expect(screen.queryByText('tela de login')).not.toBeInTheDocument()
    expect(useAuthStore.getState().status).toBe('authenticated')

    await user.click(screen.getByRole('button', { name: 'Tentar de novo' }))
    expect(await screen.findByText('tela de login')).toBeInTheDocument()
    expect(attempts).toBe(2)
  })
})
