import { useState } from 'react'
import { useSearchParams, Link } from 'react-router-dom'
import { getGitHubLoginUrl, getBackendBase } from '../hooks/useGitHubAuth'
import { motion } from 'framer-motion'
import { HeroGeometricBackground } from '../components/ui/shape-landing-hero'
import FloatingPaths from '../components/ui/FloatingPaths'

function GithubIcon(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      fill="currentColor"
      className="size-4"
      {...props}
    >
      <path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z" />
    </svg>
  )
}

export default function Login() {
  const [searchParams] = useSearchParams()
  const errorMsg = searchParams.get('error')
  const [oauthError, setOauthError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  async function handleGitHubClick(e: React.MouseEvent<HTMLButtonElement>) {
    e.preventDefault()
    e.stopPropagation()
    if (loading) return
    setOauthError(null)
    setLoading(true)
    try {
      const base = getBackendBase()
      const checkUrl = base ? `${base}/api/auth/github/check` : '/api/auth/github/check'
      const checkRes = await fetch(checkUrl, { method: 'GET' })
      const data = await checkRes.json().catch(() => ({}))
      if (checkRes.status === 503 || checkRes.status === 502) {
        const hint = (data as { hint?: string }).hint ?? (data as { error?: string }).error ?? 'Настройте GitHub OAuth в .env'
        setOauthError(hint)
        return
      }
      if (checkRes.ok && (data as { ok?: boolean }).ok) {
        window.location.assign(getGitHubLoginUrl())
        return
      }
      setOauthError((data as { hint?: string }).hint ?? 'Не удалось проверить настройки. Запустите backend.')
    } catch {
      setOauthError('Сервер недоступен. Запустите backend (go run ./cmd/server) и откройте http://localhost:3100')
    } finally {
      setLoading(false)
    }
  }

  return (
    <main className="relative md:min-h-screen lg:grid lg:grid-cols-2">
      {/* Левая колонка: бренд + цитата + FloatingPaths (только lg) */}
      <div className="relative hidden min-h-screen flex-col border-r border-white/10 bg-surface/60 p-10 lg:flex">
        <div className="absolute inset-0 z-0 bg-gradient-to-t from-background to-transparent" />
        <div className="relative z-10 flex items-center gap-2">
          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary/20 text-primary">
            <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
            </svg>
          </div>
          <p className="text-xl font-semibold text-white">DevSync</p>
        </div>
        <div className="relative z-10 mt-auto">
          <blockquote className="space-y-2">
            <p className="text-lg text-slate-300">
              &ldquo;Автоматический сбор и визуализация GitHub-активности. Обновляйте портфолио без ручной работы.&rdquo;
            </p>
            <footer className="font-mono text-sm font-semibold text-slate-500">DevSync</footer>
          </blockquote>
        </div>
        <div className="absolute inset-0">
          <FloatingPaths position={1} />
          <FloatingPaths position={-1} />
        </div>
      </div>

      {/* Правая колонка: фон HeroGeometric + форма входа */}
      <div className="relative flex min-h-screen flex-col justify-center p-4">
        <HeroGeometricBackground className="-z-10" />

        <Link
          to="/"
          className="absolute left-5 top-7 flex items-center gap-2 rounded-lg px-3 py-2 text-sm text-slate-400 transition hover:bg-white/10 hover:text-white"
        >
          <svg className="size-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
          На главную
        </Link>

        <div className="mx-auto w-full max-w-sm space-y-6">
          <div className="flex items-center gap-2 lg:hidden">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary/20 text-primary">
              <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
              </svg>
            </div>
            <p className="text-xl font-semibold text-white">DevSync</p>
          </div>

          <motion.div
            className="flex flex-col space-y-1"
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4 }}
          >
            <h1 className="text-2xl font-bold tracking-wide text-white">
              Вход в DevSync
            </h1>
            <p className="text-base text-slate-400">
              Войдите через GitHub, чтобы видеть статистику репозиториев и контрибуций.
            </p>
          </motion.div>

          {(errorMsg || oauthError) && (
            <div className="rounded-lg border border-error/30 bg-error/10 px-3 py-2 text-sm text-error">
              {oauthError ?? (errorMsg ? decodeURIComponent(errorMsg) : null)}
            </div>
          )}

          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, delay: 0.1 }}
          >
            <button
              type="button"
              onClick={handleGitHubClick}
              disabled={loading}
              className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-white px-6 py-3 text-base font-medium text-black transition hover:bg-slate-200 disabled:opacity-50"
            >
              <GithubIcon />
              {loading ? 'Проверка...' : 'Войти через GitHub'}
            </button>
          </motion.div>

          <p className="text-center text-sm text-slate-500">
            Мы читаем только публичные репозитории и активность.
          </p>
        </div>
      </div>
    </main>
  )
}
