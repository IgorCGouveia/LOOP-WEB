import { useEffect } from 'react'

// Cada página declara o próprio título (#9, ADR-0006). Um hook por página em
// vez de um mapa rota → título central: a página de detalhe precisa do nome do
// hábito, que só ela conhece.
export function usePageTitle(title: string) {
  useEffect(() => {
    document.title = `${title} · LOOP`
  }, [title])
}
