import { http, unwrap } from './client'
import type { Checkin, CheckinResult, Habit } from './types'
import type { CreateHabitInput, UpdateHabitInput } from '../lib/schemas'

export function listMyHabits() {
  return unwrap<Habit[]>(http.get('/me/habits'))
}

export function createHabit(input: CreateHabitInput) {
  return unwrap<Habit>(http.post('/habits', input))
}

export function updateHabit(id: string, input: UpdateHabitInput) {
  return unwrap<Habit>(http.patch(`/habits/${id}`, input))
}

export function deleteHabit(id: string) {
  return unwrap<Habit>(http.delete(`/habits/${id}`))
}

export function checkin(habitId: string) {
  return unwrap<CheckinResult>(http.post(`/habits/${habitId}/checkin`))
}

export function undoCheckin(habitId: string) {
  return unwrap<CheckinResult>(http.delete(`/habits/${habitId}/checkin`))
}

export function listCheckins(habitId: string) {
  return unwrap<Checkin[]>(http.get(`/habits/${habitId}/checkins`))
}

// admin
export function listAllHabits() {
  return unwrap<Habit[]>(http.get('/habits'))
}

export function listHabitsForUser(userId: string) {
  return unwrap<Habit[]>(http.get(`/users/${userId}/habits`))
}

export function listCheckinsForUser(userId: string) {
  return unwrap<Checkin[]>(http.get(`/users/${userId}/checkins`))
}
