import {
  cloneElement,
  isValidElement,
  useEffect,
  useId,
  useRef,
  type ComponentPropsWithRef,
  type InputHTMLAttributes,
  type ReactElement,
  type ReactNode,
  type SelectHTMLAttributes,
  type TextareaHTMLAttributes,
} from 'react'
import { useLocation } from 'react-router-dom'
import { ApiError } from '../api/envelope'
import { AlertIcon } from './icons'

// inline-flex na base: ícone + texto alinham sem `flex ...` no call site, e
// cada propriedade (display, padding) é definida por uma classe só (#16).
const base =
  'inline-flex items-center justify-center gap-2 rounded-md px-3 py-2 text-sm font-medium transition-colors disabled:cursor-not-allowed disabled:opacity-50'

// Texto escuro (--color-bg) sobre accent/danger: ~5.9:1 e ~7:1, e o hover só
// clareia o fundo, então o contraste sobe (#8, ADR-0005).
export const buttonVariants = {
  primary: `${base} bg-accent text-bg hover:bg-accent-hover`,
  secondary: `${base} border border-border bg-surface text-text hover:bg-surface-hover`,
  danger: `${base} text-danger hover:text-danger-hover underline decoration-danger/40 underline-offset-4`,
  dangerSolid: `${base} bg-danger text-bg hover:bg-danger-hover`,
  ghost: `${base} text-muted hover:text-text`,
  // ação em forma de link, com o mesmo padding das outras variantes — pra
  // parear com `danger` (ex. Editar | Deletar) sem desalinhar (#22)
  link: `${base} text-accent hover:text-accent-hover`,
  // link dentro de frase ou célula de tabela: sem padding de botão
  inlineLink: 'rounded-sm text-accent hover:text-accent-hover',
}

export type ButtonVariant = keyof typeof buttonVariants

export function Button({
  variant = 'primary',
  className = '',
  ...props
}: ComponentPropsWithRef<'button'> & { variant?: ButtonVariant }) {
  return <button className={`${buttonVariants[variant]} ${className}`} {...props} />
}

// Pra usar o mesmo visual de botão num <Link> (React Router) sem aninhar
// <button> dentro de <a>, que o HTML não permite de verdade.
export function linkButtonClass(variant: ButtonVariant = 'primary') {
  return buttonVariants[variant]
}

export function Card({ children, className = '' }: { children: ReactNode; className?: string }) {
  return (
    <div className={`rounded-lg border border-border bg-surface p-4 ${className}`}>{children}</div>
  )
}

// Larguras nomeadas: uma classe de max-width por página, escolhida por token,
// nunca por className concorrente (#16).
const pageWidths = {
  sm: 'max-w-sm', // 24rem — formulários curtos (perfil)
  md: 'max-w-lg', // 32rem — detalhe e formulário de hábito
  lg: 'max-w-2xl', // 42rem — listas (padrão)
  xl: 'max-w-3xl', // 48rem — tabelas admin
} as const

export function Page({ children, width = 'lg' }: { children: ReactNode; width?: keyof typeof pageWidths }) {
  return <main className={`mx-auto w-full ${pageWidths[width]} px-4 py-8`}>{children}</main>
}

// Cabeçalho de página: dono do estilo do h1 e do espaçamento abaixo dele (#25).
// O h1 recebe foco quando a página é aberta por navegação (não no primeiro
// carregamento da app), pra leitor de tela anunciar a troca de página (#9).
export function PageHeader({
  title,
  eyebrow,
  subtitle,
  actions,
}: {
  title: ReactNode
  eyebrow?: ReactNode
  subtitle?: ReactNode
  actions?: ReactNode
}) {
  const headingRef = useRef<HTMLHeadingElement>(null)
  const { key } = useLocation()

  useEffect(() => {
    // 'default' é a chave da entrada inicial do histórico: primeira carga.
    if (key !== 'default') headingRef.current?.focus()
  }, [key])

  return (
    <header className="mb-6 flex items-start justify-between gap-4">
      <div className="min-w-0">
        {eyebrow && <p className="font-mono text-xs text-muted">{eyebrow}</p>}
        <h1 ref={headingRef} tabIndex={-1} className="text-2xl font-semibold text-text focus:outline-none">
          {title}
        </h1>
        {subtitle && <div className="mt-1 flex flex-col gap-0.5 text-sm text-muted">{subtitle}</div>}
      </div>
      {actions && <div className="flex shrink-0 items-center gap-2">{actions}</div>}
    </header>
  )
}

const fieldClass =
  'w-full rounded-md border border-border-strong bg-bg px-3 py-2 text-sm text-text placeholder:text-muted aria-[invalid=true]:border-danger'

export function Input(props: InputHTMLAttributes<HTMLInputElement>) {
  return <input {...props} className={`${fieldClass} ${props.className ?? ''}`} />
}

export function Select(props: SelectHTMLAttributes<HTMLSelectElement>) {
  return <select {...props} className={`${fieldClass} ${props.className ?? ''}`} />
}

