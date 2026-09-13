import { useQuery } from '@tanstack/react-query'
import { Link } from 'react-router-dom'
import { listMyHabits } from '../../api/habits'
import { scheduleSummary } from './scheduleSummary'
import { Card, ErrorText, Page, PageTitle, linkButtonClass } from '../../components/ui'

export function HabitListPage() {
  const { data: habits, isLoading, error } = useQuery({
    queryKey: ['habits', 'mine'],
    queryFn: listMyHabits,
  })

  return (
    <Page>
      <div className="mb-6 flex items-center justify-between">
        <PageTitle>Meus hábitos</PageTitle>
        <Link to="/habitos/novo" className={linkButtonClass()}>
          Novo hábito
        </Link>
      </div>

      {isLoading && <p className="text-sm text-muted">Carregando...</p>}
      {error && <ErrorText>Não foi possível carregar seus hábitos.</ErrorText>}
      {habits?.length === 0 && (
        <p className="text-sm text-muted">Nenhum hábito ainda — crie o primeiro.</p>
      )}

      <ul className="flex flex-col gap-3">
        {habits?.map((habit) => (
          <li key={habit.id}>
            <Link to={`/habitos/${habit.id}`}>
              <Card className="transition-colors hover:bg-surface-hover">
                <div className="flex items-center justify-between">
                  <span className="font-medium text-text">{habit.name}</span>
                  <span className="font-mono text-sm text-muted">🔥 {habit.longestStreak}</span>
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
