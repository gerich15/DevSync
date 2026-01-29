import { useState } from 'react'
import api from '../services/api'
import SplineScene from '../components/ui/SplineScene'

const SPLINE_ROBOT_SCENE = 'https://prod.spline.design/kZDDjO5HuC9GJUM2/scene.splinecode'

export default function Reports() {
  const [loading, setLoading] = useState<string | null>(null)

  const handlePDF = async () => {
    setLoading('pdf')
    try {
      const { data } = await api.get('/reports/pdf', { responseType: 'blob' })
      const url = URL.createObjectURL(data)
      const a = document.createElement('a')
      a.href = url
      a.download = 'devsync-report.pdf'
      a.click()
      URL.revokeObjectURL(url)
    } finally {
      setLoading(null)
    }
  }

  const handleMarkdown = async () => {
    setLoading('md')
    try {
      const { data } = await api.get('/reports/markdown', { responseType: 'blob' })
      const url = URL.createObjectURL(new Blob([data], { type: 'text/markdown' }))
      const a = document.createElement('a')
      a.href = url
      a.download = 'README-stats.md'
      a.click()
      URL.revokeObjectURL(url)
    } finally {
      setLoading(null)
    }
  }

  return (
    <div className="relative min-h-[500px] w-full overflow-hidden rounded-2xl border border-white/10 bg-[#0F172A]">
      {/* Центр: робот Spline (следит за курсором) */}
      <div className="absolute inset-0 flex items-center justify-center">
        <div className="h-full w-full max-w-2xl">
          <SplineScene scene={SPLINE_ROBOT_SCENE} className="h-full w-full" />
        </div>
      </div>

      {/* Слева: PDF Report */}
      <div className="absolute left-0 top-0 z-10 flex h-full w-1/3 items-center justify-center p-6">
        <button
          onClick={handlePDF}
          disabled={!!loading}
          className="rounded-xl border border-white/20 bg-surface/90 px-6 py-3 text-white shadow-lg backdrop-blur transition hover:bg-primary hover:border-primary/50 disabled:opacity-50"
        >
          {loading === 'pdf' ? 'Скачивание...' : 'PDF report'}
        </button>
      </div>

      {/* Справа: Markdown */}
      <div className="absolute right-0 top-0 z-10 flex h-full w-1/3 items-center justify-center p-6">
        <button
          onClick={handleMarkdown}
          disabled={!!loading}
          className="rounded-xl border border-white/20 bg-surface/90 px-6 py-3 text-white shadow-lg backdrop-blur transition hover:bg-primary hover:border-primary/50 disabled:opacity-50"
        >
          {loading === 'md' ? 'Скачивание...' : 'Markdown'}
        </button>
      </div>
    </div>
  )
}
