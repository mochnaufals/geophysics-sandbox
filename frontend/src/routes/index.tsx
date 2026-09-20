import { createFileRoute } from '@tanstack/react-router'
import { useQuery } from '@tanstack/react-query'
import type { EChartsOption } from 'echarts'
import {
  Cpu,
  Layers,
  Sparkles,
  BarChart3,
  CheckCircle,
  AlertCircle,
  BookOpen,
} from 'lucide-react'
import { getHealthStatus } from '../lib/api'
import { EChart } from '../components/charts/EChart'

export const Route = createFileRoute('/')({
  component: IndexPage,
})

function IndexPage() {
  const { data: health, isSuccess, isLoading } = useQuery({
    queryKey: ['backend-health'],
    queryFn: getHealthStatus,
  })

  // Sample synthetic signal to preview ECharts integration
  const sampleTime = Array.from({ length: 100 }, (_, i) => (i - 50) * 0.002)
  const f0 = 25 // 25 Hz peak frequency demo
  const sampleWavelet = sampleTime.map((t) => {
    const pi2f2t2 = Math.PI * Math.PI * f0 * f0 * t * t
    return (1 - 2 * pi2f2t2) * Math.exp(-pi2f2t2)
  })

  const previewChartOption: EChartsOption = {
    title: {
      text: 'Synthetic Wavelet Live Preview (ECharts)',
      subtext: 'Demonstrating responsive vector chart rendering and theme reactivity',
      left: 'left',
      textStyle: { fontSize: 14, fontWeight: 'bold' as const },
    },
    tooltip: {
      trigger: 'axis' as const,
      formatter: (params: any) => {
        const p = params[0]
        return `Time: ${p.axisValue} s<br/>Amplitude: ${Number(p.data).toFixed(4)}`
      },
    },
    grid: { left: '3%', right: '4%', bottom: '8%', containLabel: true },
    xAxis: {
      type: 'category' as const,
      name: 'Time (s)',
      data: sampleTime.map((t) => t.toFixed(3)),
      axisTick: { alignWithLabel: true },
    },
    yAxis: {
      type: 'value' as const,
      name: 'Amplitude',
      splitLine: { lineStyle: { type: 'dashed' as const } },
    },
    series: [
      {
        name: 'Wavelet Amplitude',
        type: 'line' as const,
        smooth: true,
        data: sampleWavelet,
        symbol: 'none',
        lineStyle: { width: 2.5, color: '#3b82f6' },
        areaStyle: {
          color: {
            type: 'linear' as const,
            x: 0,
            y: 0,
            x2: 0,
            y2: 1,
            colorStops: [
              { offset: 0, color: 'rgba(59, 130, 246, 0.35)' },
              { offset: 1, color: 'rgba(59, 130, 246, 0.0)' },
            ],
          },
        },
      },
    ],
  }

  return (
    <div className="space-y-6">
      {/* Welcome Hero */}
      <div className="card bg-base-200/60 border border-base-300 shadow-sm p-6 sm:p-8">
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
          <div className="space-y-2 max-w-2xl">
            <div className="inline-flex items-center gap-2 px-2.5 py-1 rounded-full bg-primary/10 text-primary text-xs font-semibold">
              <Sparkles className="h-3.5 w-3.5" />
              <span>Foundation Initialized</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-base-content">
              Geophysics Sandbox
            </h1>
            <p className="text-sm text-base-content/70 leading-relaxed">
              Your personal interactive environment for learning geophysics principles, developing
              computational algorithms, and creating scientific visualizations across seismology,
              potential fields, and signal processing.
            </p>
          </div>

          <div className="flex items-center gap-3">
            <div className="stat bg-base-100/80 rounded-2xl border border-base-300 py-3 px-5 shadow-xs">
              <div className="stat-title text-xs font-medium">Core Stack</div>
              <div className="stat-value text-lg text-primary">React 19 + FastAPI</div>
              <div className="stat-desc text-[11px] text-base-content/60">NumPy · SciPy · ECharts</div>
            </div>
          </div>
        </div>
      </div>

      {/* System Diagnostics & Stack Status Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Frontend Architecture */}
        <div className="card bg-base-100 border border-base-300 shadow-sm p-5 space-y-3">
          <div className="flex items-center gap-2 font-semibold text-sm text-base-content">
            <Layers className="h-4 w-4 text-primary" />
            <span>Frontend Architecture</span>
          </div>
          <ul className="text-xs space-y-1.5 text-base-content/70">
            <li className="flex items-center justify-between">
              <span>Framework:</span>
              <span className="font-mono font-medium text-base-content">React 19 + TypeScript</span>
            </li>
            <li className="flex items-center justify-between">
              <span>UI & Styling:</span>
              <span className="font-mono font-medium text-base-content">DaisyUI 5.7.42 + Tailwind v4</span>
            </li>
            <li className="flex items-center justify-between">
              <span>Routing:</span>
              <span className="font-mono font-medium text-base-content">TanStack Router (File-based)</span>
            </li>
            <li className="flex items-center justify-between">
              <span>Server State:</span>
              <span className="font-mono font-medium text-base-content">TanStack Query v5</span>
            </li>
          </ul>
        </div>

        {/* Backend & Scientific Compute */}
        <div className="card bg-base-100 border border-base-300 shadow-sm p-5 space-y-3">
          <div className="flex items-center gap-2 font-semibold text-sm text-base-content">
            <Cpu className="h-4 w-4 text-secondary" />
            <span>Scientific Compute Backend</span>
          </div>
          {isLoading ? (
            <div className="flex items-center gap-2 text-xs text-base-content/60 py-2">
              <span className="loading loading-spinner loading-xs"></span>
              <span>Checking FastAPI status...</span>
            </div>
          ) : isSuccess && health ? (
            <ul className="text-xs space-y-1.5 text-base-content/70">
              <li className="flex items-center justify-between">
                <span>FastAPI Service:</span>
                <span className="badge badge-success badge-xs font-mono">Live ({health.versions.fastapi})</span>
              </li>
              <li className="flex items-center justify-between">
                <span>NumPy:</span>
                <span className="font-mono font-medium text-base-content">v{health.versions.numpy}</span>
              </li>
              <li className="flex items-center justify-between">
                <span>SciPy:</span>
                <span className="font-mono font-medium text-base-content">v{health.versions.scipy}</span>
              </li>
              <li className="flex items-center justify-between">
                <span>Matplotlib:</span>
                <span className="font-mono font-medium text-base-content">v{health.versions.matplotlib}</span>
              </li>
            </ul>
          ) : (
            <div className="p-2.5 rounded bg-warning/10 border border-warning/20 text-xs text-warning space-y-1">
              <div className="flex items-center gap-1.5 font-medium">
                <AlertCircle className="h-3.5 w-3.5" />
                <span>Backend Offline</span>
              </div>
              <p className="text-[11px] text-base-content/70">
                Run <code className="font-mono">uv run uvicorn app.main:app --port 8000</code> in backend.
              </p>
            </div>
          )}
        </div>

        {/* Visualization & Chart Engines */}
        <div className="card bg-base-100 border border-base-300 shadow-sm p-5 space-y-3">
          <div className="flex items-center gap-2 font-semibold text-sm text-base-content">
            <BarChart3 className="h-4 w-4 text-accent" />
            <span>Visualization Engines</span>
          </div>
          <ul className="text-xs space-y-1.5 text-base-content/70">
            <li className="flex items-center justify-between">
              <span>Primary Engine:</span>
              <span className="font-mono font-medium text-base-content">Apache ECharts 6.1</span>
            </li>
            <li className="flex items-center justify-between">
              <span>Theme Reactivity:</span>
              <span className="font-medium text-success flex items-center gap-1">
                <CheckCircle className="h-3 w-3" /> Auto Light/Dark
              </span>
            </li>
            <li className="flex items-center justify-between">
              <span>Fallback Plotter:</span>
              <span className="font-mono font-medium text-base-content">Matplotlib (Base64)</span>
            </li>
            <li className="flex items-center justify-between">
              <span>Responsiveness:</span>
              <span className="font-mono font-medium text-base-content">ResizeObserver</span>
            </li>
          </ul>
        </div>
      </div>

      {/* Interactive ECharts Preview */}
      <div className="card bg-base-100 border border-base-300 shadow-sm p-6">
        <EChart option={previewChartOption} className="w-full h-80" />
      </div>

      {/* Development Roadmap Guidance */}
      <div className="card bg-base-200/50 border border-base-300 shadow-sm p-6 space-y-4">
        <div className="flex items-center gap-2 font-semibold text-base text-base-content">
          <BookOpen className="h-5 w-5 text-primary" />
          <span>Next Steps: Adding Geophysics Topics</span>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs">
          <div className="p-4 rounded-xl bg-base-100 border border-base-200 space-y-1.5">
            <span className="font-semibold text-primary">1. Backend Algorithm</span>
            <p className="text-base-content/70">
              Create numerical calculations using NumPy & SciPy under{' '}
              <code className="bg-base-200 px-1 py-0.5 rounded font-mono">backend/app/api/v1/</code>.
            </p>
          </div>
          <div className="p-4 rounded-xl bg-base-100 border border-base-200 space-y-1.5">
            <span className="font-semibold text-secondary">2. Frontend Route</span>
            <p className="text-base-content/70">
              Add a new route file in{' '}
              <code className="bg-base-200 px-1 py-0.5 rounded font-mono">frontend/src/routes/</code> to
              render parameters and charts.
            </p>
          </div>
          <div className="p-4 rounded-xl bg-base-100 border border-base-200 space-y-1.5">
            <span className="font-semibold text-accent">3. Sidebar Registration</span>
            <p className="text-base-content/70">
              Link the new topic under its respective domain in{' '}
              <code className="bg-base-200 px-1 py-0.5 rounded font-mono">Sidebar.tsx</code>.
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
