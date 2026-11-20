import { createContext, useCallback, useContext, useEffect, useRef, useState, type ReactNode } from 'react'
import { CheckIcon, AlertIcon } from './icons'

type ToastVariant = 'success' | 'error'

interface ToastAction {
  label: string
  onClick: () => void
}

interface ToastItem {
  id: number
  message: string
  variant: ToastVariant
  action?: ToastAction
}

type PushToast = (message: string, variant?: ToastVariant, options?: { action?: ToastAction }) => void

const ToastContext = createContext<PushToast | null>(null)

// Tempo mínimo na tela; textos longos ganham mais (~60ms por caractere) e
// erros ficam mais tempo que sucessos. Hover ou foco pausam a contagem (#7).
function durationFor(item: ToastItem) {
  const base = item.variant === 'error' ? 8000 : 5000
  return Math.max(base, item.message.length * 60)
}

let nextId = 0

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<ToastItem[]>([])

  const dismiss = useCallback((id: number) => setToasts((t) => t.filter((x) => x.id !== id)), [])

  const push = useCallback<PushToast>((message, variant = 'success', options) => {
    setToasts((t) => [...t, { id: ++nextId, message, variant, action: options?.action }])
  }, [])

  // As duas regiões ficam sempre montadas: leitor de tela só anuncia conteúdo
  // inserido numa live region que já existia. Sucesso é educado (status),
  // erro interrompe (alert).
  return (
    <ToastContext.Provider value={push}>
      {children}
      <div className="pointer-events-none fixed inset-x-0 bottom-4 z-50 flex flex-col items-center gap-2 px-4">
        <div role="status" aria-live="polite" className="flex flex-col items-center gap-2">
          {toasts
            .filter((t) => t.variant === 'success')
            .map((t) => (
              <Toast key={t.id} item={t} onDismiss={dismiss} />
            ))}
        </div>
        <div role="alert" aria-live="assertive" className="flex flex-col items-center gap-2">
          {toasts
            .filter((t) => t.variant === 'error')
            .map((t) => (
              <Toast key={t.id} item={t} onDismiss={dismiss} />
            ))}
        </div>
      </div>
    </ToastContext.Provider>
  )
}

function Toast({ item, onDismiss }: { item: ToastItem; onDismiss: (id: number) => void }) {
  const [hovered, setHovered] = useState(false)
  const [focused, setFocused] = useState(false)
  const remaining = useRef(durationFor(item))
  const paused = hovered || focused

  useEffect(() => {
    if (paused) return
    const startedAt = Date.now()
    const timer = setTimeout(() => onDismiss(item.id), remaining.current)
    return () => {
      clearTimeout(timer)
      remaining.current -= Date.now() - startedAt
    }
  }, [paused, item.id, onDismiss])

  return (
    <div
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      onFocus={() => setFocused(true)}
      onBlur={(e) => {
        if (!e.currentTarget.contains(e.relatedTarget)) setFocused(false)
      }}
      className={`pointer-events-auto flex items-center gap-2 rounded-md border bg-surface py-2 pl-3 pr-1 text-sm text-text shadow-lg animate-[toast-in_0.15s_ease-out] ${
        item.variant === 'success' ? 'border-success/30' : 'border-danger/30'
      }`}
    >
      {item.variant === 'success' ? (
        <CheckIcon className="shrink-0 text-success" width={16} height={16} />
      ) : (
        <AlertIcon className="shrink-0 text-danger" width={16} height={16} />
      )}
      <span>{item.message}</span>
      {item.action && (
        <button
          type="button"
          onClick={() => {
            onDismiss(item.id)
            item.action?.onClick()
          }}
          className="rounded px-2 py-1 font-medium text-accent hover:text-accent-hover"
        >
          {item.action.label}
        </button>
      )}
      <button
        type="button"
        onClick={() => onDismiss(item.id)}
        aria-label="Fechar notificação"
        className="rounded px-2 py-1 text-muted hover:text-text"
      >
        <span aria-hidden>×</span>
      </button>
    </div>
  )
}

export function useToast(): PushToast {
  const ctx = useContext(ToastContext)
  if (!ctx) throw new Error('useToast precisa estar dentro de <ToastProvider>')
  return ctx
}
