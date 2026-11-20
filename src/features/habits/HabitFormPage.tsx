import { useId, useRef, useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useNavigate, useParams } from 'react-router-dom'
import { createHabit, listMyHabits, updateHabit } from '../../api/habits'
import {
  CreateHabitVal,
  UpdateHabitVal,
  type CreateHabitInput,
  type ScheduleInput,
  type UpdateHabitInput,
} from '../../lib/schemas'
import { apiFieldErrors, unmatchedFieldMessage, zodFieldErrors, type FieldErrors } from '../../lib/formErrors'
import type { Habit, ScheduleType } from '../../api/types'
import {
  Button,
  ErrorText,
  Field,
  FormError,
  Input,
  LoadingRegion,
  Page,
  PageHeader,
  QueryError,
  Select,
  Skeleton,
  Textarea,
} from '../../components/ui'
import { useToast } from '../../components/Toast'
import { queryKeys, useSessionUserId } from '../../lib/queryKeys'
import { usePageTitle } from '../../lib/usePageTitle'
import { useFocusFirstInvalid } from '../../lib/useFocusFirstInvalid'
import { HabitNotFound } from './HabitDetailPage'

const WEEKDAYS: { value: number; label: string; name: string }[] = [
  { value: 0, label: 'Dom', name: 'Domingo' },
  { value: 1, label: 'Seg', name: 'Segunda' },
  { value: 2, label: 'Ter', name: 'Terça' },
  { value: 3, label: 'Qua', name: 'Quarta' },
  { value: 4, label: 'Qui', name: 'Quinta' },
  { value: 5, label: 'Sex', name: 'Sexta' },
  { value: 6, label: 'Sáb', name: 'Sábado' },
]

// Toda chave de erro que esta tela sabe mostrar ao lado de um campo. O que
// sobrar vai pra mensagem geral (#18).
const RENDERED_ERROR_KEYS = [
  'name',
  'description',
  'schedule.daysOfWeek',
  'schedule.targetPerDay',
  'schedule.intervalDays',
] as const

function defaultSchedule(): ScheduleInput {
  return { type: 'DAILY', targetPerDay: 1 }
}

function scheduleFromHabit(habit: Habit): ScheduleInput {
  const { type, targetPerDay, daysOfWeek, intervalDays } = habit.schedule
  if (type === 'WEEKLY') return { type, targetPerDay, daysOfWeek }
  if (type === 'INTERVAL') return { type, targetPerDay, intervalDays: intervalDays ?? 1 }
  return { type, targetPerDay }
}

// No modo edição, o formulário só aparece depois que o hábito carregou (#15).
// Antes, um erro ou id inexistente deixava um form em branco com a agenda
// padrão e "Salvar" habilitado — salvar sobrescrevia a agenda real.
export function HabitFormPage() {
  const { id } = useParams<{ id: string }>()
  const isEditing = Boolean(id)
  const uid = useSessionUserId()
  usePageTitle(isEditing ? 'Editar hábito' : 'Novo hábito')

  const habitsQuery = useQuery({
    queryKey: queryKeys.myHabits(uid),
    queryFn: listMyHabits,
    enabled: isEditing,
  })

  if (!isEditing) return <HabitForm />

  if (habitsQuery.isPending) {
    return (
      <Page width="md">
        <PageHeader title="Editar hábito" />
        <LoadingRegion label="Carregando hábito..." className="flex flex-col gap-4">
          <Skeleton className="h-10" />
          <Skeleton className="h-20" />
          <Skeleton className="h-32" />
        </LoadingRegion>
      </Page>
    )
  }

  if (habitsQuery.isError) {
    return (
      <Page width="md">
        <PageHeader title="Editar hábito" />
        <QueryError
          title="Não foi possível carregar o hábito"
          error={habitsQuery.error}
          onRetry={() => void habitsQuery.refetch()}
        />
      </Page>
    )
  }

  const existing = habitsQuery.data.find((h) => h.id === id)
  if (!existing) return <HabitNotFound />
  return <HabitForm key={existing.id} existing={existing} />
}

