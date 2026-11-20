import { useQuery } from '@tanstack/react-query'
import { useParams } from 'react-router-dom'
import { listCheckinsForUser, listHabitsForUser } from '../../api/habits'
import { scheduleSummary } from '../habits/scheduleSummary'
import { Card, EmptyState, Page, PageHeader, QueryError, SkeletonList } from '../../components/ui'
import { FlameIcon, InboxIcon } from '../../components/icons'
import { queryKeys, useSessionUserId } from '../../lib/queryKeys'
import { formatCalendarDate } from '../../lib/dates'
import { netCheckins } from '../../lib/checkins'
import { usePageTitle } from '../../lib/usePageTitle'

// Somente leitura: PATCH/DELETE de hábito continuam exclusivos do dono
// (Desc/README.md — a tabela de rotas não dá admin como owner-or-admin pra
// editar/deletar hábito, só pra ver). Não expor botão que a API rejeitaria.
export function UserHabitsPage() {
  usePageTitle('Hábitos do usuário')
  const { userId = '' } = useParams<{ userId: string }>()
  const uid = useSessionUserId()
  const habitsQuery = useQuery({
    queryKey: queryKeys.adminUserHabits(uid, userId),
    queryFn: () => listHabitsForUser(userId),
    enabled: Boolean(userId),
  })
  const checkinsQuery = useQuery({
    queryKey: queryKeys.adminUserCheckins(uid, userId),
    queryFn: () => listCheckinsForUser(userId),
    enabled: Boolean(userId),
  })
  // UNDO cancela o CHECKIN correspondente antes de cortar nos 20 (#17).
  const recent = checkinsQuery.data ? netCheckins(checkinsQuery.data).slice(0, 20) : undefined
  const habits = habitsQuery.data

  return (
    <Page>
      <PageHeader title="Hábitos do usuário" />
      <section className="mb-8">
        {habitsQuery.isPending && <SkeletonList size="card" label="Carregando hábitos..." />}
        {habitsQuery.isError && (
          <QueryError
            title="Não foi possível carregar os hábitos"
            error={habitsQuery.error}
            onRetry={() => void habitsQuery.refetch()}
          />
        )}
        {!habitsQuery.isError && habits?.length === 0 && (
          <EmptyState icon={<InboxIcon width={28} height={28} />} title="Sem hábitos" />
        )}
        {!habitsQuery.isError && habits && habits.length > 0 && (
          <ul className="flex flex-col gap-3">
            {habits.map((h) => (
              <li key={h.id}>
                <Card>
                  <div className="flex items-center justify-between">
                    <span className="font-medium text-text">{h.name}</span>
                    <span className="flex items-center gap-1 font-mono text-sm text-muted">
                      <FlameIcon width={14} height={14} />
                      <span className="sr-only">Recorde:</span> {h.longestStreak}
                    </span>
                  </div>
                  <p className="text-sm text-muted">{scheduleSummary(h.schedule)}</p>
                </Card>
              </li>
            ))}
          </ul>
        )}
      </section>

      <h2 className="mb-2 text-lg font-medium text-text">Check-ins recentes</h2>
      {checkinsQuery.isPending && <SkeletonList size="line" label="Carregando check-ins..." />}
      {checkinsQuery.isError && (
        <QueryError
          title="Não foi possível carregar os check-ins"
          error={checkinsQuery.error}
          onRetry={() => void checkinsQuery.refetch()}
        />
      )}
      {!checkinsQuery.isError && recent?.length === 0 && (
        <EmptyState icon={<InboxIcon width={28} height={28} />} title="Nenhum check-in recente" />
      )}
      {!checkinsQuery.isError && recent && recent.length > 0 && (
        <ul className="flex flex-col gap-1 font-mono text-sm text-muted">
          {recent.map((c) => (
            <li key={c.id}>
              {formatCalendarDate(c.date)} — hábito {c.habitId}
            </li>
          ))}
        </ul>
      )}
    </Page>
  )
}
