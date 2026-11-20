import { act, render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { ToastProvider, useToast } from './Toast'

function Harness() {
  const toast = useToast()
  return (
    <>
      <button type="button" onClick={() => toast('Check-in registrado.')}>
        ok
      </button>
      <button type="button" onClick={() => toast('Erro ao deletar hábito.', 'error')}>
        falha
      </button>
    </>
  )
}

// Regression for #7.
describe('Toast', () => {
  beforeEach(() => vi.useFakeTimers({ shouldAdvanceTime: true }))
  afterEach(() => vi.useRealTimers())

  it('sucesso entra numa região polite e erro numa região de alerta', async () => {
    const user = userEvent.setup({ advanceTimers: vi.advanceTimersByTime })
    render(
      <ToastProvider>
        <Harness />
      </ToastProvider>,
    )
    await user.click(screen.getByRole('button', { name: 'ok' }))
    await user.click(screen.getByRole('button', { name: 'falha' }))
    expect(screen.getByRole('status')).toHaveTextContent('Check-in registrado.')
    expect(screen.getByRole('status')).toHaveAttribute('aria-live', 'polite')
    expect(screen.getByRole('alert')).toHaveTextContent('Erro ao deletar hábito.')
  })

  it('fica visível enquanto o mouse está em cima e pode ser fechado', async () => {
    const user = userEvent.setup({ advanceTimers: vi.advanceTimersByTime })
    render(
      <ToastProvider>
        <Harness />
      </ToastProvider>,
    )
    await user.click(screen.getByRole('button', { name: 'ok' }))
    await user.hover(screen.getByText('Check-in registrado.'))
    act(() => vi.advanceTimersByTime(20000))
    expect(screen.getByText('Check-in registrado.')).toBeInTheDocument()

    await user.unhover(screen.getByText('Check-in registrado.'))
    act(() => vi.advanceTimersByTime(20000))
    expect(screen.queryByText('Check-in registrado.')).not.toBeInTheDocument()

    await user.click(screen.getByRole('button', { name: 'falha' }))
    await user.click(screen.getByRole('button', { name: 'Fechar notificação' }))
    expect(screen.queryByText('Erro ao deletar hábito.')).not.toBeInTheDocument()
  })
})
