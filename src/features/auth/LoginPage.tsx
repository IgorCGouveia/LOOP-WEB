import { useRef, useState } from 'react'
import { useMutation } from '@tanstack/react-query'
import { Link, useNavigate } from 'react-router-dom'
import { login } from '../../api/auth'
import { LoginVal } from '../../lib/schemas'
import { apiFieldErrors, zodFieldErrors, type FieldErrors } from '../../lib/formErrors'
import { useAuthStore } from './useAuthStore'
import { Button, Field, FormError, Input, PageHeader, linkButtonClass } from '../../components/ui'
import { usePageTitle } from '../../lib/usePageTitle'
import { useFocusFirstInvalid } from '../../lib/useFocusFirstInvalid'

export function LoginPage() {
  const navigate = useNavigate()
  const setSession = useAuthStore((s) => s.setSession)
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [fieldErrors, setFieldErrors] = useState<FieldErrors>({})
  const [general, setGeneral] = useState<string>()
  const formRef = useRef<HTMLFormElement>(null)
  usePageTitle('Entrar')
  useFocusFirstInvalid(formRef, fieldErrors)

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
    <main className="mx-auto flex min-h-svh max-w-sm flex-col justify-center px-4">
      <PageHeader eyebrow="loop-web" title="Entrar" />
      <form ref={formRef} onSubmit={handleSubmit} noValidate className="flex flex-col gap-4">
        <Field label="Email" error={fieldErrors.email}>
          <Input type="email" value={email} onChange={(e) => setEmail(e.target.value)} />
        </Field>
        <Field label="Senha" error={fieldErrors.password}>
          <Input type="password" value={password} onChange={(e) => setPassword(e.target.value)} />
        </Field>
        {general && <FormError>{general}</FormError>}
        <Button type="submit" disabled={mutation.isPending}>
          {mutation.isPending ? 'Entrando...' : 'Entrar'}
        </Button>
      </form>
      <p className="mt-6 text-sm text-muted">
        Não tem conta?{' '}
        <Link to="/cadastro" className={linkButtonClass('inlineLink')}>
          Cadastre-se
        </Link>
      </p>
    </main>
  )
}
