import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { Link } from 'react-router-dom'
import { deleteUser, listAllUsers } from '../../api/users'
import { ApiError } from '../../api/envelope'
import { Badge, Page, PageTitle, Skeleton } from '../../components/ui'
import { useToast } from '../../components/Toast'
import { useConfirm } from '../../components/ConfirmDialog'

export function UserListPage() {
  const queryClient = useQueryClient()
  const toast = useToast()
  const confirm = useConfirm()
  const { data: users, isLoading } = useQuery({ queryKey: ['admin', 'users'], queryFn: listAllUsers })

  const deleteMutation = useMutation({
    mutationFn: deleteUser,
    onSuccess: () => {
      toast('Usuário deletado.')
      queryClient.invalidateQueries({ queryKey: ['admin', 'users'] })
    },
    onError: (err) => toast(err instanceof ApiError ? err.message : 'Erro ao deletar usuário.', 'error'),
  })

  async function handleDelete(id: string, name: string) {
    if (await confirm(`Deletar o usuário "${name}"?`)) deleteMutation.mutate(id)
  }

  return (
    <Page className="max-w-3xl">
      <PageTitle>Usuários</PageTitle>
      {isLoading && (
        <div className="flex flex-col gap-2">
          <Skeleton className="h-10" />
          <Skeleton className="h-10" />
          <Skeleton className="h-10" />
        </div>
      )}
      <table className="w-full border-collapse text-left text-sm">
        <thead>
          <tr className="border-b border-border text-muted">
            <th className="py-2 font-medium">Nome</th>
            <th className="py-2 font-medium">Email</th>
            <th className="py-2 font-medium">Role</th>
            <th className="py-2" />
          </tr>
        </thead>
        <tbody>
          {users?.map((u) => (
            <tr key={u.id} className="border-b border-border">
              <td className="py-2">
                <Link to={`/admin/usuarios/${u.id}`} className="text-accent hover:text-accent-hover">
                  {u.name}
                </Link>
              </td>
              <td className="py-2 font-mono text-xs text-muted">{u.email}</td>
              <td className="py-2">
                <Badge>{u.role}</Badge>
              </td>
              <td className="py-2 text-right">
                {u.role !== 'ADMIN' && (
                  <button
                    onClick={() => handleDelete(u.id, u.name)}
                    className="text-danger underline decoration-danger/40 underline-offset-4 hover:text-danger-hover"
                  >
                    Deletar
                  </button>
                )}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </Page>
  )
}
