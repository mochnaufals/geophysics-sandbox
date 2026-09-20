import { useState, useMemo } from 'react'
import { useQuery } from '@tanstack/react-query'
import type { EChartsOption } from 'echarts'
import {
  Sliders,
  CheckCircle2,
  AlertTriangle,
  Eye,
  EyeOff,
  Radio,
} from 'lucide-react'
import { analyzeFourier1D, type Fourier1DRequest } from '../../../lib/api'
import { EChart } from '../../charts/EChart'
import { TheoryDrawer } from './TheoryDrawer'
import { HarmonicsBuilder, type HarmonicItem } from './HarmonicsBuilder'

const PRESETS = [
  {
    id: 'spring_superposition',
    title: 'Spring Superposition',
    subtitle: 'Yilmaz Fig 1.1-1 & 1.1-2 (12.5 Hz, 25 Hz, 40 Hz)',
  },
  {
    id: 'dual_delay',
    title: 'Dual Delay Sinusoids',
    subtitle: 'Fig 1.1-1 frames 1 & 3: Phase lag via time delay',
  },
  {
    id: 'single_sinusoid',
    title: 'Single Pure Sinusoid',
    subtitle: 'Single harmonic spring oscillation',
  },
  {
    id: 'ricker_wavelet',
    title: 'Ricker Wavelet',
    subtitle: 'Zero-phase canonical seismic reflection wavelet',
  },
  {
    id: 'dirac_impulse',
    title: 'Dirac Impulse (Spike)',
    subtitle: 'Infinitely sharp spike -> White flat spectrum',
  },
  {
    id: 'boxcar_pulse',
    title: 'Boxcar / Gate Pulse',
    subtitle: 'Rectangular pulse in time -> Sinc in frequency',
  },
  {
    id: 'gaussian_pulse',
    title: 'Gaussian Pulse',
    subtitle: 'Smooth Gaussian bell curve in both domains',
  },
]

