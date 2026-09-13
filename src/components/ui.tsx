import type { ButtonHTMLAttributes, InputHTMLAttributes, LabelHTMLAttributes, ReactNode, SelectHTMLAttributes, TextareaHTMLAttributes } from 'react'

const base =
  'rounded-md px-3 py-2 text-sm font-medium transition-colors disabled:cursor-not-allowed disabled:opacity-50'

export const buttonVariants = {
  primary: `${base} bg-accent text-white hover:bg-accent-hover inline-block`,
  secondary: `${base} border border-border bg-surface text-text hover:bg-surface-hover inline-block`,
  danger: `${base} text-danger hover:text-danger-hover underline decoration-danger/40 underline-offset-4`,
  ghost: `${base} text-muted hover:text-text`,
}

export function Button({
  variant = 'primary',
  className = '',
  ...props
}: ButtonHTMLAttributes<HTMLButtonElement> & { variant?: keyof typeof buttonVariants }) {
  return <button className={`${buttonVariants[variant]} ${className}`} {...props} />
}

// Pra usar o mesmo visual de botão num <Link> (React Router) sem aninhar
// <button> dentro de <a>, que o HTML não permite de verdade.
export function linkButtonClass(variant: keyof typeof buttonVariants = 'primary') {
  return buttonVariants[variant]
}

export function Card({ children, className = '' }: { children: ReactNode; className?: string }) {
  return (
    <div className={`rounded-lg border border-border bg-surface p-4 ${className}`}>{children}</div>
  )
}

export function Page({ children, className = '' }: { children: ReactNode; className?: string }) {
  return <div className={`mx-auto w-full max-w-2xl px-4 py-8 ${className}`}>{children}</div>
}

export function PageTitle({ children }: { children: ReactNode }) {
  return <h1 className="mb-6 text-2xl font-semibold text-text">{children}</h1>
}

const fieldClass =
  'w-full rounded-md border border-border bg-bg px-3 py-2 text-sm text-text placeholder:text-muted'

export function Input(props: InputHTMLAttributes<HTMLInputElement>) {
  return <input {...props} className={`${fieldClass} ${props.className ?? ''}`} />
}

export function Select(props: SelectHTMLAttributes<HTMLSelectElement>) {
  return <select {...props} className={`${fieldClass} ${props.className ?? ''}`} />
}

export function Textarea(props: TextareaHTMLAttributes<HTMLTextAreaElement>) {
  return <textarea {...props} className={`${fieldClass} ${props.className ?? ''}`} />
}

export function Label(props: LabelHTMLAttributes<HTMLLabelElement>) {
  return <label {...props} className={`flex flex-col gap-1 text-sm text-muted ${props.className ?? ''}`} />
}

export function Field({
  label,
  error,
  children,
}: {
  label: string
  error?: string
  children: ReactNode
}) {
  return (
    <Label>
      {label}
      {children}
      {error && <ErrorText>{error}</ErrorText>}
    </Label>
  )
}

export function ErrorText({ children }: { children: ReactNode }) {
  return <span className="text-sm text-danger">{children}</span>
}

export function SuccessText({ children }: { children: ReactNode }) {
  return <p className="text-sm text-success">{children}</p>
}

export function Stat({ label, value }: { label: string; value: number | string | undefined }) {
  return (
    <div className="rounded-md border border-border bg-bg px-2 py-3 text-center">
      <div className="font-mono text-lg font-semibold text-text">{value ?? '—'}</div>
      <div className="text-xs text-muted">{label}</div>
    </div>
  )
}

export function Badge({ children }: { children: ReactNode }) {
  return (
    <span className="rounded border border-border bg-bg px-1.5 py-0.5 font-mono text-xs text-muted">
      {children}
    </span>
  )
}
