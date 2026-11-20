import { useQuery } from '@tanstack/react-query'
import { Link } from 'react-router-dom'
import { listAllHabits } from '../../api/habits'
import { scheduleSummary } from '../habits/scheduleSummary'
import { EmptyState, Page, PageHeader, QueryError, SkeletonList, linkButtonClass } from '../../components/ui'
import { InboxIcon } from '../../components/icons'
import { queryKeys, useSessionUserId } from '../../lib/queryKeys'
import { usePageTitle } from '../../lib/usePageTitle'

export function AllHabitsPage() {
  usePageTitle('Todos os hábitos')
  const uid = useSessionUserId()
  const { data: habits, isPending, isError, error, refetch } = useQuery({
    queryKey: queryKeys.adminAllHabits(uid),
    queryFn: listAllHabits,
  })

  return (
    <Page width="xl">
      <PageHeader title="Todos os hábitos" />
      {isPending && <SkeletonList size="row" label="Carregando hábitos..." />}
      {isError && <QueryError title="Não foi possível carregar os hábitos" error={error} onRetry={() => void refetch()} />}
      {!isError && habits?.length === 0 && (
        <EmptyState icon={<InboxIcon width={28} height={28} />} title="Nenhum hábito cadastrado" />
      )}
      {!isError && habits && habits.length > 0 && (
        <table className="w-full border-collapse text-left text-sm">
          <thead>
            <tr className="border-b border-border text-muted">
              <th className="py-2 font-medium">Nome</th>
              <th className="py-2 font-medium">Agenda</th>
              <th className="py-2 font-medium">Dono</th>
            </tr>
          </thead>
          <tbody>
            {habits.map((h) => (
              <tr key={h.id} className="border-b border-border">
                <td className="py-2">{h.name}</td>
                <td className="py-2 text-muted">{scheduleSummary(h.schedule)}</td>
                <td className="py-2">
                  <Link to={`/admin/usuarios/${h.userId}`} className={`${linkButtonClass('inlineLink')} font-mono text-xs`}>
                    {h.userId}
                  </Link>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </Page>
  )
}
