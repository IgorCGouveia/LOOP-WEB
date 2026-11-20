import { screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { http as mswHttp, HttpResponse } from 'msw'
import { Route } from 'react-router-dom'
import { describe, expect, it } from 'vitest'
import { HabitFormPage } from './HabitFormPage'
import { envelope, login, renderApp } from '../../test/render'
import { server } from '../../test/server'
import { habit } from '../../test/fixtures'

const routes = (
  <>
    <Route path="/habitos/novo" element={<HabitFormPage />} />
    <Route path="/habitos/:id/editar" element={<HabitFormPage />} />
    <Route path="/habitos/:id" element={<p>detalhe</p>} />
    <Route path="/habitos" element={<p>lista</p>} />
  </>
)

describe('HabitFormPage', () => {
  it('em edição, erro ao carregar não mostra form nem permite PATCH (#15)', async () => {
    login()
    let patches = 0
    server.use(
      mswHttp.get('*/me/habits', () => HttpResponse.json({ error: 'boom' }, { status: 500 })),
      mswHttp.patch('*/habits/h1', () => {
        patches += 1
        return HttpResponse.json(envelope(habit()))
      }),
    )
    renderApp(routes, '/habitos/h1/editar')
    expect(await screen.findByText('Não foi possível carregar o hábito')).toBeInTheDocument()
    expect(screen.queryByRole('button', { name: 'Salvar' })).not.toBeInTheDocument()
    expect(patches).toBe(0)
  })

  it('apagar a descrição manda description: null no PATCH (#21)', async () => {
    login()
    let body: Record<string, unknown> | undefined
    server.use(
      mswHttp.get('*/me/habits', () => HttpResponse.json(envelope([habit()]))),
      mswHttp.patch('*/habits/h1', async ({ request }) => {
        body = (await request.json()) as Record<string, unknown>
        return HttpResponse.json(envelope(habit({ description: null })))
      }),
    )
    const user = userEvent.setup()
    renderApp(routes, '/habitos/h1/editar')
    await user.clear(await screen.findByLabelText('Descrição (opcional)'))
    await user.click(screen.getByRole('button', { name: 'Salvar' }))

    expect(await screen.findByText('detalhe')).toBeInTheDocument()
    expect(body).toHaveProperty('description', null)
  })

  it('a edição carrega a agenda real e os dias expõem aria-pressed num grupo nomeado (#19)', async () => {
    login()
    server.use(mswHttp.get('*/me/habits', () => HttpResponse.json(envelope([habit()]))))
    renderApp(routes, '/habitos/h1/editar')

    const group = await screen.findByRole('group', { name: 'Dias da semana' })
    const pressed = Array.from(group.querySelectorAll('[aria-pressed="true"]')).map((b) => b.textContent)
    expect(pressed).toEqual(['Seg', 'Qua'])
  })

  it('meta por dia vazia mostra erro no campo e foca nele (#18)', async () => {
    login()
    const user = userEvent.setup()
    renderApp(routes, '/habitos/novo')
    await user.type(screen.getByLabelText('Nome'), 'Correr')
    await user.clear(screen.getByLabelText('Meta por dia'))
    await user.click(screen.getByRole('button', { name: 'Salvar' }))

    const target = screen.getByLabelText('Meta por dia')
    expect(target).toHaveAttribute('aria-invalid', 'true')
    expect(target).toHaveAccessibleDescription('Informe um número maior que zero.')
    expect(target).toHaveFocus()
  })

  it('intervalo vazio mostra erro no campo (#18)', async () => {
    login()
    const user = userEvent.setup()
    renderApp(routes, '/habitos/novo')
    await user.type(screen.getByLabelText('Nome'), 'Correr')
    await user.selectOptions(screen.getByLabelText('Frequência'), 'INTERVAL')
    await user.clear(screen.getByLabelText('A cada quantos dias'))
    await user.click(screen.getByRole('button', { name: 'Salvar' }))

    expect(screen.getByLabelText('A cada quantos dias')).toHaveAccessibleDescription(
      'Informe um número maior que zero.',
    )
  })

  it('erro da API num campo de agenda aparece ao lado dele (#18)', async () => {
    login()
    server.use(
      mswHttp.post('*/habits', () =>
        HttpResponse.json(
          { error: 'Validação', details: [{ campo: 'schedule.targetPerDay', message: 'Meta alta demais.' }] },
          { status: 400 },
        ),
      ),
    )
    const user = userEvent.setup()
    renderApp(routes, '/habitos/novo')
    await user.type(screen.getByLabelText('Nome'), 'Correr')
    await user.click(screen.getByRole('button', { name: 'Salvar' }))

    expect(await screen.findByText('Meta alta demais.')).toBeInTheDocument()
    expect(screen.getByLabelText('Meta por dia')).toHaveAccessibleDescription('Meta alta demais.')
  })
})
