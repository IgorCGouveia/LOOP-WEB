import { screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { delay, http as mswHttp, HttpResponse } from 'msw'
import { Route } from 'react-router-dom'
import { describe, expect, it } from 'vitest'
import { HabitDetailPage } from './HabitDetailPage'
import { envelope, login, renderApp } from '../../test/render'
import { server } from '../../test/server'
import { checkinEvent, habit } from '../../test/fixtures'

const route = <Route path="/habitos/:id" element={<HabitDetailPage />} />

function result(currentStreak: number) {
  return envelope({
    checkin: checkinEvent({ id: 'x' }),
    currentStreak,
    longestStreak: 5,
    graceTokens: 1,
    todayProgress: { count: 1, target: 1 },
  })
}

describe('HabitDetailPage', () => {
  it('erro ao carregar mostra mensagem com retry, não skeleton eterno (#15)', async () => {
    login()
    server.use(
      mswHttp.get('*/me/habits', () => HttpResponse.json({ error: 'boom' }, { status: 500 })),
      mswHttp.get('*/habits/h1/checkins', () => HttpResponse.json(envelope([]))),
    )
    renderApp(route, '/habitos/h1')
    expect(await screen.findByText('Não foi possível carregar o hábito')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Tentar de novo' })).toBeInTheDocument()
  })

  it('id inexistente mostra "não encontrado" (#15)', async () => {
    login()
    server.use(
      mswHttp.get('*/me/habits', () => HttpResponse.json(envelope([]))),
      mswHttp.get('*/habits/h1/checkins', () => HttpResponse.json(envelope([]))),
    )
    renderApp(route, '/habitos/h1')
    expect(await screen.findByText('Hábito não encontrado')).toBeInTheDocument()
    expect(screen.getByRole('link', { name: 'Voltar pros hábitos' })).toHaveAttribute('href', '/habitos')
  })

  it('histórico dobra UNDO e mostra a data de calendário sem deslocar fuso (#14, #17)', async () => {
    login()
    server.use(
      mswHttp.get('*/me/habits', () => HttpResponse.json(envelope([habit()]))),
      mswHttp.get('*/habits/h1/checkins', () =>
        HttpResponse.json(
          envelope([
            checkinEvent({ id: 'a', date: '2026-11-18', checkedAt: '2026-11-18T22:00:00Z' }),
            checkinEvent({ id: 'b', date: '2026-11-19', checkedAt: '2026-11-19T10:00:00Z' }),
            checkinEvent({ id: 'c', date: '2026-11-19', kind: 'UNDO', checkedAt: '2026-11-19T10:01:00Z' }),
          ]),
        ),
      ),
    )
    renderApp(route, '/habitos/h1')
    expect(await screen.findByText('18/11/2026')).toBeInTheDocument()
    expect(screen.queryByText('19/11/2026')).not.toBeInTheDocument()
  })

  it('desfazer fica travado enquanto o check-in está em voo (#13, #27)', async () => {
    login()
    server.use(
      mswHttp.get('*/me/habits', () => HttpResponse.json(envelope([habit()]))),
      mswHttp.get('*/habits/h1/checkins', () => HttpResponse.json(envelope([]))),
      mswHttp.post('*/habits/h1/checkin', async () => {
        await delay(200)
        return HttpResponse.json(result(5))
      }),
    )
    const user = userEvent.setup()
    renderApp(route, '/habitos/h1')
    await user.click(await screen.findByRole('button', { name: /Check-in de hoje/ }))

    expect(screen.getByRole('button', { name: /Registrando/ })).toBeDisabled()
    expect(screen.getByRole('button', { name: /Desfazer último/ })).toBeDisabled()
    await waitFor(() => expect(screen.getByRole('button', { name: /Desfazer último/ })).toBeEnabled())
  })

  it('deletar trava o botão e manda um único DELETE (#13)', async () => {
    login()
    let deletes = 0
    server.use(
      mswHttp.get('*/me/habits', () => HttpResponse.json(envelope([habit()]))),
      mswHttp.get('*/habits/h1/checkins', () => HttpResponse.json(envelope([]))),
      mswHttp.delete('*/habits/h1', async () => {
        deletes += 1
        await delay(200)
        return HttpResponse.json(envelope(habit()))
      }),
    )
    const user = userEvent.setup()
    renderApp(
      <>
        {route}
        <Route path="/habitos" element={<p>lista de hábitos</p>} />
      </>,
      '/habitos/h1',
    )
    await user.click(await screen.findByRole('button', { name: /Deletar/ }))
    await user.click(screen.getByRole('button', { name: 'Confirmar' }))

    const button = screen.getByRole('button', { name: /Deletando/ })
    expect(button).toBeDisabled()
    await user.click(button)
    expect(await screen.findByText('lista de hábitos')).toBeInTheDocument()
    expect(deletes).toBe(1)
  })
})
