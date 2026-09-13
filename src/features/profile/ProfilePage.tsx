import { useState } from 'react'
import { useMutation } from '@tanstack/react-query'
import { useNavigate } from 'react-router-dom'
import { deleteAccount, updateProfile } from '../../api/users'
import { logout as logoutRequest } from '../../api/auth'
import { UpdateUserVal } from '../../lib/schemas'
import { apiFieldErrors, zodFieldErrors, type FieldErrors } from '../../lib/formErrors'
import { useAuthStore } from '../auth/useAuthStore'
import { Badge, Button, ErrorText, Field, Input, Page, PageTitle, SuccessText } from '../../components/ui'

// A API nunca devolve `email`/`timezone` de volta em nenhuma resposta de
// sessão (login/refresh só trazem id/name/role) — não tem como pré-popular
// esses campos. Por isso o form é "deixe em branco pra manter": só o que
// for preenchido entra no PATCH parcial.
export function ProfilePage() {
  const navigate = useNavigate()
  const user = useAuthStore((s) => s.user)
  const clearSession = useAuthStore((s) => s.clearSession)
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [fieldErrors, setFieldErrors] = useState<FieldErrors>({})
  const [general, setGeneral] = useState<string>()
  const [success, setSuccess] = useState(false)

  const updateMutation = useMutation({
    mutationFn: (input: Parameters<typeof updateProfile>[1]) => updateProfile(user!.id, input),
    onSuccess: () => {
      setSuccess(true)
      setPassword('')
      setConfirmPassword('')
    },
    onError: (error) => {
      const { fields, general } = apiFieldErrors(error)
      setFieldErrors(fields)
      setGeneral(general)
    },
  })

  const deleteMutation = useMutation({
    mutationFn: () => deleteAccount(user!.id),
    onSuccess: async () => {
      await logoutRequest().catch(() => {})
      clearSession()
      navigate('/login')
    },
  })

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setFieldErrors({})
    setGeneral(undefined)
    setSuccess(false)

    const payload: Record<string, string> = {}
    if (name.trim()) payload.name = name.trim()
    if (email.trim()) payload.email = email.trim()
    if (password) {
      payload.password = password
      payload.confirmPassword = confirmPassword
    }
    if (Object.keys(payload).length === 0) return

    const parsed = UpdateUserVal.safeParse(payload)
    if (!parsed.success) {
      setFieldErrors(zodFieldErrors(parsed.error))
      return
    }
    updateMutation.mutate(parsed.data)
  }

  if (!user) return null

  return (
    <Page className="max-w-sm">
      <PageTitle>Minha conta</PageTitle>
      <p className="mb-6 flex items-center gap-2 text-sm text-muted">
        {user.name} <Badge>{user.role === 'ADMIN' ? 'admin' : 'user'}</Badge>
      </p>

      <form onSubmit={handleSubmit} className="flex flex-col gap-4">
        <Field label="Nome (deixe em branco pra manter)" error={fieldErrors.name}>
          <Input value={name} onChange={(e) => setName(e.target.value)} />
        </Field>
        <Field label="Email (deixe em branco pra manter)" error={fieldErrors.email}>
          <Input type="email" value={email} onChange={(e) => setEmail(e.target.value)} />
        </Field>
        <Field label="Nova senha (deixe em branco pra manter)" error={fieldErrors.password}>
          <Input type="password" value={password} onChange={(e) => setPassword(e.target.value)} />
        </Field>
        {password && (
          <Field label="Confirmar nova senha" error={fieldErrors.confirmPassword}>
            <Input
              type="password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
            />
          </Field>
        )}
        {general && <ErrorText>{general}</ErrorText>}
        {success && <SuccessText>Dados atualizados.</SuccessText>}
        <Button type="submit" disabled={updateMutation.isPending}>
          {updateMutation.isPending ? 'Salvando...' : 'Salvar alterações'}
        </Button>
      </form>

      <hr className="my-8 border-border" />

      <Button
        variant="danger"
        onClick={() => {
          if (confirm('Deletar sua conta? Essa ação não pode ser desfeita.')) deleteMutation.mutate()
        }}
      >
        Deletar minha conta
      </Button>
    </Page>
  )
}
