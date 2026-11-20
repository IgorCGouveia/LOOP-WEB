import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { Link } from 'react-router-dom'
import { deleteUser, listAllUsers } from '../../api/users'
import { ApiError } from '../../api/envelope'
import { Badge, Button, EmptyState, Page, PageHeader, QueryError, SkeletonList, linkButtonClass } from '../../components/ui'
import { UsersIcon } from '../../components/icons'
import { useToast } from '../../components/Toast'
import { useConfirm } from '../../components/ConfirmDialog'
import { queryKeys, useSessionUserId } from '../../lib/queryKeys'
import { usePageTitle } from '../../lib/usePageTitle'

export function UserListPage() {
  usePageTitle('Usuários')
  const uid = useSessionUserId()
  const queryClient = useQueryClient()
  const toast = useToast()
  const confirm = useConfirm()
  const { data: users, isPending, isError, error, refetch } = useQuery({
    queryKey: queryKeys.adminUsers(uid),
    queryFn: listAllUsers,
  })

  const deleteMutation = useMutation({
    mutationFn: deleteUser,
    onSuccess: () => {
      toast('Usuário deletado.')
      return queryClient.invalidateQueries({ queryKey: queryKeys.adminUsers(uid) })
    },
    onError: (err) => toast(err instanceof ApiError ? err.message : 'Erro ao deletar usuário.', 'error'),
  })

  // Só a linha em exclusão fica travada (#13).
  const deletingId = deleteMutation.isPending ? deleteMutation.variables : undefined

  async function handleDelete(id: string, name: string) {
    if (deletingId === id) return
    if (await confirm(`Deletar o usuário "${name}"?`)) deleteMutation.mutate(id)
  }

  return (
    <Page width="xl">
      <PageHeader title="Usuários" />
      {isPending && <SkeletonList size="row" label="Carregando usuários..." />}
      {isError && <QueryError title="Não foi possível carregar os usuários" error={error} onRetry={() => void refetch()} />}
      {!isError && users?.length === 0 && (
        <EmptyState icon={<UsersIcon width={28} height={28} />} title="Nenhum usuário" />
      )}
      {!isError && users && users.length > 0 && (
        <table className="w-full border-collapse text-left text-sm">
          <thead>
            <tr className="border-b border-border text-muted">
              <th className="py-2 font-medium">Nome</th>
              <th className="py-2 font-medium">Email</th>
              <th className="py-2 font-medium">Role</th>
              <th className="py-2">
                <span className="sr-only">Ações</span>
              </th>
            </tr>
          </thead>
          <tbody>
            {users.map((u) => (
              <tr key={u.id} className="border-b border-border">
                <td className="py-2">
                  <Link to={`/admin/usuarios/${u.id}`} className={linkButtonClass('inlineLink')}>
                    {u.name}
                  </Link>
                </td>
                <td className="py-2 font-mono text-xs text-muted">{u.email}</td>
                <td className="py-2">
                  <Badge>{u.role}</Badge>
                </td>
                <td className="py-2 text-right">
                  {u.role !== 'ADMIN' && (
                    <Button
                      variant="danger"
                      onClick={() => handleDelete(u.id, u.name)}
                      disabled={deletingId === u.id}
                      aria-label={`Deletar ${u.name}`}
                    >
                      {deletingId === u.id ? 'Deletando...' : 'Deletar'}
                    </Button>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </Page>
  )
}
