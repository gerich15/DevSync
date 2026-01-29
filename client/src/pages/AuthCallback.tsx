import { useEffect, useState } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { setToken, getBackendBase } from '../hooks/useGitHubAuth'

export default function AuthCallback() {
  const [searchParams] = useSearchParams()
  const navigate = useNavigate()
  const [error, setError] = useState<string | null>(null)
  // Токен из hash (#token=...) или query (?token=...)
  const tokenFromHash = typeof window !== 'undefined' && window.location.hash
    ? new URLSearchParams(window.location.hash.slice(1)).get('token')
    : null
  const token = tokenFromHash ?? searchParams.get('token')

  useEffect(() => {
    if (!token) {
      const errorMsg = searchParams.get('error')
      navigate('/login' + (errorMsg ? `?error=${encodeURIComponent(errorMsg)}` : ''), { replace: true })
      return
    }
    const base = getBackendBase()
    const url = base ? `${base}/api/auth/confirm` : '/api/auth/confirm'
    fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ token }),
    })
      .then((res) => {
        if (res.ok) {
          setToken(token)
          window.location.replace('/')
        } else {
          res.json().catch(() => ({})).then((data: { error?: string }) => {
            setError((data as { error?: string })?.error ?? 'Ошибка входа')
          })
        }
      })
      .catch(() => setError('Сервер недоступен'))
  }, [token, searchParams, navigate])

  if (error) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center gap-4 bg-background p-6">
        <p className="text-error">{error}</p>
        <button
          type="button"
          onClick={() => navigate('/login', { replace: true })}
          className="rounded-lg bg-primary px-4 py-2 text-white"
        >
          На страницу входа
        </button>
      </div>
    )
  }
  return (
    <div className="flex min-h-screen items-center justify-center">
      <div className="h-10 w-10 animate-spin rounded-full border-2 border-primary border-t-transparent" />
    </div>
  )
}
