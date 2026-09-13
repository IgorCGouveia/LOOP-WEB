import { useQuery } from '@tanstack/react-query'
import { useParams } from 'react-router-dom'
import { listCheckinsForUser, listHabitsForUser } from '../../api/habits'
import { scheduleSummary } from '../habits/scheduleSummary'
import { Card, Page, PageTitle, Skeleton } from '../../components/ui'

// Somente leitura: PATCH/DELETE de hábito continuam exclusivos do dono
// (Desc/README.md — a tabela de rotas não dá admin como owner-or-admin pra
// editar/deletar hábito, só pra ver). Não expor botão que a API rejeitaria.
export function UserHabitsPage() {
  const { userId } = useParams<{ userId: string }>()
  const { data: habits, isLoading } = useQuery({
    queryKey: ['admin', 'habits', userId],
    queryFn: () => listHabitsForUser(userId!),
    enabled: Boolean(userId),
  })
  const { data: checkins } = useQuery({
    queryKey: ['admin', 'checkins', userId],
    queryFn: () => listCheckinsForUser(userId!),
    enabled: Boolean(userId),
  })

  return (
    <Page>
      <PageTitle>Hábitos do usuário</PageTitle>
      {isLoading && (
        <div className="mb-8 flex flex-col gap-3">
          <Skeleton className="h-16" />
          <Skeleton className="h-16" />
        </div>
      )}
      <ul className="mb-8 flex flex-col gap-3">
        {habits?.map((h) => (
          <li key={h.id}>
            <Card>
              <div className="flex items-center justify-between">
                <span className="font-medium text-text">{h.name}</span>
                <span className="font-mono text-sm text-muted">🔥 {h.longestStreak}</span>
              </div>
              <p className="text-sm text-muted">{scheduleSummary(h.schedule)}</p>
            </Card>
          </li>
        ))}
        {habits?.length === 0 && <p className="text-sm text-muted">Sem hábitos.</p>}
      </ul>

      <h2 className="mb-2 text-lg font-medium text-text">Check-ins recentes</h2>
      <ul className="flex flex-col gap-1 font-mono text-sm text-muted">
        {checkins?.slice(0, 20).map((c) => (
          <li key={c.id}>
            {new Date(c.date).toLocaleDateString('pt-BR')} — hábito {c.habitId}
          </li>
        ))}
      </ul>
    </Page>
  )
}
