import { useEffect, useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useNavigate, useParams } from 'react-router-dom'
import { createHabit, listMyHabits, updateHabit } from '../../api/habits'
import { CreateHabitVal, type CreateHabitInput, type ScheduleInput } from '../../lib/schemas'
import { apiFieldErrors, zodFieldErrors, type FieldErrors } from '../../lib/formErrors'
import type { ScheduleType } from '../../api/types'
import { Button, ErrorText, Field, Input, Page, PageTitle, Select, Textarea } from '../../components/ui'
import { useToast } from '../../components/Toast'

const WEEKDAYS: { value: number; label: string }[] = [
  { value: 0, label: 'Dom' },
  { value: 1, label: 'Seg' },
  { value: 2, label: 'Ter' },
  { value: 3, label: 'Qua' },
  { value: 4, label: 'Qui' },
  { value: 5, label: 'Sex' },
  { value: 6, label: 'Sáb' },
]

function defaultSchedule(): ScheduleInput {
  return { type: 'DAILY', targetPerDay: 1 }
}

export function HabitFormPage() {
  const { id } = useParams<{ id: string }>()
  const isEditing = Boolean(id)
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const toast = useToast()

  const { data: habits } = useQuery({
    queryKey: ['habits', 'mine'],
    queryFn: listMyHabits,
    enabled: isEditing,
  })
  const existing = habits?.find((h) => h.id === id)

  const [name, setName] = useState('')
  const [description, setDescription] = useState('')
  const [schedule, setSchedule] = useState<ScheduleInput>(defaultSchedule())
  const [fieldErrors, setFieldErrors] = useState<FieldErrors>({})
  const [general, setGeneral] = useState<string>()

  useEffect(() => {
    if (!existing) return
    setName(existing.name)
    setDescription(existing.description ?? '')
    setSchedule({
      type: existing.schedule.type,
      targetPerDay: existing.schedule.targetPerDay,
      daysOfWeek: existing.schedule.daysOfWeek,
      intervalDays: existing.schedule.intervalDays ?? undefined,
    } as ScheduleInput)
  }, [existing])

  const mutation = useMutation({
    mutationFn: async (input: CreateHabitInput) => {
      if (isEditing && id) return updateHabit(id, input)
      return createHabit(input)
    },
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ['habits', 'mine'] })
      toast(isEditing ? 'Hábito atualizado.' : 'Hábito criado.')
      navigate(isEditing ? `/habitos/${id}` : '/habitos')
    },
    onError: (error) => {
      const { fields, general } = apiFieldErrors(error)
      setFieldErrors(fields)
      setGeneral(general)
    },
  })

  function handleScheduleType(type: ScheduleType) {
    if (type === 'DAILY') setSchedule({ type, targetPerDay: schedule.targetPerDay })
    else if (type === 'WEEKLY')
      setSchedule({ type, targetPerDay: schedule.targetPerDay, daysOfWeek: [] })
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
    const parsed = CreateHabitVal.safeParse({
      name,
      description: description || undefined,
      schedule,
    })
    if (!parsed.success) {
      setFieldErrors(zodFieldErrors(parsed.error))
      return
    }
    mutation.mutate(parsed.data)
  }

  return (
    <Page className="max-w-lg">
      <PageTitle>{isEditing ? 'Editar hábito' : 'Novo hábito'}</PageTitle>
      <form onSubmit={handleSubmit} className="flex flex-col gap-4">
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
            <div className="flex flex-wrap gap-2">
              {WEEKDAYS.map((d) => {
                const active = schedule.daysOfWeek.includes(d.value)
                return (
                  <button
                    type="button"
                    key={d.value}
                    onClick={() => toggleWeekday(d.value)}
                    className={`rounded-md border px-2 py-1 font-mono text-sm ${
                      active
                        ? 'border-accent bg-accent text-white'
                        : 'border-border bg-bg text-muted hover:text-text'
                    }`}
                  >
                    {d.label}
                  </button>
                )
              })}
            </div>
          )}
          {fieldErrors['schedule.daysOfWeek'] && <ErrorText>{fieldErrors['schedule.daysOfWeek']}</ErrorText>}

          {schedule.type === 'INTERVAL' && (
            <Field label="A cada quantos dias">
              <Input
                type="number"
                min={1}
                value={schedule.intervalDays}
                onChange={(e) => setSchedule({ ...schedule, intervalDays: Number(e.target.value) })}
              />
            </Field>
          )}

          <Field label="Meta por dia">
            <Input
              type="number"
              min={1}
              value={schedule.targetPerDay}
              onChange={(e) => setSchedule({ ...schedule, targetPerDay: Number(e.target.value) })}
            />
          </Field>
        </fieldset>

        {general && <ErrorText>{general}</ErrorText>}
        <Button type="submit" disabled={mutation.isPending}>
          {mutation.isPending ? 'Salvando...' : 'Salvar'}
        </Button>
      </form>
    </Page>
  )
}
