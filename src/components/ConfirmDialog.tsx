import { createContext, useCallback, useContext, useState, type ReactNode } from 'react'
import { Button } from './ui'

interface PendingConfirm {
  message: string
  resolve: (value: boolean) => void
}

type Confirm = (message: string) => Promise<boolean>

const ConfirmContext = createContext<Confirm | null>(null)

// Substitui o `confirm()` nativo do navegador (inconsistente entre SOs,
// não combina com o resto da UI) por um modal próprio, com a mesma API
// baseada em Promise pra não precisar reescrever cada callsite.
export function ConfirmProvider({ children }: { children: ReactNode }) {
  const [pending, setPending] = useState<PendingConfirm | null>(null)

  const confirm = useCallback<Confirm>((message) => {
    return new Promise<boolean>((resolve) => setPending({ message, resolve }))
  }, [])

  function settle(value: boolean) {
    pending?.resolve(value)
    setPending(null)
  }

  return (
    <ConfirmContext.Provider value={confirm}>
      {children}
      {pending && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm"
          onClick={() => settle(false)}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="w-full max-w-sm animate-[dialog-in_0.12s_ease-out] rounded-lg border border-border bg-surface p-5"
          >
            <p className="mb-5 text-sm text-text">{pending.message}</p>
            <div className="flex justify-end gap-2">
              <Button variant="secondary" onClick={() => settle(false)}>
                Cancelar
              </Button>
              <Button variant="dangerSolid" onClick={() => settle(true)} autoFocus>
                Confirmar
              </Button>
            </div>
          </div>
        </div>
      )}
    </ConfirmContext.Provider>
  )
}

export function useConfirm(): Confirm {
  const ctx = useContext(ConfirmContext)
  if (!ctx) throw new Error('useConfirm precisa estar dentro de <ConfirmProvider>')
  return ctx
}
