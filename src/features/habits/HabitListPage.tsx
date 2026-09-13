import { useQuery } from '@tanstack/react-query'
import { Link } from 'react-router-dom'
import { listMyHabits } from '../../api/habits'
import { scheduleSummary } from './scheduleSummary'
import { Card, EmptyState, Page, PageTitle, Skeleton, linkButtonClass } from '../../components/ui'
import { AlertIcon, FlameIcon, InboxIcon, PlusIcon } from '../../components/icons'

export function HabitListPage() {
  const { data: habits, isLoading, error } = useQuery({
    queryKey: ['habits', 'mine'],
    queryFn: listMyHabits,
  })

  return (
    <Page>
      <div className="mb-6 flex items-center justify-between">
        <PageTitle>Meus hábitos</PageTitle>
        <Link to="/habitos/novo" className={`${linkButtonClass()} flex items-center gap-1.5`}>
          <PlusIcon width={16} height={16} /> Novo hábito
        </Link>
      </div>

      {isLoading && (
        <div className="flex flex-col gap-3">
          <Skeleton className="h-16" />
          <Skeleton className="h-16" />
          <Skeleton className="h-16" />
        </div>
      )}

      {error && (
        <EmptyState
          icon={<AlertIcon width={28} height={28} />}
          title="Não foi possível carregar seus hábitos"
          description="Verifique sua conexão e tente de novo — a API pode estar em cold start (free tier), pode levar até 1 minuto."
        />
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

      <ul className="flex flex-col gap-3">
        {habits?.map((habit) => (
          <li key={habit.id}>
            <Link to={`/habitos/${habit.id}`}>
              <Card className="transition-colors hover:bg-surface-hover">
                <div className="flex items-center justify-between">
                  <span className="font-medium text-text">{habit.name}</span>
                  <span className="flex items-center gap-1 font-mono text-sm text-muted">
                    <FlameIcon width={14} height={14} /> {habit.longestStreak}
                  </span>
                </div>
                <p className="text-sm text-muted">{scheduleSummary(habit.schedule)}</p>
              </Card>
            </Link>
          </li>
        ))}
      </ul>
    </Page>
  )
}
