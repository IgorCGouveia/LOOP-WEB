import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { checkin, deleteHabit, listCheckins, listMyHabits, undoCheckin } from '../../api/habits'
import type { CheckinResult } from '../../api/types'
import { scheduleSummary } from './scheduleSummary'
import { ApiError } from '../../api/envelope'
import { useState } from 'react'
import {
  Button,
  EmptyState,
  FormError,
  LoadingRegion,
  Page,
  PageHeader,
  QueryError,
  Skeleton,
  SkeletonList,
  Stat,
  linkButtonClass,
} from '../../components/ui'
import { CheckIcon, InboxIcon, PencilIcon, TrashIcon, UndoIcon } from '../../components/icons'
import { useToast } from '../../components/Toast'
import { useConfirm } from '../../components/ConfirmDialog'
import { queryKeys, useSessionUserId } from '../../lib/queryKeys'
import { formatCalendarDate } from '../../lib/dates'
import { netCheckins } from '../../lib/checkins'
import { usePageTitle } from '../../lib/usePageTitle'

export function HabitDetailPage() {
  const { id = '' } = useParams<{ id: string }>()
  const uid = useSessionUserId()
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const toast = useToast()
  const confirm = useConfirm()
  const [checkinError, setCheckinError] = useState<string>()

  const habitsQuery = useQuery({ queryKey: queryKeys.myHabits(uid), queryFn: listMyHabits })
  const habit = habitsQuery.data?.find((h) => h.id === id)
  usePageTitle(habit?.name ?? (habitsQuery.isSuccess ? 'Hábito não encontrado' : 'Hábito'))

  const checkinsQuery = useQuery({
    queryKey: queryKeys.checkins(uid, id),
    queryFn: () => listCheckins(id),
    enabled: Boolean(id),
  })
  // O log tem eventos CHECKIN e UNDO; o histórico mostra só os líquidos (#17).
  const history = checkinsQuery.data ? netCheckins(checkinsQuery.data) : undefined

  // `currentStreak` só vem no corpo de POST/DELETE checkin — o Habit em si
  // (GET /me/habits) não expõe streak atual, só `longestStreak`. Guardamos
  // o último valor visto nesta sessão; sem nenhuma ação ainda, mostra "—".
  const [currentStreak, setCurrentStreak] = useState<number>()
  const [todayProgress, setTodayProgress] = useState<{ count: number; target: number }>()

  function invalidate() {
    return Promise.all([
      queryClient.invalidateQueries({ queryKey: queryKeys.myHabits(uid) }),
      queryClient.invalidateQueries({ queryKey: queryKeys.checkins(uid, id) }),
    ])
  }

  function applyResult(result: CheckinResult) {
    setCurrentStreak(result.currentStreak)
    setTodayProgress(result.todayProgress)
    setCheckinError(undefined)
  }

  const checkinMutation = useMutation({
    mutationFn: () => checkin(id),
    onSuccess: async (result) => {
      applyResult(result)
      toast('Check-in registrado.')
      await invalidate()
    },
    onError: (error) => setCheckinError(error instanceof ApiError ? error.message : 'Erro ao registrar check-in.'),
  })

  const undoMutation = useMutation({
    mutationFn: () => undoCheckin(id),
    onSuccess: async (result) => {
      applyResult(result)
      // Undo é um evento novo, não uma edição silenciosa do check-in
      // original — o toast deixa isso visível pro usuário.
      toast('Check-in desfeito.')
      await invalidate()
    },
    onError: (error) => setCheckinError(error instanceof ApiError ? error.message : 'Erro ao desfazer check-in.'),
  })

  // Check-in e desfazer nunca rodam juntos: com os dois em voo, o streak
  // exibido seria o da resposta que chegasse por último, não o da última
  // operação aplicada pelo servidor (#13, #27).
  const checkinBusy = checkinMutation.isPending || undoMutation.isPending

  const deleteMutation = useMutation({
    mutationFn: () => deleteHabit(id),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: queryKeys.myHabits(uid) })
      toast('Hábito deletado.')
      navigate('/habitos')
    },
    onError: (error) => toast(error instanceof ApiError ? error.message : 'Erro ao deletar hábito.', 'error'),
  })

  async function handleDelete() {
    if (deleteMutation.isPending) return
    if (await confirm(`Deletar o hábito "${habit?.name}"? Essa ação não pode ser desfeita.`)) {
      deleteMutation.mutate()
    }
  }

  // Três estados distintos antes do conteúdo (#15): carregando, erro e
  // "não encontrado" — antes os dois últimos ficavam num skeleton eterno.
  if (habitsQuery.isPending) {
    return (
      <Page width="md">
        <LoadingRegion label="Carregando hábito...">
          <Skeleton className="mb-2 h-8 w-1/2" />
          <Skeleton className="mb-6 h-4 w-1/3" />
          <div className="grid grid-cols-3 gap-3">
            <Skeleton className="h-16" />
            <Skeleton className="h-16" />
            <Skeleton className="h-16" />
          </div>
        </LoadingRegion>
      </Page>
    )
  }

  if (habitsQuery.isError) {
    return (
      <Page width="md">
        <QueryError
          title="Não foi possível carregar o hábito"
          error={habitsQuery.error}
          onRetry={() => void habitsQuery.refetch()}
        />
      </Page>
    )
  }

  if (!habit) return <HabitNotFound />

  return (
    <Page width="md">
      <PageHeader
        title={habit.name}
        subtitle={
          <>
            {habit.description && <p>{habit.description}</p>}
            <p>{scheduleSummary(habit.schedule)}</p>
          </>
        }
        actions={
          <>
            <Link to={`/habitos/${habit.id}/editar`} className={linkButtonClass('link')}>
              <PencilIcon width={14} height={14} /> Editar
            </Link>
            <Button variant="danger" onClick={handleDelete} disabled={deleteMutation.isPending}>
              <TrashIcon width={14} height={14} /> {deleteMutation.isPending ? 'Deletando...' : 'Deletar'}
            </Button>
          </>
        }
      />

      <div className="mb-2 grid grid-cols-3 gap-3">
        <Stat label="Streak atual" value={currentStreak} />
        <Stat label="Recorde" value={habit.longestStreak} />
        <Stat label="Grace tokens" value={habit.graceTokens} />
      </div>
      {currentStreak === undefined && (
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
        <Button className="flex-1" onClick={() => checkinMutation.mutate()} disabled={checkinBusy}>
          <CheckIcon width={16} height={16} /> {checkinMutation.isPending ? 'Registrando...' : 'Check-in de hoje'}
        </Button>
        <Button variant="secondary" className="flex-1" onClick={() => undoMutation.mutate()} disabled={checkinBusy}>
          <UndoIcon width={16} height={16} /> {undoMutation.isPending ? 'Desfazendo...' : 'Desfazer último'}
        </Button>
      </div>
      {checkinError && <FormError>{checkinError}</FormError>}

      <h2 className="mb-2 mt-4 text-lg font-medium text-text">Histórico</h2>
      {checkinsQuery.isPending && <SkeletonList size="line" rows={2} label="Carregando histórico..." />}
      {checkinsQuery.isError && (
        <QueryError
          title="Não foi possível carregar o histórico"
          error={checkinsQuery.error}
          onRetry={() => void checkinsQuery.refetch()}
        />
      )}
      {history && !checkinsQuery.isError && (
        <ul className="flex flex-col gap-1 font-mono text-sm text-muted">
          {history.map((c) => (
            <li key={c.id}>{formatCalendarDate(c.date)}</li>
          ))}
          {history.length === 0 && <li className="font-sans text-muted">Nenhum check-in ainda.</li>}
        </ul>
      )}
    </Page>
  )
}

// Sem título próprio: quem renderiza (detalhe, edição) já define o da página.
export function HabitNotFound() {
  return (
    <Page width="md">
      <EmptyState
        role="status"
        icon={<InboxIcon width={28} height={28} />}
        title="Hábito não encontrado"
        description="Ele pode ter sido deletado, ou o link está desatualizado."
        action={
          <Link to="/habitos" className={`${linkButtonClass('secondary')} mt-2`}>
            Voltar pros hábitos
          </Link>
        }
      />
    </Page>
  )
}
