import { screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { http as mswHttp, HttpResponse } from 'msw'
import { Route } from 'react-router-dom'
import { describe, expect, it } from 'vitest'
import { ProfilePage } from './ProfilePage'
import { envelope, login, renderApp } from '../../test/render'
import { server } from '../../test/server'

const route = <Route path="/perfil" element={<ProfilePage />} />

describe('ProfilePage', () => {
  it('o nome novo aparece no cabeçalho sem /refresh (#26)', async () => {
    login({ name: 'Ana' })
    server.use(
      mswHttp.patch('*/users/u1', () =>
        HttpResponse.json(envelope({ id: 'u1', email: 'a@loop.dev', name: 'Novo Nome', role: 'USER' })),
      ),
    )
    const user = userEvent.setup()
    renderApp(route, '/perfil')
    await user.type(screen.getByLabelText('Nome (deixe em branco pra manter)'), 'Novo Nome')
    await user.click(screen.getByRole('button', { name: 'Salvar alterações' }))

    expect(await screen.findByText('Novo Nome', { selector: 'p' })).toBeInTheDocument()
  })

  it('submit com tudo em branco mostra uma mensagem (#20)', async () => {
    login()
    const user = userEvent.setup()
    renderApp(route, '/perfil')
    await user.click(screen.getByRole('button', { name: 'Salvar alterações' }))
    expect(screen.getByText('Preencha ao menos um campo para atualizar.')).toHaveAttribute('role', 'alert')
  })

  it('falha ao deletar a conta mostra toast de erro e mantém na página (#20)', async () => {
    login()
    server.use(mswHttp.delete('*/users/u1', () => HttpResponse.json({ error: 'Erro interno' }, { status: 500 })))
    const user = userEvent.setup()
    renderApp(route, '/perfil')
    await user.click(screen.getByRole('button', { name: 'Deletar minha conta' }))
    await user.click(screen.getByRole('button', { name: 'Confirmar' }))

    expect(await screen.findByText('Erro interno')).toBeInTheDocument()
    expect(screen.getByRole('heading', { name: 'Minha conta' })).toBeInTheDocument()
  })
})
