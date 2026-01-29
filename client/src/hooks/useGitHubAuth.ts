import { useQuery } from '@tanstack/react-query'
import api from '../services/api'
import type { User } from '../types/github'

export function useAuth() {
  const token = localStorage.getItem('devsync_token')
  const { data: user, isLoading, error } = useQuery({
    queryKey: ['user', token],
    queryFn: async () => {
      const { data } = await api.get<User>('/user')
      return data
    },
    enabled: !!token,
    retry: false,
  })
  return {
    user: user ?? null,
    isAuthenticated: !!user && !!token,
    isLoading: !!token && isLoading,
    error,
  }
}

/** Базовый URL backend (без /api). Для dev на 3100 — http://localhost:8181. */
export function getBackendBase(): string {
  const apiBase = import.meta.env.VITE_API_URL
  if (apiBase) {
    return apiBase.replace(/\/api\/?$/, '')
  }
  if (typeof window !== 'undefined' && (window.location.port === '3100' || window.location.port === '3000')) {
    return 'http://localhost:8181'
  }
  return ''
}

export function getGitHubLoginUrl() {
  const base = getBackendBase()
  return base ? `${base}/api/auth/github` : '/api/auth/github'
}

export function setToken(token: string) {
  localStorage.setItem('devsync_token', token)
}

export function logout() {
  localStorage.removeItem('devsync_token')
  window.location.href = '/login'
}
