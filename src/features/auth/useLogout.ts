import { useCallback, useEffect, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { logout } from '../../api/auth'
import { isAuthRejection } from '../../api/client'
import { useToast } from '../../components/Toast'
import { clearLocalSession } from './session'

// Política de logout (#5, ADR-0004): bloquear e oferecer retry. O cookie de
// refresh é httpOnly, então só o servidor consegue invalidá-lo. Se o
// POST /logout falhar e mesmo assim mostrássemos a tela de login, o próximo
// reload restauraria a sessão em silêncio. Então, se falhar, a sessão local
// fica como está, nada de navegar, e um toast de erro oferece "Tentar de novo".
export function useLogout() {
  const navigate = useNavigate()
  const toast = useToast()
  const [isPending, setIsPending] = useState(false)
  // o retry do toast chama a versão mais recente de `run`
  const runRef = useRef<(message?: string) => Promise<boolean>>(async () => false)

  const run = useCallback(
    async (failureMessage = 'Não foi possível sair. Sua sessão continua ativa.'): Promise<boolean> => {
      setIsPending(true)
      try {
        await logout()
      } catch (err) {
        // 401/403 aqui quer dizer que o servidor já não reconhece a sessão
        // (ex. conta recém-deletada): não há nada pra encerrar, então é sucesso.
        if (!isAuthRejection(err)) {
          setIsPending(false)
          toast(failureMessage, 'error', { action: { label: 'Tentar de novo', onClick: () => void runRef.current(failureMessage) } })
          return false
        }
      }
      setIsPending(false)
      clearLocalSession()
      navigate('/login')
      return true
    },
    [navigate, toast],
  )

  useEffect(() => {
    runRef.current = run
  }, [run])

  return { logout: run, isPending }
}
