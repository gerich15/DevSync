import { useEffect, useRef } from 'react'
import { motion } from 'framer-motion'

interface Beam {
  x: number
  y: number
  width: number
  length: number
  angle: number
  speed: number
  opacity: number
  hue: number
  pulse: number
  pulseSpeed: number
}

interface BeamsBackgroundProps {
  className?: string
  intensity?: 'subtle' | 'medium' | 'strong'
}

function createBeam(width: number, height: number): Beam {
  const angle = -35 + Math.random() * 10
  return {
    x: Math.random() * width * 1.5 - width * 0.25,
    y: Math.random() * height * 1.5 - height * 0.25,
    width: 30 + Math.random() * 60,
    length: height * 2.5,
    angle,
    speed: 0.6 + Math.random() * 1.2,
    opacity: 0.12 + Math.random() * 0.16,
    hue: 217 + Math.random() * 30,
    pulse: Math.random() * Math.PI * 2,
    pulseSpeed: 0.02 + Math.random() * 0.03,
  }
}

const opacityMap = {
  subtle: 0.7,
  medium: 0.85,
  strong: 1,
}

const MINIMUM_BEAMS = 20

export default function BeamsBackground({
  className = '',
  intensity = 'medium',
}: BeamsBackgroundProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const beamsRef = useRef<Beam[]>([])
  const animationFrameRef = useRef<number>(0)

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return

    const ctx = canvas.getContext('2d')
    if (!ctx) return

    const updateCanvasSize = () => {
      const dpr = window.devicePixelRatio || 1
      const w = window.innerWidth
      const h = window.innerHeight
      canvas.width = w * dpr
      canvas.height = h * dpr
      canvas.style.width = `${w}px`
      canvas.style.height = `${h}px`
      ctx.scale(dpr, dpr)

      const totalBeams = Math.ceil(MINIMUM_BEAMS * 1.5)
      beamsRef.current = Array.from({ length: totalBeams }, () => createBeam(w, h))
    }

    function resetBeam(beam: Beam, index: number, totalBeams: number): Beam {
      const w = canvas?.width ? canvas.width / (window.devicePixelRatio || 1) : 800
      const h = canvas?.height ? canvas.height / (window.devicePixelRatio || 1) : 600
      const column = index % 3
      const spacing = w / 3
      beam.y = h + 100
      beam.x = column * spacing + spacing / 2 + (Math.random() - 0.5) * spacing * 0.5
      beam.width = 100 + Math.random() * 100
      beam.speed = 0.5 + Math.random() * 0.4
      beam.hue = 217 + (index * 30) / totalBeams
      beam.opacity = 0.2 + Math.random() * 0.1
      return beam
    }

    function drawBeam(context: CanvasRenderingContext2D, beam: Beam) {
      context.save()
      context.translate(beam.x, beam.y)
      context.rotate((beam.angle * Math.PI) / 180)

      const pulsingOpacity =
        beam.opacity * (0.8 + Math.sin(beam.pulse) * 0.2) * opacityMap[intensity]

      const gradient = context.createLinearGradient(0, 0, 0, beam.length)
      gradient.addColorStop(0, `hsla(${beam.hue}, 85%, 65%, 0)`)
      gradient.addColorStop(0.1, `hsla(${beam.hue}, 85%, 65%, ${pulsingOpacity * 0.5})`)
      gradient.addColorStop(0.4, `hsla(${beam.hue}, 85%, 65%, ${pulsingOpacity})`)
      gradient.addColorStop(0.6, `hsla(${beam.hue}, 85%, 65%, ${pulsingOpacity})`)
      gradient.addColorStop(0.9, `hsla(${beam.hue}, 85%, 65%, ${pulsingOpacity * 0.5})`)
      gradient.addColorStop(1, `hsla(${beam.hue}, 85%, 65%, 0)`)

      context.fillStyle = gradient
      context.fillRect(-beam.width / 2, 0, beam.width, beam.length)
      context.restore()
    }

    function animate() {
      if (!canvas || !ctx) return
      const w = canvas.width / (window.devicePixelRatio || 1)
      const h = canvas.height / (window.devicePixelRatio || 1)

      ctx.clearRect(0, 0, w, h)
      ctx.filter = 'blur(35px)'

      const totalBeams = beamsRef.current.length
      beamsRef.current.forEach((beam, index) => {
        beam.y -= beam.speed
        beam.pulse += beam.pulseSpeed
        if (beam.y + beam.length < -100) {
          resetBeam(beam, index, totalBeams)
        }
        drawBeam(ctx, beam)
      })

      animationFrameRef.current = requestAnimationFrame(animate)
    }

    updateCanvasSize()
    window.addEventListener('resize', updateCanvasSize)
    animate()

    return () => {
      window.removeEventListener('resize', updateCanvasSize)
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current)
      }
    }
  }, [intensity])

  return (
    <div
      className={`relative min-h-full w-full overflow-hidden bg-[#0F172A] ${className}`}
    >
      <canvas
        ref={canvasRef}
        className="absolute inset-0 block w-full h-full"
        style={{ filter: 'blur(15px)' }}
      />
      <motion.div
        className="absolute inset-0 bg-[#0F172A]/50"
        animate={{ opacity: [0.05, 0.12, 0.05] }}
        transition={{
          duration: 10,
          ease: 'easeInOut',
          repeat: Infinity,
        }}
        style={{ backdropFilter: 'blur(50px)' }}
      />
    </div>
  )
}
