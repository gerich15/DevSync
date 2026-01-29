import axios from 'axios'

/** baseURL: в dev на 3100 — прямо на backend 8181, чтобы заголовок Authorization не терялся в прокси. */
function getApiBaseURL(): string {
  if (import.meta.env.VITE_API_URL) {
    return import.meta.env.VITE_API_URL.replace(/\/?$/, '')
  }
  if (typeof window !== 'undefined' && (window.location.port === '3100' || window.location.port === '3000')) {
    return 'http://localhost:8181/api'
  }
  return '/api'
}

const api = axios.create({
  baseURL: getApiBaseURL(),
  headers: { 'Content-Type': 'application/json' },
})

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('devsync_token')
  if (token) config.headers.Authorization = `Bearer ${token}`
  return config
})

api.interceptors.response.use(
  (r) => r,
  (err) => {
    const status = err.response?.status
    const url = err.config?.url ?? ''
    // 401 или 404 на /user — невалидный/устаревший токен, сбрасываем и на логин
    if (status === 401 || (status === 404 && (url === '/user' || url.startsWith('/user')))) {
      localStorage.removeItem('devsync_token')
      window.location.href = '/login'
    }
    return Promise.reject(err)
  },
)

export default api
