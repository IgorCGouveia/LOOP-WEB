import { useState } from 'react'
import { useMutation } from '@tanstack/react-query'
import { Link, useNavigate } from 'react-router-dom'
import { login } from '../../api/auth'
import { LoginVal } from '../../lib/schemas'
import { apiFieldErrors, zodFieldErrors, type FieldErrors } from '../../lib/formErrors'
import { useAuthStore } from './useAuthStore'
import { Button, ErrorText, Field, Input } from '../../components/ui'

export function LoginPage() {
  const navigate = useNavigate()
  const setSession = useAuthStore((s) => s.setSession)
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [fieldErrors, setFieldErrors] = useState<FieldErrors>({})
  const [general, setGeneral] = useState<string>()

  const mutation = useMutation({
    mutationFn: login,
    onSuccess: (data) => {
      setSession(data)
      navigate('/habitos')
    },
    onError: (error) => {
      const { fields, general } = apiFieldErrors(error)
      setFieldErrors(fields)
      setGeneral(general)
    },
  })

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setFieldErrors({})
    setGeneral(undefined)
    const parsed = LoginVal.safeParse({ email, password })
    if (!parsed.success) {
      setFieldErrors(zodFieldErrors(parsed.error))
      return
    }
    mutation.mutate(parsed.data)
  }

  return (
    <div className="mx-auto flex min-h-svh max-w-sm flex-col justify-center gap-6 px-4">
      <div>
        <p className="font-mono text-xs text-muted">loop-web</p>
        <h1 className="text-2xl font-semibold text-text">Entrar</h1>
      </div>
      <form onSubmit={handleSubmit} className="flex flex-col gap-4">
        <Field label="Email" error={fieldErrors.email}>
          <Input type="email" value={email} onChange={(e) => setEmail(e.target.value)} />
        </Field>
        <Field label="Senha" error={fieldErrors.password}>
          <Input type="password" value={password} onChange={(e) => setPassword(e.target.value)} />
        </Field>
        {general && <ErrorText>{general}</ErrorText>}
        <Button type="submit" disabled={mutation.isPending}>
          {mutation.isPending ? 'Entrando...' : 'Entrar'}
        </Button>
      </form>
      <p className="text-sm text-muted">
        Não tem conta?{' '}
        <Link to="/cadastro" className="text-accent hover:text-accent-hover">
          Cadastre-se
        </Link>
      </p>
    </div>
  )
}
