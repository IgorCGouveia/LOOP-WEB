import { useEffect, type RefObject } from 'react'

// Depois de um submit que falhou, leva o foco pro primeiro campo inválido —
// leitor de tela anuncia o campo, o estado inválido e a mensagem ligada por
// aria-describedby (#4). Roda só quando o objeto de erros muda, e os forms só
// trocam esse objeto no submit. Grupos sem aria-invalid válido (ex. dias da
// semana, role="group") se marcam com data-invalid e tabIndex={-1}.
export function useFocusFirstInvalid(formRef: RefObject<HTMLFormElement | null>, errors: Record<string, string>) {
  useEffect(() => {
    if (Object.keys(errors).length === 0) return
    formRef.current?.querySelector<HTMLElement>('[aria-invalid="true"], [data-invalid="true"]')?.focus()
  }, [errors, formRef])
}
