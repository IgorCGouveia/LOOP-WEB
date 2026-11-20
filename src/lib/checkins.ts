import type { Checkin } from '../api/types'

// A API guarda check-ins como um log de eventos: desfazer cria uma linha UNDO
// em vez de apagar o CHECKIN. Pra exibir histórico, dobramos o log em check-ins
// líquidos (#17): cada UNDO cancela o CHECKIN mais recente anterior a ele no
// mesmo hábito e dia. A ordem de entrada é preservada na saída; a ordem de
// pareamento vem de `checkedAt`, então a função não depende da ordenação da API.
// Se um dia a API filtrar UNDO no servidor, isto vira um no-op.
export function netCheckins(events: Checkin[]): Checkin[] {
  const chronological = [...events].sort((a, b) => a.checkedAt.localeCompare(b.checkedAt))
  const open = new Map<string, Checkin[]>()
  const cancelled = new Set<string>()

  for (const event of chronological) {
    const key = `${event.habitId}|${event.date.slice(0, 10)}`
    const stack = open.get(key) ?? []
    if (event.kind === 'CHECKIN') {
      stack.push(event)
      open.set(key, stack)
    } else {
      const undone = stack.pop()
      if (undone) cancelled.add(undone.id)
    }
  }

  return events.filter((e) => e.kind === 'CHECKIN' && !cancelled.has(e.id))
}
