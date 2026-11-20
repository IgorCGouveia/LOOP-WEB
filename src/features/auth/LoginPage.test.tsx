import { screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { http as mswHttp, HttpResponse } from 'msw'
import { Route } from 'react-router-dom'
import { describe, expect, it } from 'vitest'
import { LoginPage } from './LoginPage'
import { renderApp } from '../../test/render'
import { server } from '../../test/server'

// Regression for #4.
describe('LoginPage — erros acessíveis', () => {
  it('submit vazio leva o foco ao Email, marcado como inválido e ligado à mensagem', async () => {
    const user = userEvent.setup()
    renderApp(<Route path="/entrar" element={<LoginPage />} />, '/entrar')
    await user.click(screen.getByRole('button', { name: 'Entrar' }))

    const email = screen.getByLabelText('Email')
    expect(email).toHaveFocus()
    expect(email).toHaveAttribute('aria-invalid', 'true')
    expect(email).toHaveAccessibleDescription('Formato de email inválido.')
  })

  it('erro geral da API é anunciado como alerta', async () => {
    server.use(mswHttp.post('*/login', () => HttpResponse.json({ error: 'Credenciais inválidas' }, { status: 401 })))
    const user = userEvent.setup()
    renderApp(<Route path="/entrar" element={<LoginPage />} />, '/entrar')
    await user.type(screen.getByLabelText('Email'), 'ana@loop.dev')
    await user.type(screen.getByLabelText('Senha'), 'segredo123')
    await user.click(screen.getByRole('button', { name: 'Entrar' }))

    const message = await screen.findByText('Credenciais inválidas')
    expect(message).toHaveAttribute('role', 'alert')
  })
})
