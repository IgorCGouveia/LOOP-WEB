import { http, refreshSession, unwrap } from './client'
import type { LoginData, User } from './types'
import type { CreateUserInput, LoginInput } from '../lib/schemas'

export function signup(input: CreateUserInput) {
  return unwrap<User>(http.post('/users', input))
}

export function login(input: LoginInput) {
  return unwrap<LoginData>(http.post('/login', input))
}

// Passa pelo refresh compartilhado do client (#10): o boot e um 401 do
// interceptor nunca disparam dois POST /refresh ao mesmo tempo.
export function refresh() {
  return refreshSession()
}

export function logout() {
  return unwrap<null>(http.post('/logout'))
}
