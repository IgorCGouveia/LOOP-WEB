import type { Checkin, Habit } from '../api/types'

export function habit(overrides: Partial<Habit> = {}): Habit {
  return {
    id: 'h1',
    name: 'Ler',
    description: 'ler 10 páginas',
    createdAt: '2026-11-01T00:00:00.000Z',
    updatedAt: '2026-11-01T00:00:00.000Z',
    userId: 'u1',
    longestStreak: 3,
    longestStreakStartDate: null,
    graceTokens: 1,
    graceTokensUpdatedAt: '2026-11-01T00:00:00.000Z',
    schedule: {
      id: 's1',
      habitId: 'h1',
      effectiveFrom: '2026-11-01',
      effectiveFromAt: '2026-11-01T00:00:00.000Z',
      effectiveTo: null,
      effectiveToAt: null,
      targetPerDay: 1,
      type: 'WEEKLY',
      daysOfWeek: [1, 3],
      intervalDays: null,
    },
    ...overrides,
  }
}

export function checkinEvent(overrides: Partial<Checkin> & Pick<Checkin, 'id'>): Checkin {
  return {
    habitId: 'h1',
    date: '2026-11-19',
    kind: 'CHECKIN',
    checkedAt: '2026-11-19T12:00:00.000Z',
    ...overrides,
  }
}
