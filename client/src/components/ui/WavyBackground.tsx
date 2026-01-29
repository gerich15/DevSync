import { useEffect, useRef, useState } from 'react'
import { createNoise3D } from 'simplex-noise'

interface WavyBackgroundProps {
  className?: string
  containerClassName?: string
  colors?: string[]
  waveWidth?: number
  backgroundFill?: string
  blur?: number
  speed?: 'slow' | 'fast'
  waveOpacity?: number
  children?: React.ReactNode
}

function getSpeed(speed: 'slow' | 'fast') {
  switch (speed) {
    case 'slow':
      return 0.001
    case 'fast':
      return 0.002
    default:
      return 0.001
  }
}

export default function WavyBackground({
  children,
  className = '',
  containerClassName = '',
  colors,
  waveWidth = 50,
  backgroundFill = '#0F172A',
  blur = 10,
  speed = 'fast',
  waveOpacity = 0.5,
}: WavyBackgroundProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const [isSafari, setIsSafari] = useState(false)

  useEffect(() => {
    setIsSafari(
      typeof window !== 'undefined' &&
        navigator.userAgent.includes('Safari') &&
        !navigator.userAgent.includes('Chrome')
    )
  }, [])

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return

    const ctx = canvas.getContext('2d')
    if (!ctx) return

    const noise = createNoise3D()
    const waveColorsList =
      colors ?? ['#3B82F6', '#60a5fa', '#8B5CF6', '#a78bfa', '#38bdf8']
    let w = window.innerWidth
    let h = window.innerHeight
    let nt = 0

    const resize = () => {
      w = canvas.width = window.innerWidth
      h = canvas.height = window.innerHeight
      ctx.filter = `blur(${blur}px)`
    }

    const drawWave = (n: number) => {
      nt += getSpeed(speed)
      for (let i = 0; i < n; i++) {
        ctx.beginPath()
        ctx.lineWidth = waveWidth
        ctx.strokeStyle = waveColorsList[i % waveColorsList.length]
        for (let x = 0; x < w; x += 5) {
          const y = noise(x / 800, 0.3 * i, nt) * 100
          ctx.lineTo(x, y + h * 0.5)
        }
        ctx.stroke()
        ctx.closePath()
      }
    }

    let animationId: number
    const render = () => {
      ctx.fillStyle = backgroundFill
      ctx.globalAlpha = waveOpacity
      ctx.fillRect(0, 0, w, h)
      drawWave(5)
      animationId = requestAnimationFrame(render)
    }

    resize()
    window.addEventListener('resize', resize)
    render()

    return () => {
      window.removeEventListener('resize', resize)
      cancelAnimationFrame(animationId)
    }
  }, [backgroundFill, blur, colors, speed, waveOpacity, waveWidth])

  return (
    <div
      className={`flex min-h-full flex-col items-center justify-center ${containerClassName}`}
    >
      <canvas
        ref={canvasRef}
        className="absolute inset-0 z-0 block h-full w-full"
        style={isSafari ? { filter: `blur(${blur}px)` } : undefined}
      />
      {children != null ? (
        <div className={`relative z-10 ${className}`}>{children}</div>
      ) : null}
    </div>
  )
}
