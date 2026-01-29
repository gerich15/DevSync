import { useState, useCallback } from 'react'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import api from '../services/api'
import { useGitHubStats, type StatsPeriod } from '../hooks/useGitHubStats'
import { useAuth } from '../hooks/useGitHubAuth'
import { useWebSocket } from '../hooks/useWebSocket'
import HeatmapChart from '../components/dashboard/HeatmapChart'
import LanguagePieChart from '../components/dashboard/LanguagePieChart'
import RepoList from '../components/dashboard/RepoList'
import CommitsTimeline from '../components/dashboard/CommitsTimeline'
import AnimatedCard from '../components/ui/AnimatedCard'
import BeamsBackground from '../components/ui/BeamsBackground'

const PERIOD_LABELS: Record<StatsPeriod, string> = {
  week: 'Неделя',
  month: 'Месяц',
  year: 'Год',
}

function getApiErrorMessage(err: unknown): string {
  const e = err as { response?: { data?: { error?: string; detail?: string } }; message?: string }
  return e?.response?.data?.error ?? e?.response?.data?.detail ?? (e?.message as string) ?? 'Неизвестная ошибка'
}

export default function Dashboard() {
  const queryClient = useQueryClient()
  const { user } = useAuth()
  const [period, setPeriod] = useState<StatsPeriod>('year')
  const { data: stats, isLoading, error } = useGitHubStats(period)
  const onWsMessage = useCallback(
    (event: string) => {
      if (event === 'stats_updated') {
        queryClient.invalidateQueries({ queryKey: ['user-stats'] })
        queryClient.invalidateQueries({ queryKey: ['user'] })
      }
    },
    [queryClient],
  )
  useWebSocket(user?.id ?? null, onWsMessage)
  const sync = useMutation({
    mutationFn: () => api.post('/user/sync'),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['user-stats'] })
      queryClient.invalidateQueries({ queryKey: ['user'] })
    },
  })

  const hasNoData = stats && stats.total_repos === 0 && stats.contribution_sum === 0

  if (isLoading) {
    return (
      <div className="flex min-h-[50vh] flex-col items-center justify-center gap-4">
        <div className="h-12 w-12 animate-spin rounded-full border-2 border-primary border-t-transparent" />
        <p className="text-slate-400">Загрузка статистики...</p>
      </div>
    )
  }
  if (error || !stats) {
    return (
      <div className="rounded-xl border border-error/30 bg-error/10 p-6 text-error">
        Не удалось загрузить статистику. Попробуйте обновить страницу или синхронизировать в Настройках.
      </div>
    )
  }

  const contributions = stats.contributions ?? []
  const languages = stats.languages ?? []
  const topRepos = stats.top_repos ?? []

  return (
    <div className="relative min-h-full">
      <div className="absolute inset-0 -m-6">
        <BeamsBackground intensity="medium" />
      </div>
      <div className="relative z-10 space-y-8">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <h1 className="text-2xl font-bold text-white">Дашборд</h1>
        <div className="flex rounded-lg border border-white/10 bg-surface/50 p-1">
          {(['week', 'month', 'year'] as const).map((p) => (
            <button
              key={p}
              onClick={() => setPeriod(p)}
              className={`rounded-md px-3 py-1.5 text-sm font-medium transition ${
                period === p ? 'bg-primary text-white' : 'text-slate-400 hover:text-white'
              }`}
            >
              {PERIOD_LABELS[p]}
            </button>
          ))}
        </div>
      </div>

      {sync.isError && (
        <AnimatedCard className="border-error/50 bg-error/10">
          <p className="mb-2 text-error">Ошибка синхронизации: {getApiErrorMessage(sync.error)}</p>
          <p className="mb-4 text-sm text-slate-400">Проверьте доступ к GitHub или попробуйте позже.</p>
          <button
            onClick={() => sync.mutate()}
            disabled={sync.isPending}
            className="rounded-lg bg-primary px-4 py-2 text-white hover:bg-primary/90 disabled:opacity-50"
          >
            Повторить
          </button>
        </AnimatedCard>
      )}

      {hasNoData && !sync.isError && (
        <AnimatedCard className="border-primary/50 bg-primary/10">
          <p className="mb-4 text-slate-300">
            Данные с GitHub ещё не загружены. Нажмите «Синхронизировать», чтобы подтянуть репозитории и статистику.
          </p>
          <button
            onClick={() => sync.mutate()}
            disabled={sync.isPending}
            className="rounded-lg bg-primary px-4 py-2 font-medium text-white hover:bg-primary/90 disabled:opacity-50"
          >
            {sync.isPending ? 'Синхронизация...' : 'Синхронизировать с GitHub'}
          </button>
        </AnimatedCard>
      )}

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <AnimatedCard>
          <p className="text-sm text-slate-400">Репозитории</p>
          <p className="text-2xl font-bold text-white">{stats.total_repos}</p>
        </AnimatedCard>
        <AnimatedCard>
          <p className="text-sm text-slate-400">Звёзды</p>
          <p className="text-2xl font-bold text-white">{stats.total_stars}</p>
        </AnimatedCard>
        <AnimatedCard>
          <p className="text-sm text-slate-400">Форки</p>
          <p className="text-2xl font-bold text-white">{stats.total_forks}</p>
        </AnimatedCard>
        <AnimatedCard>
          <p className="text-sm text-slate-400">Контрибуции ({PERIOD_LABELS[period].toLowerCase()})</p>
          <p className="text-2xl font-bold text-white">{stats.contribution_sum}</p>
        </AnimatedCard>
      </div>
      <AnimatedCard>
        <h3 className="mb-4 text-lg font-semibold text-white">График контрибуций</h3>
        <HeatmapChart data={contributions} />
      </AnimatedCard>
      <div className="grid gap-6 lg:grid-cols-2">
        <AnimatedCard>
          <h3 className="mb-4 text-lg font-semibold text-white">Языки</h3>
          <LanguagePieChart data={languages} />
        </AnimatedCard>
        <AnimatedCard>
          <CommitsTimeline data={contributions} />
        </AnimatedCard>
      </div>
      <AnimatedCard>
        <h3 className="mb-4 text-lg font-semibold text-white">Топ репозиториев</h3>
        <RepoList repos={topRepos} />
      </AnimatedCard>
      </div>
    </div>
  )
}
