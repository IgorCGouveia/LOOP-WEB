import { screen } from '@testing-library/react'
import { http as mswHttp, HttpResponse } from 'msw'
import { Route } from 'react-router-dom'
import { describe, expect, it } from 'vitest'
import { UserListPage } from './UserListPage'
import { AllHabitsPage } from './AllHabitsPage'
import { UserHabitsPage } from './UserHabitsPage'
import { envelope, login, renderApp } from '../../test/render'
import { server } from '../../test/server'

describe('telas admin', () => {
  it('erro na lista de usuários mostra retry e nenhum cabeçalho de tabela (#12)', async () => {
    login({ role: 'ADMIN' })
    server.use(mswHttp.get('*/users', () => HttpResponse.json({ error: 'boom' }, { status: 500 })))
    renderApp(<Route path="/admin/usuarios" element={<UserListPage />} />, '/admin/usuarios')
    expect(await screen.findByText('Não foi possível carregar os usuários')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Tentar de novo' })).toBeInTheDocument()
    expect(screen.queryByRole('table')).not.toBeInTheDocument()
  })

  it('listas vazias mostram EmptyState e nenhum cabeçalho de tabela (#24)', async () => {
    login({ role: 'ADMIN' })
    server.use(
      mswHttp.get('*/users', () => HttpResponse.json(envelope([]))),
      mswHttp.get('*/habits', () => HttpResponse.json(envelope([]))),
    )
    const { unmount } = renderApp(<Route path="/admin/usuarios" element={<UserListPage />} />, '/admin/usuarios')
    expect(await screen.findByText('Nenhum usuário')).toBeInTheDocument()
    expect(screen.queryByRole('table')).not.toBeInTheDocument()
    unmount()

    renderApp(<Route path="/admin/habitos" element={<AllHabitsPage />} />, '/admin/habitos')
    expect(await screen.findByText('Nenhum hábito cadastrado')).toBeInTheDocument()
    expect(screen.queryByRole('table')).not.toBeInTheDocument()
  })

  it('hábitos e check-ins vazios de um usuário usam EmptyState fora de <ul> (#24)', async () => {
    login({ role: 'ADMIN' })
    server.use(
      mswHttp.get('*/users/u9/habits', () => HttpResponse.json(envelope([]))),
      mswHttp.get('*/users/u9/checkins', () => HttpResponse.json(envelope([]))),
    )
    const { container } = renderApp(
      <Route path="/admin/usuarios/:userId" element={<UserHabitsPage />} />,
      '/admin/usuarios/u9',
    )
    expect(await screen.findByText('Sem hábitos')).toBeInTheDocument()
    expect(await screen.findByText('Nenhum check-in recente')).toBeInTheDocument()
    expect(container.querySelector('ul > p')).toBeNull()
  })
})
