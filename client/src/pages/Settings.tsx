import { useState, useEffect } from 'react'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import api from '../services/api'
import { GlowingEffect } from '../components/ui/GlowingEffect'
import WavyBackground from '../components/ui/WavyBackground'

const LANG_KEY = 'devsync_lang'
const THEME_KEY = 'devsync_theme'
const NOTIFICATIONS_KEY = 'devsync_notifications'

type Lang = 'ru' | 'en'
type Theme = 'light' | 'dark' | 'system'

const labels = {
  ru: {
    title: 'Настройки',
    language: 'Язык',
    languageDesc: 'Русский или English.',
    theme: 'Тема',
    themeDesc: 'Светлая, тёмная или по системе.',
    themeLight: 'Светлая',
    themeDark: 'Тёмная',
    themeSystem: 'Система',
    sync: 'Синхронизация',
    syncDesc: 'Обновить данные с GitHub вручную.',
    syncBtn: 'Синхронизировать',
    syncing: 'Синхронизация...',
    notifications: 'Уведомления',
    notificationsDesc: 'Показывать уведомления после синхронизации.',
    on: 'Вкл',
    off: 'Выкл',
  },
  en: {
    title: 'Settings',
    language: 'Language',
    languageDesc: 'Russian or English.',
    theme: 'Theme',
    themeDesc: 'Light, dark or system.',
    themeLight: 'Light',
    themeDark: 'Dark',
    themeSystem: 'System',
    sync: 'Sync',
    syncDesc: 'Manually refresh data from GitHub.',
    syncBtn: 'Sync now',
    syncing: 'Syncing...',
    notifications: 'Notifications',
    notificationsDesc: 'Show notifications after sync.',
    on: 'On',
    off: 'Off',
  },
}

interface GridItemProps {
  area: string
  icon: React.ReactNode
  title: string
  description: string
  children: React.ReactNode
}

function GridItem({ area, icon, title, description, children }: GridItemProps) {
  return (
    <li className={`min-h-[14rem] list-none ${area}`}>
      <div className="relative h-full rounded-[1.25rem] border border-white/10 p-2 md:rounded-[1.5rem] md:p-3">
        <GlowingEffect
          spread={40}
          glow
          disabled={false}
          proximity={64}
          inactiveZone={0.01}
          borderWidth={3}
        />
        <div className="relative flex h-full flex-col justify-between gap-4 overflow-hidden rounded-xl border border-white/10 bg-surface p-6 shadow-sm">
          <div className="flex flex-1 flex-col justify-between gap-3">
            <div className="w-fit rounded-lg border border-white/10 bg-background/80 p-2 text-primary">
              {icon}
            </div>
            <div className="space-y-2">
              <h3 className="text-xl font-semibold tracking-tight text-white md:text-2xl">
                {title}
              </h3>
              <p className="text-sm text-slate-400 md:text-base">{description}</p>
            </div>
            <div className="pt-2">{children}</div>
          </div>
        </div>
      </div>
    </li>
  )
}

