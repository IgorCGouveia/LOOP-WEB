import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { checkin, deleteHabit, listCheckins, listMyHabits, undoCheckin } from '../../api/habits'
import { scheduleSummary } from './scheduleSummary'
import { ApiError } from '../../api/envelope'
import { useState } from 'react'
import { Button, ErrorText, Page, Stat } from '../../components/ui'

export function HabitDetailPage() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const [checkinError, setCheckinError] = useState<string>()

  const { data: habits } = useQuery({ queryKey: ['habits', 'mine'], queryFn: listMyHabits })
  const habit = habits?.find((h) => h.id === id)

  const { data: checkins } = useQuery({
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
      await invalidate()
    },
    onError: (error) => setCheckinError(error instanceof ApiError ? error.message : 'Erro ao desfazer check-in.'),
  })

  const deleteMutation = useMutation({
    mutationFn: () => deleteHabit(id!),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ['habits', 'mine'] })
      navigate('/habitos')
    },
  })

  if (!habit) return <p className="p-6 text-center text-sm text-muted">Carregando...</p>

  return (
    <Page className="max-w-lg">
      <div className="mb-4 flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-text">{habit.name}</h1>
          {habit.description && <p className="text-sm text-muted">{habit.description}</p>}
          <p className="text-sm text-muted">{scheduleSummary(habit.schedule)}</p>
        </div>
        <div className="flex gap-3 text-sm">
          <Link to={`/habitos/${habit.id}/editar`} className="text-accent hover:text-accent-hover">
            Editar
          </Link>
          <Button
            variant="danger"
            onClick={() => {
              if (confirm('Deletar este hábito?')) deleteMutation.mutate()
            }}
          >
            Deletar
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
        <Button className="flex-1" onClick={() => checkinMutation.mutate()} disabled={checkinMutation.isPending}>
          Check-in de hoje
        </Button>
        <Button
          variant="secondary"
          className="flex-1"
          onClick={() => undoMutation.mutate()}
          disabled={undoMutation.isPending}
        >
          Desfazer último
        </Button>
      </div>
      {checkinError && <ErrorText>{checkinError}</ErrorText>}

      <h2 className="mb-2 mt-4 text-lg font-medium text-text">Histórico</h2>
      <ul className="flex flex-col gap-1 font-mono text-sm text-muted">
        {checkins?.map((c) => <li key={c.id}>{new Date(c.date).toLocaleDateString('pt-BR')}</li>)}
        {checkins?.length === 0 && <li className="font-sans text-muted">Nenhum check-in ainda.</li>}
      </ul>
    </Page>
  )
}
