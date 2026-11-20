import { useRef, useState } from 'react'
import { useMutation } from '@tanstack/react-query'
import { Link, useNavigate } from 'react-router-dom'
import { signup } from '../../api/auth'
import { CreateUserVal } from '../../lib/schemas'
import { apiFieldErrors, zodFieldErrors, type FieldErrors } from '../../lib/formErrors'
import { Button, Field, FormError, Input, PageHeader, linkButtonClass, Select } from '../../components/ui'
import { usePageTitle } from '../../lib/usePageTitle'
import { useFocusFirstInvalid } from '../../lib/useFocusFirstInvalid'

const TIMEZONES = Intl.supportedValuesOf('timeZone')
const detectedTimezone = Intl.DateTimeFormat().resolvedOptions().timeZone

export function SignupPage() {
  const navigate = useNavigate()
  const [form, setForm] = useState({
    name: '',
    email: '',
    password: '',
    confirmPassword: '',
    timezone: TIMEZONES.includes(detectedTimezone) ? detectedTimezone : 'UTC',
  })
  const [fieldErrors, setFieldErrors] = useState<FieldErrors>({})
  const [general, setGeneral] = useState<string>()
  const formRef = useRef<HTMLFormElement>(null)
  usePageTitle('Criar conta')
  useFocusFirstInvalid(formRef, fieldErrors)

  const mutation = useMutation({
    mutationFn: signup,
    onSuccess: () => navigate('/login'),
    onError: (error) => {
      const { fields, general } = apiFieldErrors(error)
      setFieldErrors(fields)
      setGeneral(general)
    },
  })

  function set<K extends keyof typeof form>(key: K, value: (typeof form)[K]) {
    setForm((f) => ({ ...f, [key]: value }))
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setFieldErrors({})
    setGeneral(undefined)
    const parsed = CreateUserVal.safeParse(form)
    if (!parsed.success) {
      setFieldErrors(zodFieldErrors(parsed.error))
      return
    }
    mutation.mutate(parsed.data)
  }

  return (
    <main className="mx-auto flex min-h-svh max-w-sm flex-col justify-center px-4 py-8">
      <PageHeader eyebrow="loop-web" title="Criar conta" />
      <form ref={formRef} onSubmit={handleSubmit} noValidate className="flex flex-col gap-4">
        <Field label="Nome" error={fieldErrors.name}>
          <Input value={form.name} onChange={(e) => set('name', e.target.value)} />
        </Field>
        <Field label="Email" error={fieldErrors.email}>
          <Input type="email" value={form.email} onChange={(e) => set('email', e.target.value)} />
        </Field>
        <Field label="Senha" error={fieldErrors.password}>
          <Input type="password" value={form.password} onChange={(e) => set('password', e.target.value)} />
        </Field>
        <Field label="Confirmar senha" error={fieldErrors.confirmPassword}>
          <Input
            type="password"
            value={form.confirmPassword}
            onChange={(e) => set('confirmPassword', e.target.value)}
          />
        </Field>
        <Field label="Fuso horário" error={fieldErrors.timezone}>
          <Select value={form.timezone} onChange={(e) => set('timezone', e.target.value)}>
            {TIMEZONES.map((tz) => (
              <option key={tz} value={tz}>
                {tz}
              </option>
            ))}
          </Select>
        </Field>
        <p className="text-xs text-muted">
          O fuso horário não pode ser alterado depois do cadastro sem afetar dias já
          fechados — confira bem antes de continuar.
        </p>
        {general && <FormError>{general}</FormError>}
        <Button type="submit" disabled={mutation.isPending}>
          {mutation.isPending ? 'Criando...' : 'Criar conta'}
        </Button>
      </form>
      <p className="mt-6 text-sm text-muted">
        Já tem conta?{' '}
        <Link to="/login" className={linkButtonClass('inlineLink')}>
          Entrar
        </Link>
      </p>
    </main>
  )
}
