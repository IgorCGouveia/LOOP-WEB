import { z } from 'zod'

// Espelha src/schema/habitVal.ts e src/schema/userVal.ts do repo da API
// (projt) — mesma versão do Zod (v4), mesmas regras. Validar no client é
// só UX (feedback antes do round-trip); o errorHandler do servidor
// continua sendo a fonte de verdade final. Ver SPEC.md.

const IANA_TIMEZONES = new Set(Intl.supportedValuesOf('timeZone'))

export const LoginVal = z.object({
  email: z.email({ message: 'Formato de email inválido.' }),
  password: z.string().min(1, 'Senha é obrigatória.'),
})
export type LoginInput = z.infer<typeof LoginVal>

export const CreateUserVal = z
  .object({
    name: z.string().min(3, 'Nome é obrigatório').max(50, 'Máximo 50 caracteres'),
    email: z.email({ message: 'Formato de email inválido.' }),
    password: z.string().min(8, 'Mínimo 8 caracteres').max(128),
    confirmPassword: z.string().min(8),
    timezone: z.string().refine((tz) => IANA_TIMEZONES.has(tz), {
      message: "Timezone inválido. Use um identificador IANA (ex: 'America/Sao_Paulo').",
    }),
  })
  .refine((data) => data.confirmPassword === data.password, {
    message: 'As senhas não coincidem',
    path: ['confirmPassword'],
  })
export type CreateUserInput = z.infer<typeof CreateUserVal>

// PATCH /users/:id — sem `timezone` (SPEC.md: exposto só como leitura na
// UI, nunca editável, por causa do efeito sobre dias já fechados).
export const UpdateUserVal = z
  .object({
    name: z.string().min(3).max(50).optional(),
    email: z.email({ message: 'Formato de email inválido.' }).optional(),
    password: z.string().min(8).max(128).optional(),
    confirmPassword: z.string().min(8).optional(),
  })
  .refine((data) => !data.password || data.password === data.confirmPassword, {
    message: 'As senhas não coincidem',
    path: ['confirmPassword'],
  })
export type UpdateUserInput = z.infer<typeof UpdateUserVal>

export const ScheduleVal = z.discriminatedUnion('type', [
  z.object({ type: z.literal('DAILY'), targetPerDay: z.number().int().positive() }),
  z.object({
    type: z.literal('WEEKLY'),
    targetPerDay: z.number().int().positive(),
    daysOfWeek: z.array(z.number().int().min(0).max(6)).min(1, 'Selecione ao menos um dia.'),
  }),
  z.object({
    type: z.literal('INTERVAL'),
    targetPerDay: z.number().int().positive(),
    intervalDays: z.number().int().positive(),
  }),
])
export type ScheduleInput = z.infer<typeof ScheduleVal>

export const CreateHabitVal = z.object({
  name: z.string().trim().min(3, 'Mínimo de 3 letras.').max(50, 'Máximo de 50 letras.'),
  description: z.string().max(250, 'Máximo 250 caracteres.').optional(),
  schedule: ScheduleVal.optional(),
})
export type CreateHabitInput = z.infer<typeof CreateHabitVal>

// name/description continuam parciais; `schedule`, se vier, tem que ser o
// objeto inteiro (Desc/DECISIONS.md, 2026-09-04) — por isso não é
// `ScheduleVal.partial()`, é o mesmo `ScheduleVal` opcional na chave.
export const UpdateHabitVal = z.object({
  name: CreateHabitVal.shape.name.optional(),
  description: CreateHabitVal.shape.description,
  schedule: ScheduleVal.optional(),
})
export type UpdateHabitInput = z.infer<typeof UpdateHabitVal>
