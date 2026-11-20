import axios, { AxiosError, type InternalAxiosRequestConfig } from 'axios'
import { useAuthStore } from '../features/auth/useAuthStore'
import { clearLocalSession } from '../features/auth/session'
import { ApiError, type ErrorEnvelope, type SuccessEnvelope } from './envelope'
import type { LoginData } from './types'

const baseURL = import.meta.env.VITE_API_URL

export const http = axios.create({
  baseURL,
  withCredentials: true, // obrigatório pro cookie httpOnly de refresh viajar
})

http.interceptors.request.use((config) => {
  const token = useAuthStore.getState().accessToken
  if (token) config.headers.Authorization = `Bearer ${token}`
  return config
})

// instância separada pro /refresh: se passasse pelos interceptors de
// `http`, um 401 do próprio refresh entraria num loop tentando se
// refrescar de novo.
const refreshClient = axios.create({ baseURL, withCredentials: true })

function toApiError(err: unknown): unknown {
  if (axios.isAxiosError<ErrorEnvelope>(err) && err.response) {
    const body = err.response.data
    return new ApiError(err.response.status, body && typeof body.error === 'string' ? body : { error: err.message })
  }
  return err
}

// Só uma resposta do servidor recusando a credencial encerra a sessão. Rede
// fora, timeout de cold start ou 5xx não dizem nada sobre o cookie (#11).
export function isAuthRejection(err: unknown): boolean {
  return err instanceof ApiError && (err.status === 401 || err.status === 403)
}

// Um refresh em andamento por vez (#10). Se a API rotaciona o refresh token
// com detecção de reuso, dois POST /refresh paralelos fariam o segundo ser
// rejeitado e derrubar a sessão que o primeiro acabou de renovar. Todo mundo
// que precisa de refresh — os 401 paralelos do interceptor e o boot (inclusive
// o efeito duplo do StrictMode em dev) — aguarda a mesma promise.
//
// O efeito no store acontece aqui dentro, uma vez por refresh: sucesso grava a
// sessão; rejeição de credencial limpa sessão e cache. Falha transitória não
// mexe em nada e só repassa o erro.
let refreshing: Promise<LoginData> | null = null

export function refreshSession(): Promise<LoginData> {
  refreshing ??= refreshClient
    .post<SuccessEnvelope<LoginData>>('/refresh')
    .then(({ data }) => {
      useAuthStore.getState().setSession(data.data)
      return data.data
    })
    .catch((err: unknown) => {
      const error = toApiError(err)
      if (isAuthRejection(error)) clearLocalSession()
      throw error
    })
    .finally(() => {
      refreshing = null
    })
  return refreshing
}

interface RetriableConfig extends InternalAxiosRequestConfig {
  _retried?: boolean
}

http.interceptors.response.use(
  (response) => response,
  async (error: AxiosError<ErrorEnvelope>) => {
    const original = error.config as RetriableConfig | undefined
    const status = error.response?.status

    // Sem Authorization não havia sessão pra renovar (ex. 401 do /login por
    // senha errada): devolve o erro da própria API em vez de "Sessão expirada".
    const hadToken = Boolean(original?.headers?.Authorization)

    if (status !== 401 || !original || original._retried || !hadToken) {
      throw toApiError(error)
    }

    original._retried = true
    let session: LoginData
    try {
      session = await refreshSession()
    } catch (refreshError) {
      if (isAuthRejection(refreshError)) throw new ApiError(401, { error: 'Sessão expirada.' })
      // Rede/5xx no refresh: a sessão continua; quem chamou recebe o erro e
      // mostra o estado de erro dele, sem redirecionar pro login.
      throw refreshError
    }
    original.headers.Authorization = `Bearer ${session.accessToken}`
    return http(original)
  },
)

export async function unwrap<T>(promise: Promise<{ data: SuccessEnvelope<T> }>): Promise<T> {
  try {
    const { data } = await promise
    return data.data
  } catch (err) {
    if (err instanceof ApiError) throw err
    throw toApiError(err)
  }
}
