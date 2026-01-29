import { useState, useRef } from 'react'
import type { ContributionDay } from '../../types/github'

interface DataPoint {
  time: number
  value: number
}

const width = 800
const height = 300
const padding = { top: 20, right: 20, bottom: 40, left: 50 }

function contributionToDataPoints(contributions: ContributionDay[]): DataPoint[] {
  const sorted = [...(contributions ?? [])].sort((a, b) => a.date.localeCompare(b.date))
  return sorted.map((d) => ({
    time: new Date(d.date).getTime(),
    value: d.count,
  }))
}

export default function CommitsTimeline({ data = [] }: { data?: ContributionDay[] }) {
  const points = contributionToDataPoints(data)
  const [hoveredPoint, setHoveredPoint] = useState<DataPoint | null>(null)
  const svgRef = useRef<SVGSVGElement>(null)

  const getX = (time: number) => {
    if (points.length < 2) return padding.left
    const minTime = points[0]?.time ?? 0
    const maxTime = points[points.length - 1]?.time ?? 1
    const range = maxTime - minTime || 1
    return padding.left + ((time - minTime) / range) * (width - padding.left - padding.right)
  }

  const maxVal = Math.max(...points.map((d) => d.value), 1)
  const getY = (value: number) => {
    return padding.top + (1 - value / maxVal) * (height - padding.top - padding.bottom)
  }

  const getPath = () => {
    if (points.length < 2) return ''
    return points
      .map((point, i) => {
        const x = getX(point.time)
        const y = getY(point.value)
        return `${i === 0 ? 'M' : 'L'} ${x},${y}`
      })
      .join(' ')
  }

  const getAreaPath = () => {
    if (points.length < 2) return ''
    const linePath = getPath()
    const lastX = getX(points[points.length - 1].time)
    const firstX = getX(points[0].time)
    const bottomY = height - padding.bottom
    return `${linePath} L ${lastX},${bottomY} L ${firstX},${bottomY} Z`
  }

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!svgRef.current || points.length === 0) return
    const rect = svgRef.current.getBoundingClientRect()
    const x = e.clientX - rect.left
    let closest: DataPoint | null = null
    let minDist = Number.POSITIVE_INFINITY
    points.forEach((point) => {
      const px = getX(point.time)
      const dist = Math.abs(px - x)
      if (dist < minDist && dist < 30) {
        minDist = dist
        closest = point
      }
    })
    setHoveredPoint(closest)
  }

  const currentValue = points[points.length - 1]?.value ?? 0
  const avgValue =
    points.length > 0
      ? points.reduce((a, b) => a + b.value, 0) / points.length
      : 0
  const peakValue = points.length > 0 ? Math.max(...points.map((d) => d.value)) : 0

  if (points.length === 0) {
    return (
      <div className="flex h-[300px] items-center justify-center rounded-xl bg-surface/50 text-slate-500">
        Нет данных за выбранный период
      </div>
    )
  }

  return (
    <div className="max-w-full">
      <div className="mb-4 flex flex-wrap items-center justify-between gap-4">
        <div>
          <h3 className="text-base font-semibold text-white">Контрибуции по дням</h3>
          <p className="text-sm text-slate-500">Коммиты по датам</p>
        </div>
        <div className="flex items-center gap-2 rounded-xl bg-surface px-4 py-2">
          <div className="h-2.5 w-2.5 rounded-full bg-success animate-pulse" />
          <span className="text-sm text-slate-400">Данные</span>
          <span className="text-xl font-bold text-white">{currentValue}</span>
        </div>
      </div>

      <div className="relative rounded-2xl bg-surface/80 p-6">
        <svg
          ref={svgRef}
          width="100%"
          height={height}
          viewBox={`0 0 ${width} ${height}`}
          onMouseMove={handleMouseMove}
          onMouseLeave={() => setHoveredPoint(null)}
          className="cursor-crosshair"
        >
          <defs>
            <linearGradient id="commits-lineGradient" x1="0%" y1="0%" x2="100%" y2="0%">
              <stop offset="0%" stopColor="#3B82F6">
                <animate
                  attributeName="stop-color"
                  values="#3B82F6;#8B5CF6;#3B82F6"
                  dur="3s"
                  repeatCount="indefinite"
                />
              </stop>
              <stop offset="50%" stopColor="#8B5CF6">
                <animate
                  attributeName="stop-color"
                  values="#8B5CF6;#3B82F6;#8B5CF6"
                  dur="3s"
                  repeatCount="indefinite"
                />
              </stop>
              <stop offset="100%" stopColor="#3B82F6">
                <animate
                  attributeName="stop-color"
                  values="#3B82F6;#8B5CF6;#3B82F6"
                  dur="3s"
                  repeatCount="indefinite"
                />
              </stop>
            </linearGradient>
            <linearGradient id="commits-areaGradient" x1="0%" y1="0%" x2="0%" y2="100%">
              <stop offset="0%" stopColor="#3B82F6" stopOpacity="0.3" />
              <stop offset="100%" stopColor="#3B82F6" stopOpacity="0" />
            </linearGradient>
          </defs>

          {/* Grid */}
          {[0, 0.25, 0.5, 0.75, 1].map((t) => {
            const val = Math.round(t * maxVal)
            return (
              <g key={val}>
                <line
                  x1={padding.left}
                  y1={getY(val)}
                  x2={width - padding.right}
                  y2={getY(val)}
                  stroke="#334155"
                  strokeDasharray="4 4"
                />
                <text
                  x={padding.left - 10}
                  y={getY(val)}
                  fill="#64748b"
                  fontSize="12"
                  textAnchor="end"
                  dominantBaseline="middle"
                >
                  {val}
                </text>
              </g>
            )
          })}

          <path d={getAreaPath()} fill="url(#commits-areaGradient)" />
          <path
            d={getPath()}
            fill="none"
            stroke="url(#commits-lineGradient)"
            strokeWidth="3"
            strokeLinecap="round"
            strokeLinejoin="round"
            style={{ filter: 'drop-shadow(0 0 8px rgba(59, 130, 246, 0.4))' }}
          />

          {points.map((point, i) => (
            <circle
              key={point.time}
              cx={getX(point.time)}
              cy={getY(point.value)}
              r={i === points.length - 1 ? 6 : 3}
              fill={i === points.length - 1 ? '#8B5CF6' : '#3B82F6'}
              className={i === points.length - 1 ? 'animate-pulse' : ''}
              style={{
                opacity: hoveredPoint?.time === point.time ? 1 : 0.7,
                transition: 'opacity 0.2s ease',
              }}
            />
          ))}

          {hoveredPoint && (
            <>
              <line
                x1={getX(hoveredPoint.time)}
                y1={padding.top}
                x2={getX(hoveredPoint.time)}
                y2={height - padding.bottom}
                stroke="#3B82F6"
                strokeDasharray="4 4"
                opacity="0.5"
              />
              <circle
                cx={getX(hoveredPoint.time)}
                cy={getY(hoveredPoint.value)}
                r="8"
                fill="none"
                stroke="#8B5CF6"
                strokeWidth="2"
              />
            </>
          )}
        </svg>

        {hoveredPoint && (
          <div
            className="pointer-events-none absolute z-10 rounded-lg border border-primary/50 bg-background px-3 py-2 shadow-lg"
            style={{
              left: getX(hoveredPoint.time),
              top: getY(hoveredPoint.value) - 56,
              transform: 'translateX(-50%)',
            }}
          >
            <div className="font-semibold text-white">{hoveredPoint.value} коммитов</div>
            <div className="text-xs text-slate-500">
              {new Date(hoveredPoint.time).toLocaleDateString('ru-RU')}
            </div>
          </div>
        )}
      </div>

      <div className="mt-4 grid grid-cols-3 gap-4">
        {[
          { label: 'Среднее', value: avgValue.toFixed(1), unit: '' },
          { label: 'Пик', value: peakValue.toString(), unit: '' },
          { label: 'Дней', value: points.length.toString(), unit: '' },
        ].map((stat) => (
          <div
            key={stat.label}
            className="rounded-xl bg-surface/80 p-4 text-center"
          >
            <div className="text-xs text-slate-500">{stat.label}</div>
            <div className="text-lg font-semibold text-white">
              {stat.value}
              {stat.unit}
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
