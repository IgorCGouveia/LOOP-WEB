import { screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { http as mswHttp, HttpResponse } from 'msw'
import { Link, Route } from 'react-router-dom'
import { describe, expect, it } from 'vitest'
import { ProtectedRoute } from './ProtectedRoute'
import { HabitListPage } from '../features/habits/HabitListPage'
import { ProfilePage } from '../features/profile/ProfilePage'
import { envelope, login, renderApp } from '../test/render'
import { server } from '../test/server'
import { useAuthStore } from '../features/auth/useAuthStore'

describe('troca de rota (#9)', () => {
  it('atualiza o título e leva o foco ao h1 da nova página', async () => {
    login()
    server.use(mswHttp.get('*/me/habits', () => HttpResponse.json(envelope([]))))
    const user = userEvent.setup()
    renderApp(
      <>
        <Route
          path="/habitos"
          element={
            <>
              <Link to="/perfil">ir pro perfil</Link>
              <HabitListPage />
            </>
          }
        />
        <Route path="/perfil" element={<ProfilePage />} />
      </>,
      '/habitos',
    )
    expect(document.title).toBe('Meus hábitos · LOOP')
    // primeira carga: o foco não é roubado
    expect(screen.getByRole('heading', { level: 1 })).not.toHaveFocus()

    await user.click(screen.getByRole('link', { name: 'ir pro perfil' }))
    expect(document.title).toBe('Minha conta · LOOP')
    expect(screen.getByRole('heading', { level: 1, name: 'Minha conta' })).toHaveFocus()
  })
})

describe('API indisponível no boot (#11)', () => {
  it('rota protegida mostra retry em vez de mandar pro login', async () => {
    useAuthStore.setState({ status: 'unreachable' })
    let refreshCalls = 0
    server.use(
      mswHttp.post('*/refresh', () => {
        refreshCalls += 1
        return HttpResponse.json(
          envelope({ accessToken: 't', expiresIn: '15m', id: 'u1', name: 'Ana', role: 'USER' }),
        )
      }),
      mswHttp.get('*/me/habits', () => HttpResponse.json(envelope([]))),
    )
    const user = userEvent.setup()
    renderApp(
      <Route element={<ProtectedRoute />}>
        <Route path="/habitos" element={<HabitListPage />} />
      </Route>,
      '/habitos',
    )
    expect(screen.getByText('Não foi possível falar com a API')).toBeInTheDocument()
    expect(screen.queryByText('tela de login')).not.toBeInTheDocument()

    await user.click(screen.getByRole('button', { name: 'Tentar de novo' }))
    expect(await screen.findByRole('heading', { name: 'Meus hábitos' })).toBeInTheDocument()
    expect(refreshCalls).toBe(1)
  })
})
