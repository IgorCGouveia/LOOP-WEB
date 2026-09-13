import type { Schedule } from '../../api/types'

const WEEKDAY_LABELS = ['dom', 'seg', 'ter', 'qua', 'qui', 'sex', 'sáb']

export function scheduleSummary(schedule: Schedule): string {
  const target = schedule.targetPerDay > 1 ? ` (${schedule.targetPerDay}x/dia)` : ''
  switch (schedule.type) {
    case 'DAILY':
      return `Todo dia${target}`
    case 'WEEKLY':
      return `${schedule.daysOfWeek.map((d) => WEEKDAY_LABELS[d]).join(', ')}${target}`
    case 'INTERVAL':
      return `A cada ${schedule.intervalDays} dias${target}`
  }
}
