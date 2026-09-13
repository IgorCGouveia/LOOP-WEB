import { createContext, useCallback, useContext, useMemo, useState, type ReactNode } from 'react'
import { CheckIcon, AlertIcon } from './icons'

interface ToastItem {
  id: number
  message: string
  variant: 'success' | 'error'
}

type PushToast = (message: string, variant?: ToastItem['variant']) => void

const ToastContext = createContext<PushToast | null>(null)

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<ToastItem[]>([])

  const push = useCallback<PushToast>((message, variant = 'success') => {
    const id = Date.now() + Math.random()
    setToasts((t) => [...t, { id, message, variant }])
    setTimeout(() => setToasts((t) => t.filter((x) => x.id !== id)), 3000)
  }, [])

  const value = useMemo(() => push, [push])

  return (
    <ToastContext.Provider value={value}>
      {children}
      <div className="pointer-events-none fixed inset-x-0 bottom-4 z-50 flex flex-col items-center gap-2 px-4">
        {toasts.map((t) => (
          <div
            key={t.id}
            className={`pointer-events-auto flex items-center gap-2 rounded-md border px-3 py-2 text-sm shadow-lg animate-[toast-in_0.15s_ease-out] ${
              t.variant === 'success'
                ? 'border-success/30 bg-surface text-text'
                : 'border-danger/30 bg-surface text-text'
            }`}
          >
            {t.variant === 'success' ? (
              <CheckIcon className="shrink-0 text-success" width={16} height={16} />
            ) : (
              <AlertIcon className="shrink-0 text-danger" width={16} height={16} />
            )}
            {t.message}
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  )
}

export function useToast(): PushToast {
  const ctx = useContext(ToastContext)
  if (!ctx) throw new Error('useToast precisa estar dentro de <ToastProvider>')
  return ctx
}
