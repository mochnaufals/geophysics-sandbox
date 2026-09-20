import { useState, useMemo } from 'react'
import { useQuery } from '@tanstack/react-query'
import type { EChartsOption } from 'echarts'
import {
  Sliders,
  AlertTriangle,
  CheckCircle2,
  Filter,
  Radio,
  Zap,
} from 'lucide-react'
import { analyzeSamplingAliasing, type SamplingAliasingRequest } from '../../../lib/api'
import { EChart } from '../../charts/EChart'
import { SamplingTheoryDrawer } from './SamplingTheoryDrawer'

export function SamplingAliasingPage() {
  const [frequencyHz, setFrequencyHz] = useState<number>(70.0)
  const [samplingIntervalMs, setSamplingIntervalMs] = useState<number>(8.0) // 8 ms -> fs = 125 Hz, f_Nyq = 62.5 Hz
  const [applyAntiAlias, setApplyAntiAlias] = useState<boolean>(false)
  const [waveformType, setWaveformType] = useState<'sinusoid' | 'multi_harmonic'>('sinusoid')

  const requestPayload: SamplingAliasingRequest = useMemo(() => ({
    frequency_hz: frequencyHz,
    dt_s: samplingIntervalMs / 1000.0,
    duration_s: 0.4,
    apply_anti_alias: applyAntiAlias,
    waveform_type: waveformType,
  }), [frequencyHz, samplingIntervalMs, applyAntiAlias, waveformType])

  const { data, isLoading, isError, error } = useQuery({
    queryKey: ['sampling-aliasing', requestPayload],
    queryFn: () => analyzeSamplingAliasing(requestPayload),
  })

  // Quick Scenarios
  const loadScenario = (f: number, dt: number, filter: boolean) => {
    setFrequencyHz(f)
    setSamplingIntervalMs(dt)
    setApplyAntiAlias(filter)
  }

  // Panel 1: Time Domain Superposition (Continuous True + Discrete Samples + Perceived Alias)
  const timeChartOption: EChartsOption = useMemo(() => {
    if (!data) return {}

    const series: any[] = [
      {
        name: 'True Continuous Waveform (Analog)',
        type: 'line',
        data: data.true_continuous_series,
        showSymbol: false,
        lineStyle: { width: 2, color: '#3b82f6' },
        z: 3,
      },
      {
        name: 'Discrete Digitized Samples',
        type: 'scatter',
        data: data.sampled_dots,
        symbolSize: 8,
        itemStyle: { color: '#ef4444', borderColor: '#ffffff', borderWidth: 1.5 },
        z: 6,
      },
    ]

    if (data.alias_continuous_series && data.alias_continuous_series.length > 0) {
      series.push({
        name: `Perceived Alias Waveform (${data.metrics.alias_frequency_hz} Hz)`,
        type: 'line',
        data: data.alias_continuous_series,
        showSymbol: false,
        lineStyle: { width: 2.5, type: 'dashed', color: '#f59e0b' },
        z: 4,
      })
    }

    return {
      title: {
        text: 'Time Domain: Continuous Signal vs. Discrete Samples',
        subtext: data.metrics.is_aliased
          ? `ALIASED: Sampled dots coincide with both the true ${data.metrics.true_frequency_hz} Hz wave and the deceptive ${data.metrics.alias_frequency_hz} Hz alias wave`
          : `ADEQUATELY SAMPLED: At least 2 samples per cycle of ${data.metrics.true_frequency_hz} Hz wave`,
        left: 'left',
        textStyle: { fontSize: 13, fontWeight: 'bold' },
        subtextStyle: {
          color: data.metrics.is_aliased ? '#ef4444' : '#10b981',
          fontWeight: 'bold',
        },
      },
      legend: { top: 30, type: 'scroll', textStyle: { fontSize: 11 } },
      tooltip: {
        trigger: 'axis',
        axisPointer: { type: 'cross' },
      },
      grid: { left: 50, right: 25, top: 80, bottom: 35 },
      xAxis: {
        type: 'value',
        name: 'Time (ms)',
        nameLocation: 'middle',
        nameGap: 24,
      },
      yAxis: {
        type: 'value',
        name: 'Displacement',
        nameLocation: 'middle',
        nameGap: 38,
        min: -1.2,
        max: 1.2,
      },
      dataZoom: [{ type: 'inside' }, { type: 'slider', height: 14, bottom: 2 }],
      series,
    }
  }, [data])

  // Panel 2: Frequency Spectrum & Nyquist Folding
  const spectrumChartOption: EChartsOption = useMemo(() => {
    if (!data) return {}

    const nyquist = data.metrics.nyquist_frequency_hz

    return {
      title: {
        text: 'Frequency Domain: Sampled Spectrum & Nyquist Foldover',
        subtext: `Nyquist folding boundary at f_Nyq = ${nyquist} Hz`,
        left: 'left',
        textStyle: { fontSize: 13, fontWeight: 'bold' },
      },
      tooltip: {
        trigger: 'axis',
        axisPointer: { type: 'cross' },
        formatter: (params: any) => {
          if (!Array.isArray(params) || params.length === 0) return ''
          const p = params[0]
          return `<div class="font-mono text-xs">
            Frequency: <strong>${p.data[0]} Hz</strong><br/>
            Amplitude: <strong>${p.data[1]}</strong>
          </div>`
        },
      },
      grid: { left: 50, right: 25, top: 60, bottom: 35 },
      xAxis: {
        type: 'value',
        name: 'Frequency (Hz)',
        nameLocation: 'middle',
        nameGap: 24,
        max: nyquist,
      },
      yAxis: {
        type: 'value',
        name: 'Amplitude',
        nameLocation: 'middle',
        nameGap: 38,
      },
      dataZoom: [{ type: 'inside' }, { type: 'slider', height: 14, bottom: 2 }],
      series: [
        {
          name: 'Sampled Spectrum',
          type: 'line',
          data: data.spectrum_series,
          showSymbol: false,
          lineStyle: { width: 2, color: '#ec4899' },
          areaStyle: { color: 'rgba(236, 72, 153, 0.15)' },
          markLine: {
            silent: true,
            symbol: 'none',
            lineStyle: { type: 'solid', color: '#ef4444', width: 2 },
            data: [{ xAxis: nyquist, label: { formatter: `Nyquist (${nyquist} Hz)` } }],
          },
        },
      ],
    }
  }, [data])

  return (
    <div className="space-y-6 pb-12">
      {/* Module Header */}
      <div className="flex flex-wrap items-center justify-between gap-4 border-b border-base-300 pb-4">
        <div>
          <div className="flex items-center gap-2 text-xs font-semibold text-warning uppercase tracking-wider mb-1">
            <Radio className="w-4 h-4" />
            <span>Signal Processing Domain · Section 1.1</span>
          </div>
          <h1 className="text-2xl font-black tracking-tight">Sampling & Frequency Aliasing</h1>
          <p className="text-xs text-base-content/70 mt-0.5">
            Interactive demonstration of discrete sampling, Nyquist frequency, and frequency foldover (Oz Yilmaz pp. 28–34)
          </p>
        </div>

        <div className="flex items-center gap-2">
          {data?.metrics.is_aliased ? (
            <div className="badge badge-error gap-1 font-mono text-xs text-white">
              <AlertTriangle className="w-3 h-3" />
              ALIASED ({data.metrics.alias_frequency_hz} Hz)
            </div>
          ) : (
            <div className="badge badge-success gap-1 font-mono text-xs text-white">
              <CheckCircle2 className="w-3 h-3" />
              Nyquist Satisfied
            </div>
          )}
        </div>
      </div>

      {/* Theory Drawer */}
      <SamplingTheoryDrawer />

      {/* Main Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column: Parameter Controls */}
        <div className="lg:col-span-4 space-y-4">
          <div className="card bg-base-100 border border-base-300 shadow-sm p-4 space-y-4">
            <div className="flex items-center gap-1.5 font-bold text-xs text-base-content/80 uppercase tracking-wider">
              <Sliders className="w-3.5 h-3.5 text-warning" />
              <span>Acquisition Parameters</span>
            </div>

            {/* Quick Presets / Scenarios */}
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-base-content/70">Educational Presets</label>
              <div className="grid grid-cols-1 gap-1.5">
                <button
                  type="button"
                  onClick={() => loadScenario(30.0, 2.0, false)}
                  className="btn btn-xs btn-outline justify-start text-left"
                >
                  <span className="font-bold">Normal:</span> 30 Hz @ 2 ms (Nyq 250 Hz)
                </button>
                <button
                  type="button"
                  onClick={() => loadScenario(70.0, 8.0, false)}
                  className="btn btn-xs btn-outline btn-warning justify-start text-left"
                >
                  <span className="font-bold">Yilmaz Fig 1.1-4:</span> 70 Hz @ 8 ms (Folds to 55 Hz)
                </button>
                <button
                  type="button"
                  onClick={() => loadScenario(110.0, 8.0, false)}
                  className="btn btn-xs btn-outline btn-error justify-start text-left"
                >
                  <span className="font-bold">Severe Aliasing:</span> 110 Hz @ 8 ms (Folds to 15 Hz)
                </button>
                <button
                  type="button"
                  onClick={() => loadScenario(70.0, 8.0, true)}
                  className="btn btn-xs btn-outline btn-success justify-start text-left"
                >
                  <span className="font-bold">Anti-Alias Protected:</span> 70 Hz @ 8 ms + Filter
                </button>
              </div>
            </div>

            {/* Waveform Type Toggle */}
            <div className="space-y-1 text-xs border-t border-base-200 pt-3">
              <div className="flex justify-between">
                <span className="font-semibold">Waveform Type:</span>
                <div className="join">
                  <button
                    type="button"
                    className={`join-item btn btn-xs ${waveformType === 'sinusoid' ? 'btn-active btn-warning' : ''}`}
                    onClick={() => setWaveformType('sinusoid')}
                  >
                    Pure Sine
                  </button>
                  <button
                    type="button"
                    className={`join-item btn btn-xs ${waveformType === 'multi_harmonic' ? 'btn-active btn-warning' : ''}`}
                    onClick={() => setWaveformType('multi_harmonic')}
                  >
                    Harmonics
                  </button>
                </div>
              </div>
            </div>

            {/* True Frequency Slider */}
            <div className="space-y-1 text-xs border-t border-base-200 pt-3">
              <div className="flex justify-between">
                <span className="font-semibold">True Signal Frequency (f):</span>

                <span className="font-mono font-bold text-primary">{frequencyHz} Hz</span>
              </div>
              <input
                type="range"
                min="10"
                max="200"
                step="2"
                value={frequencyHz}
                onChange={(e) => setFrequencyHz(parseFloat(e.target.value))}
                className="range range-xs range-primary w-full"
              />
            </div>

            {/* Sampling Interval Selector */}
            <div className="space-y-1 text-xs">
              <div className="flex justify-between">
                <span className="font-semibold">Sampling Interval (Δt):</span>
                <span className="font-mono font-bold">{samplingIntervalMs} ms ({Math.round(1000 / samplingIntervalMs)} Hz)</span>
              </div>
              <div className="grid grid-cols-4 gap-1">
                {[2.0, 4.0, 8.0, 16.0].map((dt) => (
                  <button
                    key={dt}
                    type="button"
                    onClick={() => setSamplingIntervalMs(dt)}
                    className={`btn btn-xs ${
                      samplingIntervalMs === dt ? 'btn-warning' : 'btn-outline'
                    }`}
                  >
                    {dt} ms
                  </button>
                ))}
              </div>
            </div>

            {/* Anti-Aliasing Filter Toggle */}
            <div className="border-t border-base-200 pt-3 space-y-2 text-xs">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-1 font-semibold">
                  <Filter className="w-3.5 h-3.5 text-success" />
                  <span>Anti-Aliasing Filter</span>
                </div>
                <input
                  type="checkbox"
                  checked={applyAntiAlias}
                  onChange={(e) => setApplyAntiAlias(e.target.checked)}
                  className="toggle toggle-xs toggle-success"
                />
              </div>
              <p className="text-[11px] text-base-content/60">
                Applies analog 4th-order Butterworth low-pass filter at cutoff = 0.85 × f_Nyq before sampling.
              </p>
            </div>
          </div>
        </div>

        {/* Right Column: 2 Synchronized ECharts Panels & Metrics */}
        <div className="lg:col-span-8 space-y-6">
          {/* Status / Metrics Bar */}
          {data && (
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              <div className="p-3 bg-base-100 border border-base-300 rounded-lg shadow-xs">
                <div className="text-[11px] text-base-content/60 uppercase font-semibold">
                  True Frequency
                </div>
                <div className="text-lg font-black text-primary font-mono">
                  {data.metrics.true_frequency_hz} Hz
                </div>
              </div>

              <div className="p-3 bg-base-100 border border-base-300 rounded-lg shadow-xs">
                <div className="text-[11px] text-base-content/60 uppercase font-semibold">
                  Nyquist Frequency
                </div>
                <div className="text-lg font-black text-warning font-mono">
                  {data.metrics.nyquist_frequency_hz} Hz
                </div>
              </div>

              <div className="p-3 bg-base-100 border border-base-300 rounded-lg shadow-xs">
                <div className="text-[11px] text-base-content/60 uppercase font-semibold">
                  Perceived Alias
                </div>
                <div className={`text-lg font-black font-mono ${data.metrics.is_aliased ? 'text-error' : 'text-success'}`}>
                  {data.metrics.is_aliased ? `${data.metrics.alias_frequency_hz} Hz` : 'None'}
                </div>
              </div>

              <div className="p-3 bg-base-100 border border-base-300 rounded-lg shadow-xs">
                <div className="text-[11px] text-base-content/60 uppercase font-semibold">
                  Sample Count
                </div>
                <div className="text-lg font-black text-base-content font-mono flex items-center gap-1">
                  <Zap className="w-4 h-4 text-warning" />
                  {data.metrics.sample_count} pts
                </div>
              </div>
            </div>
          )}

          {/* Error alert */}
          {isError && (
            <div className="alert alert-error text-xs shadow-sm">
              <AlertTriangle className="w-4 h-4" />
              <span>Error analyzing sampling: {(error as Error)?.message}</span>
            </div>
          )}

          {/* Panel 1: Time Domain */}
          <div className="card bg-base-100 border border-base-300 shadow-sm p-4">
            <EChart
              option={timeChartOption}
              loading={isLoading}
              className="w-full h-80"
            />
          </div>

          {/* Panel 2: Frequency Domain */}
          <div className="card bg-base-100 border border-base-300 shadow-sm p-4">
            <EChart
              option={spectrumChartOption}
              loading={isLoading}
              className="w-full h-72"
            />
          </div>
        </div>
      </div>
    </div>
  )
}
