import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { checkin, deleteHabit, listCheckins, listMyHabits, undoCheckin } from '../../api/habits'
import { scheduleSummary } from './scheduleSummary'
import { ApiError } from '../../api/envelope'
import { useState } from 'react'
import { Button, ErrorText, Page, Skeleton, Stat } from '../../components/ui'
import { CheckIcon, PencilIcon, TrashIcon, UndoIcon } from '../../components/icons'
import { useToast } from '../../components/Toast'
import { useConfirm } from '../../components/ConfirmDialog'

export function HabitDetailPage() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const toast = useToast()
  const confirm = useConfirm()
  const [checkinError, setCheckinError] = useState<string>()

  const { data: habits } = useQuery({ queryKey: ['habits', 'mine'], queryFn: listMyHabits })
  const habit = habits?.find((h) => h.id === id)

  const { data: checkins, isLoading: checkinsLoading } = useQuery({
    queryKey: ['checkins', id],
    queryFn: () => listCheckins(id!),
    enabled: Boolean(id),
  })

  // `currentStreak` só vem no corpo de POST/DELETE checkin — o Habit em si
  // (GET /me/habits) não expõe streak atual, só `longestStreak`. Guardamos
  // o último valor visto nesta sessão; sem nenhuma ação ainda, mostra "—".
  const [currentStreak, setCurrentStreak] = useState<number>()
  const [todayProgress, setTodayProgress] = useState<{ count: number; target: number }>()

  function invalidate() {
    return Promise.all([
      queryClient.invalidateQueries({ queryKey: ['habits', 'mine'] }),
      queryClient.invalidateQueries({ queryKey: ['checkins', id] }),
    ])
  }

  const checkinMutation = useMutation({
    mutationFn: () => checkin(id!),
    onSuccess: async (result) => {
      setCurrentStreak(result.currentStreak)
      setTodayProgress(result.todayProgress)
      setCheckinError(undefined)
      toast('Check-in registrado.')
      await invalidate()
    },
    onError: (error) => setCheckinError(error instanceof ApiError ? error.message : 'Erro ao registrar check-in.'),
  })

  const undoMutation = useMutation({
    mutationFn: () => undoCheckin(id!),
    onSuccess: async (result) => {
      setCurrentStreak(result.currentStreak)
      setTodayProgress(result.todayProgress)
      setCheckinError(undefined)
      // Undo é um evento novo, não uma edição silenciosa do check-in
      // original — o toast deixa isso visível pro usuário.
      toast('Check-in desfeito.')
      await invalidate()
    },
    onError: (error) => setCheckinError(error instanceof ApiError ? error.message : 'Erro ao desfazer check-in.'),
  })

  const deleteMutation = useMutation({
    mutationFn: () => deleteHabit(id!),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ['habits', 'mine'] })
      toast('Hábito deletado.')
      navigate('/habitos')
    },
    onError: (error) => toast(error instanceof ApiError ? error.message : 'Erro ao deletar hábito.', 'error'),
  })

  async function handleDelete() {
    if (await confirm(`Deletar o hábito "${habit?.name}"? Essa ação não pode ser desfeita.`)) {
      deleteMutation.mutate()
    }
  }

  if (!habit) {
    return (
      <Page className="max-w-lg">
        <Skeleton className="mb-2 h-8 w-1/2" />
        <Skeleton className="mb-6 h-4 w-1/3" />
        <div className="grid grid-cols-3 gap-3">
          <Skeleton className="h-16" />
          <Skeleton className="h-16" />
          <Skeleton className="h-16" />
        </div>
      </Page>
    )
  }

  return (
    <Page className="max-w-lg">
      <div className="mb-4 flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-text">{habit.name}</h1>
          {habit.description && <p className="text-sm text-muted">{habit.description}</p>}
          <p className="text-sm text-muted">{scheduleSummary(habit.schedule)}</p>
        </div>
        <div className="flex gap-3 text-sm">
          <Link
            to={`/habitos/${habit.id}/editar`}
            className="flex items-center gap-1 text-accent hover:text-accent-hover"
          >
            <PencilIcon width={14} height={14} /> Editar
          </Link>
          <Button variant="danger" onClick={handleDelete} className="flex items-center gap-1">
            <TrashIcon width={14} height={14} /> Deletar
          </Button>
        </div>
      </div>

      <div className="mb-2 grid grid-cols-3 gap-3">
        <Stat label="Streak atual" value={currentStreak} />
        <Stat label="Recorde" value={habit.longestStreak} />
        <Stat label="Grace tokens" value={habit.graceTokens} />
      </div>
      {!currentStreak && (
        <p className="mb-4 text-xs text-muted">
          Streak atual só aparece depois de um check-in/undo nesta sessão — a API não
          expõe esse número fora dessas duas respostas.
        </p>
      )}
      {todayProgress && todayProgress.target > 1 && (
        <p className="mb-4 font-mono text-sm text-muted">
          Progresso de hoje: {todayProgress.count}/{todayProgress.target}
        </p>
      )}

      <div className="mb-6 flex gap-3">
        <Button
          className="flex flex-1 items-center justify-center gap-2"
          onClick={() => checkinMutation.mutate()}
          disabled={checkinMutation.isPending}
        >
          <CheckIcon width={16} height={16} /> Check-in de hoje
        </Button>
        <Button
          variant="secondary"
          className="flex flex-1 items-center justify-center gap-2"
          onClick={() => undoMutation.mutate()}
          disabled={undoMutation.isPending}
        >
          <UndoIcon width={16} height={16} /> Desfazer último
        </Button>
      </div>
      {checkinError && <ErrorText>{checkinError}</ErrorText>}

      <h2 className="mb-2 mt-4 text-lg font-medium text-text">Histórico</h2>
      {checkinsLoading && (
        <div className="flex flex-col gap-1">
          <Skeleton className="h-4 w-24" />
          <Skeleton className="h-4 w-24" />
        </div>
      )}
      <ul className="flex flex-col gap-1 font-mono text-sm text-muted">
        {checkins?.map((c) => <li key={c.id}>{new Date(c.date).toLocaleDateString('pt-BR')}</li>)}
        {checkins?.length === 0 && <li className="font-sans text-muted">Nenhum check-in ainda.</li>}
      </ul>
    </Page>
  )
}
