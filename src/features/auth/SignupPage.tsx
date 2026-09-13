import { useState } from 'react'
import { useMutation } from '@tanstack/react-query'
import { Link, useNavigate } from 'react-router-dom'
import { signup } from '../../api/auth'
import { CreateUserVal } from '../../lib/schemas'
import { apiFieldErrors, zodFieldErrors, type FieldErrors } from '../../lib/formErrors'
import { Button, ErrorText, Field, Input, Select } from '../../components/ui'

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
    <div className="mx-auto flex min-h-svh max-w-sm flex-col justify-center gap-6 px-4 py-8">
      <div>
        <p className="font-mono text-xs text-muted">loop-web</p>
        <h1 className="text-2xl font-semibold text-text">Criar conta</h1>
      </div>
      <form onSubmit={handleSubmit} className="flex flex-col gap-4">
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
        {general && <ErrorText>{general}</ErrorText>}
        <Button type="submit" disabled={mutation.isPending}>
          {mutation.isPending ? 'Criando...' : 'Criar conta'}
        </Button>
      </form>
      <p className="text-sm text-muted">
        Já tem conta?{' '}
        <Link to="/login" className="text-accent hover:text-accent-hover">
          Entrar
        </Link>
      </p>
    </div>
  )
}
