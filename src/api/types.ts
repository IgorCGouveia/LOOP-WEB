export type Role = 'USER' | 'ADMIN'

export interface User {
  id: string
  email: string
  name: string
  role: Role
}

export type ScheduleType = 'DAILY' | 'WEEKLY' | 'INTERVAL'

export interface Schedule {
  id: string
  habitId: string
  effectiveFrom: string
  effectiveFromAt: string
  effectiveTo: string | null
  effectiveToAt: string | null
  targetPerDay: number
  type: ScheduleType
  daysOfWeek: number[]
  intervalDays: number | null
}

export interface Habit {
  id: string
  name: string
  description: string | null
  createdAt: string
  updatedAt: string
  userId: string
  longestStreak: number
  longestStreakStartDate: string | null
  graceTokens: number
  graceTokensUpdatedAt: string
  schedule: Schedule
}

export interface Checkin {
  id: string
  habitId: string
  date: string
  kind: 'CHECKIN' | 'UNDO'
  checkedAt: string
}

export interface CheckinResult {
  checkin: Checkin
  currentStreak: number
  longestStreak: number
  graceTokens: number
  todayProgress: { count: number; target: number }
}

export interface LoginData {
  accessToken: string
  expiresIn: string
  name: string
  id: string
  role: Role
}
