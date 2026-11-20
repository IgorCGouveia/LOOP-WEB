import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { formatCalendarDate } from './dates'

// Regression for #14: datas de calendário apareciam um dia antes em fusos negativos.
describe('formatCalendarDate', () => {
  beforeEach(() => {
    vi.stubEnv('TZ', 'America/Sao_Paulo')
  })
  afterEach(() => {
    vi.unstubAllEnvs()
  })

  it('mantém o dia de uma data só com Y-M-D em fuso negativo', () => {
    // sanity: o jeito antigo realmente erra neste fuso
    expect(new Date('2026-11-19').toLocaleDateString('pt-BR')).toBe('18/11/2026')
    expect(formatCalendarDate('2026-11-19')).toBe('19/11/2026')
  })

  it('mantém o dia de um ISO em meia-noite UTC', () => {
    expect(formatCalendarDate('2026-11-19T00:00:00.000Z')).toBe('19/11/2026')
  })

  it('devolve a string original se ela não for uma data', () => {
    expect(formatCalendarDate('ontem')).toBe('ontem')
  })
})