export default function Settings() {
  const queryClient = useQueryClient()
  const [lang, setLang] = useState<Lang>(() => (localStorage.getItem(LANG_KEY) as Lang) || 'ru')
  const [theme, setTheme] = useState<Theme>(() => (localStorage.getItem(THEME_KEY) as Theme) || 'dark')
  const [notifications, setNotifications] = useState(() => localStorage.getItem(NOTIFICATIONS_KEY) !== 'false')

  useEffect(() => {
    localStorage.setItem(LANG_KEY, lang)
  }, [lang])

  useEffect(() => {
    localStorage.setItem(THEME_KEY, theme)
    const root = document.documentElement
    if (theme === 'system') {
      const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches
      root.setAttribute('data-theme', prefersDark ? 'dark' : 'light')
    } else {
      root.setAttribute('data-theme', theme)
    }
  }, [theme])

  useEffect(() => {
    localStorage.setItem(NOTIFICATIONS_KEY, String(notifications))
  }, [notifications])

  const sync = useMutation({
    mutationFn: () => api.post('/user/sync'),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['user'] })
      queryClient.invalidateQueries({ queryKey: ['user-stats'] })
    },
  })

  const t = labels[lang]

  return (
    <div className="relative min-h-full">
      <div className="absolute inset-0 -m-6">
        <WavyBackground
          backgroundFill="#0F172A"
          waveOpacity={0.4}
          blur={10}
          speed="fast"
          waveWidth={50}
        />
      </div>
      <div className="relative z-10 space-y-6">
        <h1 className="text-2xl font-bold text-white">{t.title}</h1>
        <ul className="grid grid-cols-1 gap-4 md:grid-cols-12 md:grid-rows-3 xl:max-h-[34rem] xl:grid-rows-2 lg:gap-4">
        <GridItem
          area="md:[grid-area:1/1/2/7] xl:[grid-area:1/1/2/5]"
          icon={
            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5h12M9 3v2m1.048 9.5A18.022 18.022 0 016.412 9m6.088 9h7M11 21v-2m4 0v2m4.77-16.436a18.02 18.02 0 01-3.57 9.567M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
            </svg>
          }
          title={t.language}
          description={t.languageDesc}
        >
          <div className="flex gap-2">
            <button
              type="button"
              onClick={() => setLang('ru')}
              className={`rounded-lg px-3 py-1.5 text-sm font-medium transition ${
                lang === 'ru' ? 'bg-primary text-white' : 'bg-white/10 text-slate-400 hover:text-white'
              }`}
            >
              RU
            </button>
            <button
              type="button"
              onClick={() => setLang('en')}
              className={`rounded-lg px-3 py-1.5 text-sm font-medium transition ${
                lang === 'en' ? 'bg-primary text-white' : 'bg-white/10 text-slate-400 hover:text-white'
              }`}
            >
              EN
            </button>
          </div>
        </GridItem>

        <GridItem
          area="md:[grid-area:1/7/2/13] xl:[grid-area:2/1/3/5]"
          icon={
            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z" />
            </svg>
          }
          title={t.theme}
          description={t.themeDesc}
        >
          <div className="flex flex-wrap gap-2">
            {(['light', 'dark', 'system'] as const).map((v) => (
              <button
                key={v}
                type="button"
                onClick={() => setTheme(v)}
                className={`rounded-lg px-3 py-1.5 text-sm font-medium transition ${
                  theme === v ? 'bg-primary text-white' : 'bg-white/10 text-slate-400 hover:text-white'
                }`}
              >
                {v === 'light' ? t.themeLight : v === 'dark' ? t.themeDark : t.themeSystem}
              </button>
            ))}
          </div>
        </GridItem>

        <GridItem
          area="md:[grid-area:2/1/3/7] xl:[grid-area:1/5/3/8]"
          icon={
            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
            </svg>
          }
          title={t.sync}
          description={t.syncDesc}
        >
          <button
            type="button"
            onClick={() => sync.mutate()}
            disabled={sync.isPending}
            className="rounded-lg bg-primary px-4 py-2 text-white hover:bg-primary/90 disabled:opacity-50"
          >
            {sync.isPending ? t.syncing : t.syncBtn}
          </button>
        </GridItem>

        <GridItem
          area="md:[grid-area:2/7/3/13] xl:[grid-area:1/8/2/13]"
          icon={
            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
            </svg>
          }
          title={t.notifications}
          description={t.notificationsDesc}
        >
          <button
            type="button"
            onClick={() => setNotifications(!notifications)}
            className={`rounded-lg px-4 py-2 text-sm font-medium transition ${
              notifications ? 'bg-primary text-white' : 'bg-white/10 text-slate-400'
            }`}
          >
            {notifications ? t.on : t.off}
          </button>
        </GridItem>

        <GridItem
          area="md:[grid-area:3/1/4/13] xl:[grid-area:2/8/3/13]"
          icon={
            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
            </svg>
          }
          title="DevSync"
          description="GitHub activity dashboard. Язык и тема сохраняются в браузере."
        >
          <p className="text-xs text-slate-500">v1.0</p>
        </GridItem>
      </ul>
      </div>
    </div>
  )
}
