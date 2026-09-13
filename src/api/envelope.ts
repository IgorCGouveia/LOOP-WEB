// Unwrap único pro envelope da API: sucesso é sempre { message, data },
// erro sempre tem `error` (mais `details` no caso do 400 de validação Zod,
// que carrega um `campo` vazio quando o problema é de nível de objeto —
// ver SPEC.md, "caso especial confirmado no código").
export interface SuccessEnvelope<T> {
  message: string
  data: T
}

export interface FieldIssue {
  campo: string
  message: string
}

export interface ErrorEnvelope {
  error: string
  details?: FieldIssue[]
  statusCode?: number
  reqId?: string
}

export class ApiError extends Error {
  status: number
  details?: FieldIssue[]
  reqId?: string

  constructor(status: number, body: ErrorEnvelope) {
    super(body.error)
    this.status = status
    this.details = body.details
    this.reqId = body.reqId
  }

  fieldMessage(campo: string): string | undefined {
    return this.details?.find((d) => d.campo === campo)?.message
  }

  // erro de refine no objeto inteiro (sem path) — Zod gera `campo: ""`
  generalMessage(): string | undefined {
    return this.details?.find((d) => d.campo === '')?.message
  }
}
