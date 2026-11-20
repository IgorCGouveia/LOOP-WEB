import { createContext, useCallback, useContext, useEffect, useId, useRef, useState, type ReactNode } from 'react'
import { Button } from './ui'

interface PendingConfirm {
  message: string
  resolve: (value: boolean) => void
  // quem tinha o foco quando o diálogo abriu; recebe o foco de volta ao fechar
  returnFocus: HTMLElement | null
}

type Confirm = (message: string) => Promise<boolean>

const ConfirmContext = createContext<Confirm | null>(null)

// Substitui o `confirm()` nativo do navegador (inconsistente entre SOs,
// não combina com o resto da UI) por um modal próprio, com a mesma API
// baseada em Promise pra não precisar reescrever cada callsite.
//
// Semântica de diálogo (#2): role="alertdialog" + aria-modal com nome e
// descrição, foco inicial em "Cancelar" (a escolha segura — um Enter perdido
// não apaga nada), Tab preso entre os botões, Escape cancela e o foco volta
// pro elemento que abriu o diálogo. Um div em vez de <dialog>.showModal()
// porque o jsdom dos testes não implementa showModal.
export function ConfirmProvider({ children }: { children: ReactNode }) {
  const [pending, setPending] = useState<PendingConfirm | null>(null)

  const confirm = useCallback<Confirm>((message) => {
    const returnFocus = document.activeElement instanceof HTMLElement ? document.activeElement : null
    return new Promise<boolean>((resolve) => setPending({ message, resolve, returnFocus }))
  }, [])

  const settle = useCallback(
    (value: boolean) => {
      if (!pending) return
      pending.resolve(value)
      setPending(null)
      pending.returnFocus?.focus()
    },
    [pending],
  )

  return (
    <ConfirmContext.Provider value={confirm}>
      {children}
      {pending && <ConfirmModal message={pending.message} onSettle={settle} />}
    </ConfirmContext.Provider>
  )
}

function ConfirmModal({ message, onSettle }: { message: string; onSettle: (value: boolean) => void }) {
  const titleId = useId()
  const messageId = useId()
  const dialogRef = useRef<HTMLDivElement>(null)
  const cancelRef = useRef<HTMLButtonElement>(null)

  useEffect(() => {
    cancelRef.current?.focus()
  }, [])

  function handleKeyDown(e: React.KeyboardEvent) {
    if (e.key === 'Escape') {
      e.preventDefault()
      onSettle(false)
      return
    }
    if (e.key !== 'Tab') return
    const focusables = dialogRef.current?.querySelectorAll<HTMLElement>('button:not([disabled])')
    if (!focusables?.length) return
    const first = focusables[0]
    const last = focusables[focusables.length - 1]
    if (e.shiftKey && document.activeElement === first) {
      e.preventDefault()
      last.focus()
    } else if (!e.shiftKey && document.activeElement === last) {
      e.preventDefault()
      first.focus()
    }
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm"
      onClick={() => onSettle(false)}
    >
      <div
        ref={dialogRef}
        role="alertdialog"
        aria-modal="true"
        aria-labelledby={titleId}
        aria-describedby={messageId}
        onKeyDown={handleKeyDown}
        onClick={(e) => e.stopPropagation()}
        className="w-full max-w-sm animate-[dialog-in_0.12s_ease-out] rounded-lg border border-border bg-surface p-5"
      >
        <h2 id={titleId} className="sr-only">
          Confirmar ação
        </h2>
        <p id={messageId} className="mb-5 text-sm text-text">
          {message}
        </p>
        <div className="flex justify-end gap-2">
          <Button ref={cancelRef} variant="secondary" onClick={() => onSettle(false)}>
            Cancelar
          </Button>
          <Button variant="dangerSolid" onClick={() => onSettle(true)}>
            Confirmar
          </Button>
        </div>
      </div>
    </div>
  )
}

export function useConfirm(): Confirm {
  const ctx = useContext(ConfirmContext)
  if (!ctx) throw new Error('useConfirm precisa estar dentro de <ConfirmProvider>')
  return ctx
}
