// Checkin.date é uma data de calendário (o dia que a API fechou no fuso da
// conta), não um instante. `new Date('2026-11-19')` vira meia-noite UTC e, em
// qualquer fuso negativo (America/Sao_Paulo incluso), aparece como 18/11 (#14).
// Formatamos direto das partes Y-M-D, sem conversão de fuso. Aceita tanto
// 'YYYY-MM-DD' quanto um ISO com hora ('YYYY-MM-DDT00:00:00.000Z').
export function formatCalendarDate(date: string): string {
  const match = /^(\d{4})-(\d{2})-(\d{2})/.exec(date)
  if (!match) return date
  const [, year, month, day] = match
  return `${day}/${month}/${year}`
}
