import { useQuery } from '@tanstack/react-query'
import { Link } from 'react-router-dom'
import { listAllHabits } from '../../api/habits'
import { scheduleSummary } from '../habits/scheduleSummary'
import { Page, PageTitle } from '../../components/ui'

export function AllHabitsPage() {
  const { data: habits, isLoading } = useQuery({ queryKey: ['admin', 'habits', 'all'], queryFn: listAllHabits })

  return (
    <Page className="max-w-3xl">
      <PageTitle>Todos os hábitos</PageTitle>
      {isLoading && <p className="text-sm text-muted">Carregando...</p>}
      <table className="w-full border-collapse text-left text-sm">
        <thead>
          <tr className="border-b border-border text-muted">
            <th className="py-2 font-medium">Nome</th>
            <th className="py-2 font-medium">Agenda</th>
            <th className="py-2 font-medium">Dono</th>
          </tr>
        </thead>
        <tbody>
          {habits?.map((h) => (
            <tr key={h.id} className="border-b border-border">
              <td className="py-2">{h.name}</td>
              <td className="py-2 text-muted">{scheduleSummary(h.schedule)}</td>
              <td className="py-2">
                <Link
                  to={`/admin/usuarios/${h.userId}`}
                  className="font-mono text-xs text-accent hover:text-accent-hover"
                >
                  {h.userId}
                </Link>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </Page>
  )
}
