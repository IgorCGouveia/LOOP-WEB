import { describe, expect, it } from 'vitest'
import { netCheckins } from './checkins'
import { checkinEvent } from '../test/fixtures'

// Regression for #17: UNDO aparecia no histórico como mais um check-in.
describe('netCheckins', () => {
  it('um UNDO cancela o check-in do mesmo dia', () => {
    const events = [
      checkinEvent({ id: 'a', checkedAt: '2026-11-19T10:00:00Z' }),
      checkinEvent({ id: 'b', kind: 'UNDO', checkedAt: '2026-11-19T10:01:00Z' }),
    ]
    expect(netCheckins(events)).toEqual([])
  })

  it('check-in, undo e check-in de novo deixa só o último', () => {
    const events = [
      checkinEvent({ id: 'a', checkedAt: '2026-11-19T10:00:00Z' }),
      checkinEvent({ id: 'b', kind: 'UNDO', checkedAt: '2026-11-19T10:01:00Z' }),
      checkinEvent({ id: 'c', checkedAt: '2026-11-19T10:02:00Z' }),
    ]
    expect(netCheckins(events).map((e) => e.id)).toEqual(['c'])
  })

  it('em dia com meta > 1, o undo cancela só o check-in mais recente', () => {
    const events = [
      checkinEvent({ id: 'a', checkedAt: '2026-11-19T08:00:00Z' }),
      checkinEvent({ id: 'b', checkedAt: '2026-11-19T09:00:00Z' }),
      checkinEvent({ id: 'u', kind: 'UNDO', checkedAt: '2026-11-19T09:30:00Z' }),
    ]
    expect(netCheckins(events).map((e) => e.id)).toEqual(['a'])
  })

  it('não depende da ordem da API e preserva a ordem de entrada', () => {
    const events = [
      checkinEvent({ id: 'u', kind: 'UNDO', checkedAt: '2026-11-19T10:01:00Z' }),
      checkinEvent({ id: 'old', date: '2026-11-18', checkedAt: '2026-11-18T10:00:00Z' }),
      checkinEvent({ id: 'a', checkedAt: '2026-11-19T10:00:00Z' }),
    ]
    expect(netCheckins(events).map((e) => e.id)).toEqual(['old'])
  })

  it('não cruza hábitos nem dias', () => {
    const events = [
      checkinEvent({ id: 'a', habitId: 'h1', checkedAt: '2026-11-19T10:00:00Z' }),
      checkinEvent({ id: 'u', habitId: 'h2', kind: 'UNDO', checkedAt: '2026-11-19T10:01:00Z' }),
      checkinEvent({ id: 'u2', date: '2026-11-20', kind: 'UNDO', checkedAt: '2026-11-20T10:01:00Z' }),
    ]
    expect(netCheckins(events).map((e) => e.id)).toEqual(['a'])
  })
})
