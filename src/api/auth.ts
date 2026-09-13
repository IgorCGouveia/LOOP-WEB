import { http, unwrap } from './client'
import type { LoginData, User } from './types'
import type { CreateUserInput, LoginInput } from '../lib/schemas'

export function signup(input: CreateUserInput) {
  return unwrap<User>(http.post('/users', input))
}

export function login(input: LoginInput) {
  return unwrap<LoginData>(http.post('/login', input))
}

export function refresh() {
  return unwrap<LoginData>(http.post('/refresh'))
}

export function logout() {
  return unwrap<null>(http.post('/logout'))
}
