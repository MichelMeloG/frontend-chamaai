import type { ApiDetail } from './types'

export const API_BASE = import.meta.env.VITE_API_BASE || '/api'

export function apiFetch(path: string, options: RequestInit = {}) {
  const token = localStorage.getItem('accessToken')
  const headers: HeadersInit = {
    'Content-Type': 'application/json',
    ...options.headers,
  }

  if (token) {
    headers.Authorization = `Bearer ${token}`
  }

  return fetch(`${API_BASE}${path}`, { ...options, headers })
}

export async function readErrorMessage(
  response: Response,
  fallbackMessage: string,
) {
  try {
    const data = (await response.json()) as { detail?: ApiDetail }
    const detail = data?.detail
    if (!detail) return fallbackMessage
    if (typeof detail === 'string') return detail
    if (Array.isArray(detail)) {
      return detail
        .map((item) => (typeof item === 'string' ? item : item?.msg || 'Erro'))
        .join(' | ')
    }
    if (typeof detail === 'object') return detail.msg || fallbackMessage
    return String(detail)
  } catch (error) {
    return fallbackMessage
  }
}