function HabitForm({ existing }: { existing?: Habit }) {
  const isEditing = Boolean(existing)
  const uid = useSessionUserId()
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const toast = useToast()
  const formRef = useRef<HTMLFormElement>(null)
  const daysLabelId = useId()
  const daysErrorId = useId()

  const [name, setName] = useState(existing?.name ?? '')
  const [description, setDescription] = useState(existing?.description ?? '')
  const [schedule, setSchedule] = useState<ScheduleInput>(existing ? scheduleFromHabit(existing) : defaultSchedule())
  const [fieldErrors, setFieldErrors] = useState<FieldErrors>({})
  const [general, setGeneral] = useState<string>()
  useFocusFirstInvalid(formRef, fieldErrors)

  function showErrors(fields: FieldErrors, generalMessage?: string) {
    setFieldErrors(fields)
    setGeneral(
      [generalMessage, unmatchedFieldMessage(fields, RENDERED_ERROR_KEYS)].filter(Boolean).join(' ') || undefined,
    )
  }

  const mutation = useMutation({
    mutationFn: async (input: CreateHabitInput | UpdateHabitInput) => {
      if (existing) return updateHabit(existing.id, input as UpdateHabitInput)
      return createHabit(input as CreateHabitInput)
    },
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: queryKeys.myHabits(uid) })
      toast(isEditing ? 'Hábito atualizado.' : 'Hábito criado.')
      navigate(existing ? `/habitos/${existing.id}` : '/habitos')
    },
    onError: (error) => {
      const { fields, general } = apiFieldErrors(error)
      showErrors(fields, general)
    },
  })

  function handleScheduleType(type: ScheduleType) {
    if (type === 'DAILY') setSchedule({ type, targetPerDay: schedule.targetPerDay })
    else if (type === 'WEEKLY') setSchedule({ type, targetPerDay: schedule.targetPerDay, daysOfWeek: [] })
    else setSchedule({ type, targetPerDay: schedule.targetPerDay, intervalDays: 1 })
  }

  function toggleWeekday(day: number) {
    if (schedule.type !== 'WEEKLY') return
    const days = schedule.daysOfWeek.includes(day)
      ? schedule.daysOfWeek.filter((d) => d !== day)
      : [...schedule.daysOfWeek, day].sort()
    setSchedule({ ...schedule, daysOfWeek: days })
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setFieldErrors({})
    setGeneral(undefined)

    const cleared = description.trim() === ''
    const parsed = existing
      ? UpdateHabitVal.safeParse({
          name,
          // Apagar uma descrição que existia manda `null` explícito; omitir a
          // chave no PATCH parcial mantinha o texto antigo (#21).
          description: cleared ? (existing.description ? null : undefined) : description,
          schedule,
        })
      : CreateHabitVal.safeParse({ name, description: cleared ? undefined : description, schedule })

    if (!parsed.success) {
      showErrors(zodFieldErrors(parsed.error))
      return
    }
    mutation.mutate(parsed.data)
  }

  const daysError = fieldErrors['schedule.daysOfWeek']

  return (
    <Page width="md">
      <PageHeader title={isEditing ? 'Editar hábito' : 'Novo hábito'} />
      <form ref={formRef} onSubmit={handleSubmit} noValidate className="flex flex-col gap-4">
        <Field label="Nome" error={fieldErrors.name}>
          <Input value={name} onChange={(e) => setName(e.target.value)} />
        </Field>
        <Field label="Descrição (opcional)" error={fieldErrors.description}>
          <Textarea value={description} onChange={(e) => setDescription(e.target.value)} />
        </Field>

        <fieldset className="flex flex-col gap-3 rounded-md border border-border p-3">
          <legend className="px-1 text-sm font-medium text-muted">Agenda</legend>
          <Field label="Frequência">
            <Select value={schedule.type} onChange={(e) => handleScheduleType(e.target.value as ScheduleType)}>
              <option value="DAILY">Todo dia</option>
              <option value="WEEKLY">Dias específicos da semana</option>
              <option value="INTERVAL">A cada N dias</option>
            </Select>
          </Field>

          {schedule.type === 'WEEKLY' && (
            <div className="flex flex-col gap-1">
              <span id={daysLabelId} className="text-sm text-muted">
                Dias da semana
              </span>
              {/* Seleção anunciada por aria-pressed, não só pela cor (#19). */}
              <div
                role="group"
                aria-labelledby={daysLabelId}
                aria-describedby={daysError ? daysErrorId : undefined}
                data-invalid={daysError ? 'true' : undefined}
                tabIndex={daysError ? -1 : undefined}
                className="flex flex-wrap gap-2 rounded-md"
              >
                {WEEKDAYS.map((d) => {
                  const active = schedule.daysOfWeek.includes(d.value)
                  return (
                    <button
                      type="button"
                      key={d.value}
                      aria-pressed={active}
                      aria-label={d.name}
                      onClick={() => toggleWeekday(d.value)}
                      className={`rounded-md border px-2 py-1 font-mono text-sm ${
                        active ? 'border-accent bg-accent text-bg' : 'border-border-strong bg-bg text-muted hover:text-text'
                      }`}
                    >
                      {d.label}
                    </button>
                  )
                })}
              </div>
              {daysError && <ErrorText id={daysErrorId}>{daysError}</ErrorText>}
            </div>
          )}

          {schedule.type === 'INTERVAL' && (
            <Field label="A cada quantos dias" error={fieldErrors['schedule.intervalDays']}>
              <Input
                type="number"
                min={1}
                value={schedule.intervalDays}
                onChange={(e) => setSchedule({ ...schedule, intervalDays: Number(e.target.value) })}
              />
            </Field>
          )}

          <Field label="Meta por dia" error={fieldErrors['schedule.targetPerDay']}>
            <Input
              type="number"
              min={1}
              value={schedule.targetPerDay}
              onChange={(e) => setSchedule({ ...schedule, targetPerDay: Number(e.target.value) })}
            />
          </Field>
        </fieldset>

        {general && <FormError>{general}</FormError>}
        <Button type="submit" disabled={mutation.isPending}>
          {mutation.isPending ? 'Salvando...' : 'Salvar'}
        </Button>
      </form>
    </Page>
  )
}
