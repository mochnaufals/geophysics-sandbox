import { useEffect, useRef } from 'react'
import * as echarts from 'echarts'
import type { EChartsOption, ECharts } from 'echarts'

export interface EChartProps {
  option: EChartsOption
  className?: string
  style?: React.CSSProperties
  loading?: boolean
  onChartReady?: (instance: ECharts) => void
}

export function EChart({
  option,
  className = 'w-full h-80',
  style,
  loading = false,
  onChartReady,
}: EChartProps) {
  const containerRef = useRef<HTMLDivElement>(null)
  const chartInstanceRef = useRef<ECharts | null>(null)
  const optionRef = useRef<EChartsOption>(option)
  optionRef.current = option
  const onChartReadyRef = useRef(onChartReady)
  onChartReadyRef.current = onChartReady

  const getTheme = () => {
    if (typeof document === 'undefined') return undefined
    return document.documentElement.getAttribute('data-theme') === 'dark' ? 'dark' : undefined
  }

  useEffect(() => {
    if (!containerRef.current) return

    // Initialize chart instance with current theme
    const theme = getTheme()
    const chart = echarts.init(containerRef.current, theme)
    chartInstanceRef.current = chart

    if (onChartReadyRef.current) {
      onChartReadyRef.current(chart)
    }

    // Set chart options
    chart.setOption(optionRef.current)

    // Responsive resize observer
    const resizeObserver = new ResizeObserver(() => {
      chart.resize()
    })
    resizeObserver.observe(containerRef.current)

    // Re-initialize chart when DaisyUI theme changes
    const handleThemeChange = () => {
      if (!containerRef.current) return
      const newTheme = getTheme()
      chart.dispose()
      const newChart = echarts.init(containerRef.current, newTheme)
      chartInstanceRef.current = newChart
      newChart.setOption(optionRef.current)
    }

    window.addEventListener('themechange', handleThemeChange)

    return () => {
      resizeObserver.disconnect()
      window.removeEventListener('themechange', handleThemeChange)
      chart.dispose()
      chartInstanceRef.current = null
    }
  }, []) // Mount / unmount only

  // Update options when prop changes
  useEffect(() => {
    if (chartInstanceRef.current) {
      chartInstanceRef.current.setOption(option, true)
    }
  }, [option])

  // Handle loading state
  useEffect(() => {
    if (chartInstanceRef.current) {
      if (loading) {
        chartInstanceRef.current.showLoading('default', {
          text: 'Calculating...',
          color: '#3b82f6',
        })
      } else {
        chartInstanceRef.current.hideLoading()
      }
    }
  }, [loading])

  return (
    <div
      ref={containerRef}
      className={`relative min-h-64 ${className}`}
      style={style}
      data-testid="echart-container"
    />
  )
}
