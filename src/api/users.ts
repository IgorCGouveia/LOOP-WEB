import { http, unwrap } from './client'
import type { User } from './types'
import type { UpdateUserInput } from '../lib/schemas'

export function updateProfile(id: string, input: UpdateUserInput) {
  return unwrap<User>(http.patch(`/users/${id}`, input))
}

export function deleteAccount(id: string) {
  return unwrap<User>(http.delete(`/users/${id}`))
}

// admin
export function listAllUsers() {
  return unwrap<User[]>(http.get('/users'))
}

export function deleteUser(id: string) {
  return unwrap<User>(http.delete(`/users/${id}`))
}
