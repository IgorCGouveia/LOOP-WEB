import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it, vi } from 'vitest'
import { ConfirmProvider, useConfirm } from './ConfirmDialog'

function Harness({ onResult }: { onResult: (v: boolean) => void }) {
  const confirm = useConfirm()
  return (
    <button type="button" onClick={async () => onResult(await confirm('Deletar o hábito?'))}>
      Deletar
    </button>
  )
}

function setup() {
  const onResult = vi.fn()
  render(
    <ConfirmProvider>
      <Harness onResult={onResult} />
    </ConfirmProvider>,
  )
  return { onResult, user: userEvent.setup() }
}

// Regression for #2.
describe('ConfirmDialog', () => {
  it('é um alertdialog modal com a mensagem como descrição e foco inicial em Cancelar', async () => {
    const { user } = setup()
    await user.click(screen.getByRole('button', { name: 'Deletar' }))
    const dialog = screen.getByRole('alertdialog')
    expect(dialog).toHaveAttribute('aria-modal', 'true')
    expect(dialog).toHaveAccessibleDescription('Deletar o hábito?')
    expect(screen.getByRole('button', { name: 'Cancelar' })).toHaveFocus()
  })

  it('Tab fica preso entre os dois botões', async () => {
    const { user } = setup()
    await user.click(screen.getByRole('button', { name: 'Deletar' }))
    await user.tab()
    expect(screen.getByRole('button', { name: 'Confirmar' })).toHaveFocus()
    await user.tab()
    expect(screen.getByRole('button', { name: 'Cancelar' })).toHaveFocus()
    await user.tab({ shift: true })
    expect(screen.getByRole('button', { name: 'Confirmar' })).toHaveFocus()
  })

  it('Escape cancela e devolve o foco a quem abriu', async () => {
    const { user, onResult } = setup()
    const trigger = screen.getByRole('button', { name: 'Deletar' })
    await user.click(trigger)
    await user.keyboard('{Escape}')
    expect(screen.queryByRole('alertdialog')).not.toBeInTheDocument()
    expect(onResult).toHaveBeenCalledWith(false)
    expect(trigger).toHaveFocus()
  })

  it('Enter logo ao abrir não confirma (cai em Cancelar)', async () => {
    const { user, onResult } = setup()
    await user.click(screen.getByRole('button', { name: 'Deletar' }))
    await user.keyboard('{Enter}')
    expect(onResult).toHaveBeenCalledWith(false)
  })
})
