import type { z } from 'zod'
import { ApiError } from '../api/envelope'

export type FieldErrors = Record<string, string>

export function zodFieldErrors(error: z.ZodError): FieldErrors {
  const fields: FieldErrors = {}
  for (const issue of error.issues) {
    const key = issue.path.join('.')
    if (!fields[key]) fields[key] = issue.message
  }
  return fields
}

// Espelha o merge de `campo`/`details` do errorHandler da API — um `campo`
// vazio (refine de objeto inteiro, ex. confirmPassword) cai na chave "".
export function apiFieldErrors(error: unknown): { fields: FieldErrors; general?: string } {
  if (!(error instanceof ApiError)) {
    return { fields: {}, general: error instanceof Error ? error.message : 'Erro inesperado.' }
  }
  if (!error.details) return { fields: {}, general: error.message }
  const fields: FieldErrors = {}
  let general: string | undefined
  for (const issue of error.details) {
    if (issue.campo === '') general = issue.message
    else fields[issue.campo] = issue.message
  }
  return { fields, general }
}

// Rede de segurança: erro de campo que nenhum <Field> da tela renderiza vira
// mensagem geral, pra nenhuma falha de validação ficar muda (#18).
export function unmatchedFieldMessage(fields: FieldErrors, renderedKeys: readonly string[]): string | undefined {
  const extra = Object.entries(fields).filter(([key]) => !renderedKeys.includes(key))
  if (extra.length === 0) return undefined
  return extra.map(([, message]) => message).join(' ')
}