export function Fourier1DModulePage() {
  const [activeTab, setActiveTab] = useState<'presets' | 'harmonics'>('presets')
  const [selectedPreset, setSelectedPreset] = useState<string>('spring_superposition')
  const [samplingIntervalMs, setSamplingIntervalMs] = useState<number>(2.0) // 2 ms = 500 Hz
  const [durationS, setDurationS] = useState<number>(1.0)
  const [showComponents, setShowComponents] = useState<boolean>(true)
  const [amplitudeScale, setAmplitudeScale] = useState<'linear' | 'db'>('linear')
  const [phaseThresholdDb, setPhaseThresholdDb] = useState<number>(-60)
  const [unwrapPhase, setUnwrapPhase] = useState<boolean>(false)

  // Preset-specific parameters
  const [delayMs, setDelayMs] = useState<number>(20.0) // 20 ms -> 90 deg at 12.5 Hz
  const [singleFreq, setSingleFreq] = useState<number>(25.0)
  const [rickerFreq, setRickerFreq] = useState<number>(30.0)
  const [boxcarWidthS, setBoxcarWidthS] = useState<number>(0.1)

  // Harmonics builder state
  const [harmonics, setHarmonics] = useState<HarmonicItem[]>([
    { id: '1', frequency: 12.5, amplitude: 0.8, phase_deg: 0 },
    { id: '2', frequency: 25.0, amplitude: 0.4, phase_deg: 0 },
    { id: '3', frequency: 40.0, amplitude: 0.3, phase_deg: 45 },
  ])

  // Build payload
  const requestPayload: Fourier1DRequest = useMemo(() => {
    const dt = samplingIntervalMs / 1000.0
    if (activeTab === 'harmonics') {
      return {
        mode: 'harmonics',
        harmonics: harmonics.map((h) => ({
          frequency: h.frequency,
          amplitude: h.amplitude,
          phase_deg: h.phase_deg,
        })),
        duration_s: durationS,
        dt_s: dt,
        phase_threshold_db: phaseThresholdDb,
        unwrap_phase: unwrapPhase,
      }
    }

    const presetParams: Record<string, unknown> = {}
    if (selectedPreset === 'dual_delay') {
      presetParams.delay_ms = delayMs
      presetParams.frequency = 12.5
      presetParams.amplitude = 0.8
    } else if (selectedPreset === 'single_sinusoid') {
      presetParams.frequency = singleFreq
      presetParams.amplitude = 1.0
    } else if (selectedPreset === 'ricker_wavelet') {
      presetParams.frequency = rickerFreq
    } else if (selectedPreset === 'boxcar_pulse') {
      presetParams.width_s = boxcarWidthS
    }

    return {
      mode: 'preset',
      preset: selectedPreset,
      preset_params: presetParams,
      duration_s: durationS,
      dt_s: dt,
      phase_threshold_db: phaseThresholdDb,
      unwrap_phase: unwrapPhase,
    }
  }, [
    activeTab,
    selectedPreset,
    samplingIntervalMs,
    durationS,
    phaseThresholdDb,
    unwrapPhase,
    delayMs,
    singleFreq,
    rickerFreq,
    boxcarWidthS,
    harmonics,
  ])

  // Query Fourier API
  const { data, isLoading, isError, error } = useQuery({
    queryKey: ['fourier-1d', requestPayload],
    queryFn: () => analyzeFourier1D(requestPayload),
  })

  // ECharts Option: Time Domain
  const timeChartOption: EChartsOption = useMemo(() => {
    if (!data) return {}

    const series: any[] = [
      {
        name: 'Composite Signal x(t)',
        type: 'line',
        data: data.time_series,
        showSymbol: false,
        lineStyle: { width: 2.5, color: '#3b82f6' },
        z: 5,
      },
    ]

    if (showComponents && data.components && data.components.length > 0) {
      const colors = ['#10b981', '#f59e0b', '#ec4899', '#8b5cf6', '#06b6d4']
      data.components.forEach((comp, idx) => {
        series.push({
          name: comp.name,
          type: 'line',
          data: comp.data,
          showSymbol: false,
          lineStyle: {
            width: 1.2,
            type: 'dashed',
            color: colors[idx % colors.length],
            opacity: 0.7,
          },
          z: 2,
        })
      })
    }

    return {
      title: {
        text: 'Time Domain: Waveform Superposition x(t)',
        subtext: 'Tracing the motion of elastic springs over time',
        left: 'left',
        textStyle: { fontSize: 13, fontWeight: 'bold' },
      },
      legend: {
        top: 25,
        type: 'scroll',
        textStyle: { fontSize: 11 },
      },
      tooltip: {
        trigger: 'axis',
        axisPointer: { type: 'cross' },
        formatter: (params: any) => {
          if (!Array.isArray(params) || params.length === 0) return ''
          const timeMs = params[0].data[0]
          let text = `<div class="font-mono text-xs font-bold">Time: ${timeMs} ms</div>`
          params.forEach((p: any) => {
            text += `<div class="text-xs flex items-center gap-1.5" style="color:${p.color}">
              <span class="inline-block w-2 h-2 rounded-full" style="background:${p.color}"></span>
              ${p.seriesName}: <strong>${Number(p.data[1]).toFixed(4)}</strong>
            </div>`
          })
          return text
        },
      },
      grid: { left: 55, right: 25, top: 75, bottom: 40 },
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
      },
      dataZoom: [{ type: 'inside' }, { type: 'slider', height: 16, bottom: 2 }],
      series,
    }
  }, [data, showComponents])

  // ECharts Option: Amplitude Spectrum
  const amplitudeChartOption: EChartsOption = useMemo(() => {
    if (!data) return {}

    const isDb = amplitudeScale === 'db'
    const chartData = isDb ? data.amplitude_series_db : data.amplitude_series_linear

    return {
      title: {
        text: `Frequency Domain: Amplitude Spectrum |X(f)| (${isDb ? 'Decibels dB' : 'Linear Peak Amplitude'})`,
        subtext: 'Spectral distribution indicating energy content at each frequency',
        left: 'left',
        textStyle: { fontSize: 13, fontWeight: 'bold' },
      },
      tooltip: {
        trigger: 'axis',
        axisPointer: { type: 'cross' },
        formatter: (params: any) => {
          if (!Array.isArray(params) || params.length === 0) return ''
          const p = params[0]
          const freq = p.data[0]
          const val = p.data[1]
          return `<div class="font-mono text-xs">
            Frequency: <strong>${freq} Hz</strong><br/>
            Amplitude: <strong>${val} ${isDb ? 'dB' : ''}</strong>
          </div>`
        },
      },
      grid: { left: 55, right: 25, top: 60, bottom: 40 },
      xAxis: {
        type: 'value',
        name: 'Frequency (Hz)',
        nameLocation: 'middle',
        nameGap: 24,
      },
      yAxis: {
        type: 'value',
        name: isDb ? 'Magnitude (dB)' : 'Peak Amplitude',
        nameLocation: 'middle',
        nameGap: 38,
        min: isDb ? -80 : undefined,
      },
      dataZoom: [{ type: 'inside' }, { type: 'slider', height: 16, bottom: 2 }],
      series: [
        {
          name: 'Amplitude',
          type: 'line',
          data: chartData,
          showSymbol: false,
          areaStyle: {
            color: 'rgba(236, 72, 153, 0.15)',
          },
          lineStyle: { width: 2, color: '#ec4899' },
          markPoint: {
            data: [
              {
                type: 'max',
                name: 'Peak Frequency',
                symbolSize: 45,
                itemStyle: { color: '#ec4899' },
              },
            ],
          },
        },
      ],
    }
  }, [data, amplitudeScale])

  // ECharts Option: Phase Spectrum
  const phaseChartOption: EChartsOption = useMemo(() => {
    if (!data) return {}

    return {
      title: {
        text: 'Frequency Domain: Phase Spectrum φ(f) (Degrees)',
        subtext: 'Phase lag convention: negative of phase shift, masked below noise threshold',
        left: 'left',
        textStyle: { fontSize: 13, fontWeight: 'bold' },
      },
      tooltip: {
        trigger: 'axis',
        axisPointer: { type: 'cross' },
        formatter: (params: any) => {
          if (!Array.isArray(params) || params.length === 0) return ''
          const p = params[0]
          const freq = p.data[0]
          const phase = p.data[1]
          return `<div class="font-mono text-xs">
            Frequency: <strong>${freq} Hz</strong><br/>
            Phase Angle: <strong>${phase}°</strong>
          </div>`
        },
      },
      grid: { left: 55, right: 25, top: 60, bottom: 40 },
      xAxis: {
        type: 'value',
        name: 'Frequency (Hz)',
        nameLocation: 'middle',
        nameGap: 24,
      },
      yAxis: {
        type: 'value',
        name: 'Phase (deg)',
        nameLocation: 'middle',
        nameGap: 38,
        min: -180,
        max: 180,
      },
      dataZoom: [{ type: 'inside' }, { type: 'slider', height: 16, bottom: 2 }],
      series: [
        {
          name: 'Phase Spectrum',
          type: 'line',
          data: data.phase_series,
          showSymbol: false,
          lineStyle: { width: 1.8, color: '#10b981' },
          markLine: {
            silent: true,
            symbol: 'none',
            lineStyle: { type: 'dashed', color: 'rgba(150, 150, 150, 0.4)' },
            data: [{ yAxis: 0 }, { yAxis: 90 }, { yAxis: -90 }],
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
          <div className="flex items-center gap-2 text-xs font-semibold text-primary uppercase tracking-wider mb-1">
            <Radio className="w-4 h-4" />
            <span>Signal Processing Domain</span>
          </div>
          <h1 className="text-2xl font-black tracking-tight">1D Fourier Transform</h1>
          <p className="text-xs text-base-content/70 mt-0.5">
            Harmonics decomposition, spring superposition, amplitude and phase spectra from Oz Yilmaz §1.1
          </p>
        </div>

        <div className="flex items-center gap-2">
          <div className="badge badge-outline gap-1 font-mono text-xs">
            <span className="w-1.5 h-1.5 rounded-full bg-success"></span>
            FastAPI NumPy Engine
          </div>
        </div>
      </div>

      {/* Theory & Reference Accordion */}
      <TheoryDrawer />

      {/* Control Deck */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column: Signal Source & Parameters */}
        <div className="lg:col-span-4 space-y-4">
          <div className="card bg-base-100 border border-base-300 shadow-sm p-4 space-y-4">
            {/* Mode Switcher Tabs */}
            <div className="tabs tabs-box grid grid-cols-2">
              <button
                type="button"
                className={`tab ${activeTab === 'presets' ? 'tab-active font-bold' : ''}`}
                onClick={() => setActiveTab('presets')}
              >
                Canonical Presets
              </button>
              <button
                type="button"
                className={`tab ${activeTab === 'harmonics' ? 'tab-active font-bold' : ''}`}
                onClick={() => setActiveTab('harmonics')}
              >
                Springs Builder
              </button>
            </div>

            {/* Presets List */}
            {activeTab === 'presets' ? (
              <div className="space-y-3">
                <label className="text-xs font-bold text-base-content/70 uppercase tracking-wider">
                  Select Preset Signal
                </label>
                <div className="space-y-1.5 max-h-56 overflow-y-auto pr-1">
                  {PRESETS.map((p) => (
                    <button
                      key={p.id}
                      type="button"
                      onClick={() => setSelectedPreset(p.id)}
                      className={`w-full text-left p-2.5 rounded-lg border transition-all text-xs flex flex-col gap-0.5 ${
                        selectedPreset === p.id
                          ? 'bg-primary/10 border-primary text-primary font-bold'
                          : 'bg-base-200/40 border-base-300 hover:bg-base-200/80 text-base-content'
                      }`}
                    >
                      <span>{p.title}</span>
                      <span className="text-[11px] font-normal opacity-70">{p.subtitle}</span>
                    </button>
                  ))}
                </div>

                {/* Preset-specific sliders */}
                {selectedPreset === 'dual_delay' && (
                  <div className="p-3 bg-base-200/60 rounded-lg space-y-1 text-xs border border-base-300">
                    <div className="flex justify-between">
                      <span className="font-semibold">Spring 2 Time Delay (Δτ):</span>
                      <span className="font-mono font-bold text-primary">{delayMs} ms</span>
                    </div>
                    <input
                      type="range"
                      min="0"
                      max="80"
                      step="2"
                      value={delayMs}
                      onChange={(e) => setDelayMs(parseFloat(e.target.value))}
                      className="range range-xs range-primary w-full"
                    />
                    <div className="text-[10px] text-base-content/60">
                      Phase lag = (360° × 12.5 Hz × {delayMs} ms) = <strong>{((360 * 12.5 * delayMs) / 1000).toFixed(0)}°</strong>
                    </div>
                  </div>
                )}

                {selectedPreset === 'single_sinusoid' && (
                  <div className="p-3 bg-base-200/60 rounded-lg space-y-1 text-xs border border-base-300">
                    <div className="flex justify-between">
                      <span className="font-semibold">Sinusoid Frequency:</span>
                      <span className="font-mono font-bold text-primary">{singleFreq} Hz</span>
                    </div>
                    <input
                      type="range"
                      min="5"
                      max="100"
                      step="1"
                      value={singleFreq}
                      onChange={(e) => setSingleFreq(parseFloat(e.target.value))}
                      className="range range-xs range-primary w-full"
                    />
                  </div>
                )}

                {selectedPreset === 'ricker_wavelet' && (
                  <div className="p-3 bg-base-200/60 rounded-lg space-y-1 text-xs border border-base-300">
                    <div className="flex justify-between">
                      <span className="font-semibold">Central Peak Frequency (f₀):</span>
                      <span className="font-mono font-bold text-primary">{rickerFreq} Hz</span>
                    </div>
                    <input
                      type="range"
                      min="10"
                      max="80"
                      step="2"
                      value={rickerFreq}
                      onChange={(e) => setRickerFreq(parseFloat(e.target.value))}
                      className="range range-xs range-primary w-full"
                    />
                  </div>
                )}

                {selectedPreset === 'boxcar_pulse' && (
                  <div className="p-3 bg-base-200/60 rounded-lg space-y-1 text-xs border border-base-300">
                    <div className="flex justify-between">
                      <span className="font-semibold">Boxcar Width (Tw):</span>
                      <span className="font-mono font-bold text-primary">{(boxcarWidthS * 1000).toFixed(0)} ms</span>
                    </div>
                    <input
                      type="range"
                      min="0.02"
                      max="0.4"
                      step="0.01"
                      value={boxcarWidthS}
                      onChange={(e) => setBoxcarWidthS(parseFloat(e.target.value))}
                      className="range range-xs range-primary w-full"
                    />
                  </div>
                )}
              </div>
            ) : (
              <HarmonicsBuilder harmonics={harmonics} onChange={setHarmonics} />
            )}

            {/* Global Sampling & Fourier Settings */}
            <div className="border-t border-base-200 pt-3 space-y-3 text-xs">
              <div className="flex items-center gap-1.5 font-bold text-base-content/80">
                <Sliders className="w-3.5 h-3.5 text-primary" />
                <span>Acquisition & Processing Parameters</span>
              </div>

              {/* Sampling rate */}
              <div className="space-y-1">
                <div className="flex justify-between">
                  <span>Sample Interval (Δt):</span>
                  <span className="font-mono font-bold">
                    {samplingIntervalMs} ms ({Math.round(1000 / samplingIntervalMs)} Hz)
                  </span>
                </div>
                <div className="grid grid-cols-3 gap-1">
                  {[1.0, 2.0, 4.0].map((dt) => (
                    <button
                      key={dt}
                      type="button"
                      onClick={() => setSamplingIntervalMs(dt)}
                      className={`btn btn-xs ${
                        samplingIntervalMs === dt ? 'btn-primary' : 'btn-outline'
                      }`}
                    >
                      {dt} ms (Nyq {500 / dt} Hz)
                    </button>
                  ))}
                </div>
              </div>

              {/* Duration */}
              <div className="space-y-1">
                <div className="flex justify-between">
                  <span>Duration (T):</span>
                  <span className="font-mono font-bold">{durationS} s</span>
                </div>
                <div className="grid grid-cols-3 gap-1">
                  {[0.5, 1.0, 2.0].map((dur) => (
                    <button
                      key={dur}
                      type="button"
                      onClick={() => setDurationS(dur)}
                      className={`btn btn-xs ${
                        durationS === dur ? 'btn-primary' : 'btn-outline'
                      }`}
                    >
                      {dur} s
                    </button>
                  ))}
                </div>
              </div>

              {/* View options toggles */}
              <div className="pt-2 border-t border-base-200 space-y-2">
                <div className="flex items-center justify-between">
                  <span>Show Individual Springs:</span>
                  <button
                    type="button"
                    className={`btn btn-xs gap-1 ${
                      showComponents ? 'btn-primary' : 'btn-ghost'
                    }`}
                    onClick={() => setShowComponents(!showComponents)}
                  >
                    {showComponents ? <Eye className="w-3 h-3" /> : <EyeOff className="w-3 h-3" />}
                    {showComponents ? 'Visible' : 'Hidden'}
                  </button>
                </div>

                <div className="flex items-center justify-between">
                  <span>Amplitude Scale:</span>
                  <div className="join">
                    <button
                      type="button"
                      className={`join-item btn btn-xs ${
                        amplitudeScale === 'linear' ? 'btn-active btn-primary' : ''
                      }`}
                      onClick={() => setAmplitudeScale('linear')}
                    >
                      Linear
                    </button>
                    <button
                      type="button"
                      className={`join-item btn btn-xs ${
                        amplitudeScale === 'db' ? 'btn-active btn-primary' : ''
                      }`}
                      onClick={() => setAmplitudeScale('db')}
                    >
                      dB
                    </button>
                  </div>
                </div>

                <div className="flex items-center justify-between">
                  <span>Phase Noise Threshold:</span>
                  <span className="font-mono font-bold">{phaseThresholdDb} dB</span>
                </div>
                <input
                  type="range"
                  min="-100"
                  max="-20"
                  step="5"
                  value={phaseThresholdDb}
                  onChange={(e) => setPhaseThresholdDb(parseFloat(e.target.value))}
                  className="range range-xs range-accent w-full"
                />

                <div className="flex items-center justify-between pt-1">
                  <span>Unwrap Phase:</span>
                  <input
                    type="checkbox"
                    checked={unwrapPhase}
                    onChange={(e) => setUnwrapPhase(e.target.checked)}
                    className="toggle toggle-xs toggle-primary"
                  />
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Right Column: 3-Panel Synchronized Dashboard */}
        <div className="lg:col-span-8 space-y-6">
          {/* Status / Metrics Bar */}
          {data && (
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              <div className="p-3 bg-base-100 border border-base-300 rounded-lg shadow-xs">
                <div className="text-[11px] text-base-content/60 uppercase font-semibold">
                  Dominant Freq
                </div>
                <div className="text-lg font-black text-primary font-mono">
                  {data.metrics.dominant_frequency_hz} Hz
                </div>
              </div>

              <div className="p-3 bg-base-100 border border-base-300 rounded-lg shadow-xs">
                <div className="text-[11px] text-base-content/60 uppercase font-semibold">
                  Peak Amplitude
                </div>
                <div className="text-lg font-black text-secondary font-mono">
                  {data.metrics.peak_amplitude}
                </div>
              </div>

              <div className="p-3 bg-base-100 border border-base-300 rounded-lg shadow-xs">
                <div className="text-[11px] text-base-content/60 uppercase font-semibold">
                  Nyquist Freq
                </div>
                <div className="text-lg font-black text-accent font-mono">
                  {data.metrics.nyquist_frequency_hz} Hz
                </div>
              </div>

              <div className="p-3 bg-base-100 border border-base-300 rounded-lg shadow-xs">
                <div className="text-[11px] text-base-content/60 uppercase font-semibold">
                  IFFT Round-Trip MSE
                </div>
                <div className="text-lg font-black text-success font-mono flex items-center gap-1">
                  <CheckCircle2 className="w-4 h-4 text-success" />
                  {data.metrics.reconstruction_mse < 1e-12 ? '< 1e-12' : data.metrics.reconstruction_mse.toExponential(2)}
                </div>
              </div>
            </div>
          )}

          {/* Error notice */}
          {isError && (
            <div className="alert alert-error text-xs shadow-sm">
              <AlertTriangle className="w-4 h-4" />
              <span>Failed to compute Fourier transform: {(error as Error)?.message}</span>
            </div>
          )}

          {/* Panel 1: Time Domain */}
          <div className="card bg-base-100 border border-base-300 shadow-sm p-4">
            <EChart
              option={timeChartOption}
              loading={isLoading}
              className="w-full h-72"
            />
          </div>

          {/* Panel 2: Amplitude Spectrum */}
          <div className="card bg-base-100 border border-base-300 shadow-sm p-4">
            <EChart
              option={amplitudeChartOption}
              loading={isLoading}
              className="w-full h-72"
            />
          </div>

          {/* Panel 3: Phase Spectrum */}
          <div className="card bg-base-100 border border-base-300 shadow-sm p-4">
            <EChart
              option={phaseChartOption}
              loading={isLoading}
              className="w-full h-72"
            />
          </div>
        </div>
      </div>
    </div>
  )
}
