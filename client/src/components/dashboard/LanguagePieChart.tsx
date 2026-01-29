import { useEffect, useRef } from 'react'
import * as am5 from '@amcharts/amcharts5'
import * as am5xy from '@amcharts/amcharts5/xy'
import * as am5radar from '@amcharts/amcharts5/radar'
import am5themes_Animated from '@amcharts/amcharts5/themes/Animated'
import type { LanguageStats } from '../../types/github'

const COLORS = ['#3B82F6', '#8B5CF6', '#10B981', '#F59E0B', '#EF4444', '#06B6D4', '#EC4899']

export default function LanguagePieChart({ data = [] }: { data?: LanguageStats[] }) {
  const chartRef = useRef<HTMLDivElement>(null)
  const safeData = Array.isArray(data) ? data.slice(0, 12) : []

  useEffect(() => {
    if (!chartRef.current || !safeData.length) return

    const root = am5.Root.new(chartRef.current)

    root.setThemes([am5themes_Animated.new(root)])

    const chart = root.container.children.push(
      am5radar.RadarChart.new(root, {
        panX: false,
        panY: false,
        wheelX: 'panX',
        wheelY: 'zoomX',
        innerRadius: am5.percent(20),
        startAngle: -90,
        endAngle: 180,
      })
    )

    const chartData = safeData.map((item: LanguageStats, i: number) => ({
      category: item.language,
      value: Math.round(item.percent * 10) / 10,
      full: 100,
      columnSettings: {
        fill: am5.Color.fromString(COLORS[i % COLORS.length]),
      },
    }))

    const cursor = chart.set(
      'cursor',
      am5radar.RadarCursor.new(root, { behavior: 'zoomX' })
    )
    cursor.lineY.set('visible', false)

    const xRenderer = am5radar.AxisRendererCircular.new(root, {})
    xRenderer.labels.template.setAll({ radius: 10 })
    xRenderer.grid.template.setAll({ forceHidden: true })

    const xAxis = chart.xAxes.push(
      am5xy.ValueAxis.new(root, {
        renderer: xRenderer,
        min: 0,
        max: 100,
        strictMinMax: true,
        numberFormat: "#'%'",
        tooltip: am5.Tooltip.new(root, {}),
      })
    )

    const yRenderer = am5radar.AxisRendererRadial.new(root, {
      minGridDistance: 20,
    })
    yRenderer.labels.template.setAll({
      centerX: am5.p100,
      fontWeight: '500',
      fontSize: 14,
      templateField: 'columnSettings',
    })
    yRenderer.grid.template.setAll({ forceHidden: true })

    const yAxis = chart.yAxes.push(
      am5xy.CategoryAxis.new(root, {
        categoryField: 'category',
        renderer: yRenderer,
      })
    )
    yAxis.data.setAll(chartData)

    const series1 = chart.series.push(
      am5radar.RadarColumnSeries.new(root, {
        xAxis,
        yAxis,
        clustered: false,
        valueXField: 'full',
        categoryYField: 'category',
        fill: root.interfaceColors.get('alternativeBackground'),
      })
    )
    series1.columns.template.setAll({
      width: am5.p100,
      fillOpacity: 0.08,
      strokeOpacity: 0,
      cornerRadius: 20,
    })
    series1.data.setAll(chartData)

    const series2 = chart.series.push(
      am5radar.RadarColumnSeries.new(root, {
        xAxis,
        yAxis,
        clustered: false,
        valueXField: 'value',
        categoryYField: 'category',
      })
    )
    series2.columns.template.setAll({
      width: am5.p100,
      strokeOpacity: 0,
      tooltipText: '{category}: {valueX}%',
      cornerRadius: 20,
      templateField: 'columnSettings',
    })
    series2.data.setAll(chartData)

    series1.appear(1000)
    series2.appear(1000)
    chart.appear(1000, 100)

    return () => {
      root.dispose()
    }
  }, [data])

  if (safeData.length === 0) {
    return (
      <div className="flex h-[400px] items-center justify-center rounded-xl bg-surface/50 text-slate-500">
        Нет данных по языкам
      </div>
    )
  }

  return <div ref={chartRef} className="h-[500px] w-full min-h-[300px]" />
}
