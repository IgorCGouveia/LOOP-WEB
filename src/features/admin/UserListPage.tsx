import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { Link } from 'react-router-dom'
import { deleteUser, listAllUsers } from '../../api/users'
import { ApiError } from '../../api/envelope'
import { useState } from 'react'
import { Badge, ErrorText, Page, PageTitle } from '../../components/ui'

export function UserListPage() {
  const queryClient = useQueryClient()
  const [error, setError] = useState<string>()
  const { data: users, isLoading } = useQuery({ queryKey: ['admin', 'users'], queryFn: listAllUsers })

  const deleteMutation = useMutation({
    mutationFn: deleteUser,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['admin', 'users'] }),
    onError: (err) => setError(err instanceof ApiError ? err.message : 'Erro ao deletar usuário.'),
  })

  return (
    <Page className="max-w-3xl">
      <PageTitle>Usuários</PageTitle>
      {isLoading && <p className="text-sm text-muted">Carregando...</p>}
      {error && <div className="mb-4"><ErrorText>{error}</ErrorText></div>}
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
                    onClick={() => {
                      if (confirm(`Deletar ${u.name}?`)) deleteMutation.mutate(u.id)
                    }}
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
