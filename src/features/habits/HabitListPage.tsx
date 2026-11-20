import { useQuery } from '@tanstack/react-query'
import { Link } from 'react-router-dom'
import { listMyHabits } from '../../api/habits'
import { scheduleSummary } from './scheduleSummary'
import { Card, EmptyState, Page, PageHeader, QueryError, SkeletonList, linkButtonClass } from '../../components/ui'
import { FlameIcon, InboxIcon, PlusIcon } from '../../components/icons'
import { queryKeys, useSessionUserId } from '../../lib/queryKeys'
import { usePageTitle } from '../../lib/usePageTitle'

export function HabitListPage() {
  usePageTitle('Meus hábitos')
  const uid = useSessionUserId()
  const { data: habits, isPending, isError, error, refetch } = useQuery({
    queryKey: queryKeys.myHabits(uid),
    queryFn: listMyHabits,
  })

  return (
    <Page>
      <PageHeader
        title="Meus hábitos"
        actions={
          <Link to="/habitos/novo" className={linkButtonClass()}>
            <PlusIcon width={16} height={16} /> Novo hábito
          </Link>
        }
      />

      {isPending && <SkeletonList size="card" label="Carregando hábitos..." />}

      {isError && (
        <QueryError title="Não foi possível carregar seus hábitos" error={error} onRetry={() => void refetch()} />
      )}

      {habits?.length === 0 && (
        <EmptyState
          icon={<InboxIcon width={28} height={28} />}
          title="Nenhum hábito ainda"
          description="Crie o primeiro pra começar a acompanhar sua streak."
          action={
            <Link to="/habitos/novo" className={`${linkButtonClass()} mt-2`}>
              Criar hábito
            </Link>
          }
        />
      )}

      {!isError && habits && habits.length > 0 && (
        <ul className="flex flex-col gap-3">
          {habits.map((habit) => (
            <li key={habit.id}>
              <Link to={`/habitos/${habit.id}`} className="block rounded-lg">
                <Card className="transition-colors hover:bg-surface-hover">
                  <div className="flex items-center justify-between">
                    <span className="font-medium text-text">{habit.name}</span>
                    <span className="flex items-center gap-1 font-mono text-sm text-muted">
                      <FlameIcon width={14} height={14} />
                      <span className="sr-only">Recorde:</span> {habit.longestStreak}
                    </span>
                  </div>
                  <p className="text-sm text-muted">{scheduleSummary(habit.schedule)}</p>
                </Card>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </Page>
  )
}
