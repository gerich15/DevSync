import { useMemo, useRef, useEffect } from 'react'
import * as d3 from 'd3'
import type { ContributionDay } from '../../types/github'
import type { TemplateConfig } from '../../types/template'

const CELL = 12
const GAP = 3
const COLS = 53
const DEFAULT_COLORS = ['#0F172A', '#164B35', '#0F7139', '#26A641', '#39D353']

interface HeatmapChartProps {
  data?: ContributionDay[]
  /** Конфиг из шаблона (Templates → heatmap-default). Если передан — цвета берутся из него. */
  templateConfig?: TemplateConfig | null
}

export default function HeatmapChart({ data = [], templateConfig }: HeatmapChartProps) {
  const svgRef = useRef<SVGSVGElement>(null)
  const safeData = Array.isArray(data) ? data : []
  const byDate = useMemo(() => {
    const m = new Map<string, number>()
    safeData.forEach((d) => m.set(d.date, (m.get(d.date) ?? 0) + d.count))
    return m
  }, [safeData])

  const colors = useMemo(() => {
    const c = templateConfig?.colors as Record<string, string> | undefined
    if (c?.empty != null && c?.active != null) {
      const empty = c.empty
      const active = c.active
      const max = d3.max(safeData.map((d) => d.count)) ?? 1
      return (count: number) =>
        count === 0 ? empty : d3.interpolate(empty, active)(Math.min(1, count / max))
    }
    return (count: number) => {
      const max = d3.max(safeData.map((d) => d.count)) ?? 1
      const scale = d3.scaleQuantile<string>().domain([0, max]).range(DEFAULT_COLORS)
      return scale(count)
    }
  }, [templateConfig?.colors, safeData])

  useEffect(() => {
    if (!svgRef.current || !safeData.length) return
    const max = d3.max(safeData.map((d) => d.count)) ?? 1
    const svg = d3.select(svgRef.current)
    svg.selectAll('*').remove()
    const start = new Date()
    start.setDate(start.getDate() - 364)
    for (let i = 0; i < 365; i++) {
      const d = new Date(start)
      d.setDate(d.getDate() + i)
      const key = d.toISOString().slice(0, 10)
      const count = byDate.get(key) ?? 0
      const col = i % COLS
      const row = Math.floor(i / COLS)
      const x = col * (CELL + GAP)
      const y = row * (CELL + GAP)
      const fill = colors(count)
      svg.append('rect').attr('x', x).attr('y', y).attr('width', CELL).attr('height', CELL).attr('rx', 2).attr('fill', fill)
    }
  }, [safeData, byDate, colors])

  const w = COLS * (CELL + GAP)
  const h = Math.ceil(365 / COLS) * (CELL + GAP)
  return <svg ref={svgRef} width={w} height={h} />
}