export function Textarea(props: TextareaHTMLAttributes<HTMLTextAreaElement>) {
  return <textarea {...props} className={`${fieldClass} ${props.className ?? ''}`} />
}

interface ControlA11yProps {
  id?: string
  'aria-invalid'?: boolean
  'aria-describedby'?: string
}

// Liga o controle ao rótulo e ao erro: id/htmlFor, aria-invalid e
// aria-describedby apontando pro texto do erro (#4). O filho precisa ser um
// único elemento de formulário (Input, Select, Textarea).
export function Field({
  label,
  error,
  children,
}: {
  label: string
  error?: string
  children: ReactElement<ControlA11yProps>
}) {
  const id = useId()
  const errorId = `${id}-error`
  const control = isValidElement(children)
    ? cloneElement(children, {
        id,
        'aria-invalid': error ? true : undefined,
        'aria-describedby': error ? errorId : undefined,
      })
    : children

  // O erro fica fora do <label>: dentro dele, viraria parte do nome do campo.
  return (
    <div className="flex flex-col gap-1">
      <label htmlFor={id} className="text-sm text-muted">
        {label}
      </label>
      {control}
      {error && <ErrorText id={errorId}>{error}</ErrorText>}
    </div>
  )
}

export function ErrorText({ children, id }: { children: ReactNode; id?: string }) {
  return (
    <span id={id} className="text-sm text-danger">
      {children}
    </span>
  )
}

// Erro que não pertence a um campo (erro geral da API, erro de check-in):
// role="alert" faz o leitor de tela anunciar sem precisar mover o foco (#4).
export function FormError({ children }: { children: ReactNode }) {
  return (
    <p role="alert" className="text-sm text-danger">
      {children}
    </p>
  )
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

export function PageSpinner({ label = 'Carregando...' }: { label?: string }) {
  return (
    <div role="status" className="flex min-h-[40vh] items-center justify-center">
      <div aria-hidden className="h-6 w-6 animate-spin rounded-full border-2 border-border border-t-accent" />
      <span className="sr-only">{label}</span>
    </div>
  )
}

export function Skeleton({ className = '' }: { className?: string }) {
  return <div aria-hidden className={`animate-pulse rounded-md bg-surface-hover ${className}`} />
}

// Agrupa skeletons num container que se declara ocupado e tem um rótulo de
// status, pra o estado de carregamento ser perceptível sem a animação (#6).
export function LoadingRegion({
  children,
  label = 'Carregando...',
  className = '',
}: {
  children: ReactNode
  label?: string
  className?: string
}) {
  return (
    <div aria-busy="true" className={className}>
      <span role="status" className="sr-only">
        {label}
      </span>
      {children}
    </div>
  )
}

// Ritmo único pra listas carregando: mesmo gap em todas, altura por tipo (#23).
const skeletonSizes = {
  line: 'h-4 w-32', // linhas de histórico
  row: 'h-10', // linhas de tabela
  card: 'h-16', // cards de lista
} as const

export function SkeletonList({
  rows = 3,
  size,
  label,
}: {
  rows?: number
  size: keyof typeof skeletonSizes
  label?: string
}) {
  return (
    <LoadingRegion label={label} className="flex flex-col gap-2">
      {Array.from({ length: rows }, (_, i) => (
        <Skeleton key={i} className={skeletonSizes[size]} />
      ))}
    </LoadingRegion>
  )
}

export function EmptyState({
  icon,
  title,
  description,
  action,
  role,
}: {
  icon?: ReactNode
  title: string
  description?: string
  action?: ReactNode
  role?: 'alert' | 'status'
}) {
  return (
    <div
      role={role}
      className="flex flex-col items-center gap-2 rounded-lg border border-dashed border-border px-6 py-12 text-center"
    >
      {icon && <div className="text-muted">{icon}</div>}
      <p className="text-sm font-medium text-text">{title}</p>
      {description && <p className="text-sm text-muted">{description}</p>}
      {action}
    </div>
  )
}

const COLD_START_HINT =
  'Verifique sua conexão e tente de novo — a API pode estar em cold start (free tier), pode levar até 1 minuto.'

// Estado de erro de query, com o mesmo vocabulário em toda tela (#12).
export function QueryError({
  title,
  error,
  onRetry,
}: {
  title: string
  error?: unknown
  onRetry: () => void
}) {
  // Erro com resposta 4xx traz uma mensagem útil da API; rede e 5xx caem na
  // dica de cold start.
  const description =
    error instanceof ApiError && error.status >= 400 && error.status < 500 ? error.message : COLD_START_HINT
  return (
    <EmptyState
      role="alert"
      icon={<AlertIcon width={28} height={28} />}
      title={title}
      description={description}
      action={
        <Button variant="secondary" className="mt-2" onClick={onRetry}>
          Tentar de novo
        </Button>
      }
    />
  )
}

export function Badge({ children }: { children: ReactNode }) {
  return (
    <span className="rounded border border-border bg-bg px-1.5 py-0.5 font-mono text-xs text-muted">
      {children}
    </span>
  )
}
