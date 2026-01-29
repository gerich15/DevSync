import { useMemo, useRef, useEffect } from 'react'
import * as d3 from 'd3'
import type { ContributionDay } from '../../types/github'

const CELL = 12
const GAP = 3
const COLS = 53
const colors = ['#0F172A', '#164B35', '#0F7139', '#26A641', '#39D353']

export default function HeatmapChart({ data = [] }: { data?: ContributionDay[] }) {
  const svgRef = useRef<SVGSVGElement>(null)
  const safeData = Array.isArray(data) ? data : []
  const byDate = useMemo(() => {
    const m = new Map<string, number>()
    safeData.forEach((d) => m.set(d.date, (m.get(d.date) ?? 0) + d.count))
    return m
  }, [safeData])

  useEffect(() => {
    if (!svgRef.current || !safeData.length) return
    const max = d3.max(safeData.map((d) => d.count)) ?? 1
    const scale = d3.scaleQuantile<string>().domain([0, max]).range(colors)
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
      svg.append('rect').attr('x', x).attr('y', y).attr('width', CELL).attr('height', CELL).attr('rx', 2).attr('fill', scale(count))
    }
  }, [safeData, byDate])

  const w = COLS * (CELL + GAP)
  const h = Math.ceil(365 / COLS) * (CELL + GAP)
  return <svg ref={svgRef} width={w} height={h} />
}
