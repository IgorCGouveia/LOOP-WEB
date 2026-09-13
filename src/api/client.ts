import axios, { AxiosError, type InternalAxiosRequestConfig } from 'axios'
import { useAuthStore } from '../features/auth/useAuthStore'
import { ApiError, type ErrorEnvelope, type SuccessEnvelope } from './envelope'

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

interface RetriableConfig extends InternalAxiosRequestConfig {
  _retried?: boolean
}

http.interceptors.response.use(
  (response) => response,
  async (error: AxiosError<ErrorEnvelope>) => {
    const original = error.config as RetriableConfig | undefined
    const status = error.response?.status

    if (status !== 401 || !original || original._retried || original.url === '/refresh') {
      if (error.response) throw new ApiError(status ?? 0, error.response.data)
      throw error
    }

    original._retried = true
    try {
      const { data } = await refreshClient.post<SuccessEnvelope<{ accessToken: string; id: string; name: string; role: 'USER' | 'ADMIN' }>>(
        '/refresh',
      )
      useAuthStore.getState().setSession(data.data)
      original.headers.Authorization = `Bearer ${data.data.accessToken}`
      return http(original)
    } catch {
      useAuthStore.getState().clearSession()
      throw new ApiError(401, { error: 'Sessão expirada.' })
    }
  },
)

export async function unwrap<T>(promise: Promise<{ data: SuccessEnvelope<T> }>): Promise<T> {
  try {
    const { data } = await promise
    return data.data
  } catch (err) {
    if (err instanceof ApiError) throw err
    if (axios.isAxiosError<ErrorEnvelope>(err) && err.response) {
      throw new ApiError(err.response.status, err.response.data)
    }
    throw err
  }
}
