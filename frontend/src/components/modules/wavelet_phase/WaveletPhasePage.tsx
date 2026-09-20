import { useState, useMemo } from 'react'
import { useQuery } from '@tanstack/react-query'
import type { EChartsOption } from 'echarts'
import {
  Sliders,
  AlertTriangle,
  Compass,
  Radio,
} from 'lucide-react'
import { analyzeWaveletPhase, type WaveletPhaseRequest } from '../../../lib/api'
import { EChart } from '../../charts/EChart'
import { WaveletPhaseTheoryDrawer } from './WaveletPhaseTheoryDrawer'

export function WaveletPhasePage() {
  const [peakFrequencyHz, setPeakFrequencyHz] = useState<number>(30.0)
  const [phaseRotationDeg, setPhaseRotationDeg] = useState<number>(0.0)


  // Wavelet visibility toggles
  const [showZero, setShowZero] = useState<boolean>(true)
  const [showMin, setShowMin] = useState<boolean>(true)
  const [showMax, setShowMax] = useState<boolean>(true)
  const [showRotated, setShowRotated] = useState<boolean>(true)

  const requestPayload: WaveletPhaseRequest = useMemo(() => ({
    peak_frequency_hz: peakFrequencyHz,
    phase_rotation_deg: phaseRotationDeg,
    length_s: 0.25,
    dt_s: 0.001,
  }), [peakFrequencyHz, phaseRotationDeg])

  const { data, isLoading, isError, error } = useQuery({
    queryKey: ['wavelet-phase', requestPayload],
    queryFn: () => analyzeWaveletPhase(requestPayload),
  })

  // Panel 1: Waveforms in Time Domain
  const waveformChartOption: EChartsOption = useMemo(() => {
    if (!data) return {}

    const series: any[] = []

    if (showZero) {
      series.push({
        name: 'Zero-Phase (Ricker)',
        type: 'line',
        data: data.waveforms.zero_phase,
        showSymbol: false,
        lineStyle: { width: 2.2, color: '#3b82f6' },
      })
    }
    if (showMin) {
      series.push({
        name: 'Minimum-Phase (Causal)',
        type: 'line',
        data: data.waveforms.minimum_phase,
        showSymbol: false,
        lineStyle: { width: 2.2, color: '#10b981' },
      })
    }
    if (showMax) {
      series.push({
        name: 'Maximum-Phase (Back-loaded)',
        type: 'line',
        data: data.waveforms.maximum_phase,
        showSymbol: false,
        lineStyle: { width: 1.8, type: 'dashed', color: '#f59e0b' },
      })
    }
    if (showRotated && phaseRotationDeg !== 0) {
      series.push({
        name: `Rotated (${phaseRotationDeg}°)`,
        type: 'line',
        data: data.waveforms.rotated,
        showSymbol: false,
        lineStyle: { width: 2, color: '#ec4899' },
      })
    }

    return {
      title: {
        text: 'Time Domain: Wavelet Comparison (Same Amplitude Spectrum)',
        subtext: 'Zero-phase (symmetric), Minimum-phase (causal), Maximum-phase, and Phase-rotated',
        left: 'left',
        textStyle: { fontSize: 13, fontWeight: 'bold' },
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
        name: 'Amplitude',
        nameLocation: 'middle',
        nameGap: 38,
      },
      dataZoom: [{ type: 'inside' }, { type: 'slider', height: 14, bottom: 2 }],
      series,
    }
  }, [data, showZero, showMin, showMax, showRotated, phaseRotationDeg])

  // Panel 2: Cumulative Energy Build-Up
  const energyChartOption: EChartsOption = useMemo(() => {
    if (!data) return {}

    const series: any[] = []

    if (showZero) {
      series.push({
        name: 'Zero-Phase',
        type: 'line',
        data: data.energies.zero_phase,
        showSymbol: false,
        lineStyle: { width: 2, color: '#3b82f6' },
      })
    }
    if (showMin) {
      series.push({
        name: 'Minimum-Phase (Fastest Build-up)',
        type: 'line',
        data: data.energies.minimum_phase,
        showSymbol: false,
        lineStyle: { width: 2.5, color: '#10b981' },
      })
    }
    if (showMax) {
      series.push({
        name: 'Maximum-Phase (Slowest Build-up)',
        type: 'line',
        data: data.energies.maximum_phase,
        showSymbol: false,
        lineStyle: { width: 2, type: 'dashed', color: '#f59e0b' },
      })
    }
    if (showRotated && phaseRotationDeg !== 0) {
      series.push({
        name: `Rotated (${phaseRotationDeg}°)`,
        type: 'line',
        data: data.energies.rotated,
        showSymbol: false,
        lineStyle: { width: 1.8, color: '#ec4899' },
      })
    }

    return {
      title: {
        text: 'Cumulative Energy Build-up: E(t) % (Yilmaz Fig 1.1-8)',
        subtext: 'Minimum-phase wavelet reaches any energy threshold earlier than any other causal wavelet',
        left: 'left',
        textStyle: { fontSize: 13, fontWeight: 'bold' },
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
        name: 'Energy (%)',
        nameLocation: 'middle',
        nameGap: 38,
        min: 0,
        max: 100,
      },
      dataZoom: [{ type: 'inside' }, { type: 'slider', height: 14, bottom: 2 }],
      series,
    }
  }, [data, showZero, showMin, showMax, showRotated, phaseRotationDeg])

  // Panel 3: Amplitude & Phase Spectra
  const spectraChartOption: EChartsOption = useMemo(() => {
    if (!data) return {}

    return {
      title: {
        text: 'Frequency Spectra: Identical Amplitude vs. Distinct Phase',
        subtext: 'All wavelets share the identical purple amplitude spectrum, differing purely in phase',
        left: 'left',
        textStyle: { fontSize: 13, fontWeight: 'bold' },
      },
      legend: { top: 30, type: 'scroll', textStyle: { fontSize: 11 } },
      tooltip: {
        trigger: 'axis',
        axisPointer: { type: 'cross' },
      },
      grid: { left: 50, right: 25, top: 80, bottom: 35 },
      xAxis: {
        type: 'value',
        name: 'Frequency (Hz)',
        nameLocation: 'middle',
        nameGap: 24,
      },
      yAxis: [
        {
          type: 'value',
          name: 'Amplitude',
          position: 'left',
        },
        {
          type: 'value',
          name: 'Phase (deg)',
          position: 'right',
          min: -180,
          max: 180,
        },
      ],
      dataZoom: [{ type: 'inside' }, { type: 'slider', height: 14, bottom: 2 }],
      series: [
        {
          name: 'Identical Amplitude Spectrum',
          type: 'line',
          yAxisIndex: 0,
          data: data.spectra.amplitude,
          showSymbol: false,
          lineStyle: { width: 3, color: '#a855f7' },
          areaStyle: { color: 'rgba(168, 85, 247, 0.1)' },
        },
        {
          name: 'Phase: Zero-Phase (0°)',
          type: 'line',
          yAxisIndex: 1,
          data: data.spectra.phase_zero,
          showSymbol: false,
          lineStyle: { width: 1.5, type: 'dashed', color: '#3b82f6' },
        },
        {
          name: 'Phase: Minimum-Phase',
          type: 'line',
          yAxisIndex: 1,
          data: data.spectra.phase_min,
          showSymbol: false,
          lineStyle: { width: 1.8, color: '#10b981' },
        },
        {
          name: `Phase: Rotated (${phaseRotationDeg}°)`,
          type: 'line',
          yAxisIndex: 1,
          data: data.spectra.phase_rotated,
          showSymbol: false,
          lineStyle: { width: 1.8, color: '#ec4899' },
        },
      ],
    }
  }, [data, phaseRotationDeg])

  return (
    <div className="space-y-6 pb-12">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-4 border-b border-base-300 pb-4">
        <div>
          <div className="flex items-center gap-2 text-xs font-semibold text-accent uppercase tracking-wider mb-1">
            <Radio className="w-4 h-4" />
            <span>Signal Processing Domain · Section 1.1</span>
          </div>
          <h1 className="text-2xl font-black tracking-tight">Wavelet Phase & Character</h1>
          <p className="text-xs text-base-content/70 mt-0.5">
            Compare zero-phase, minimum-phase, maximum-phase, and phase-rotated wavelets with identical spectra (Oz Yilmaz pp. 34–36)
          </p>
        </div>

        <div className="flex items-center gap-2">
          <div className="badge badge-accent badge-outline gap-1 font-mono text-xs">
            <Compass className="w-3.5 h-3.5" />
            Phase Angle: {phaseRotationDeg}°
          </div>
        </div>
      </div>

      {/* Theory Drawer */}
      <WaveletPhaseTheoryDrawer />

      {/* Main Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column: Parameter Controls */}
        <div className="lg:col-span-4 space-y-4">
          <div className="card bg-base-100 border border-base-300 shadow-sm p-4 space-y-4">
            <div className="flex items-center gap-1.5 font-bold text-xs text-base-content/80 uppercase tracking-wider">
              <Sliders className="w-3.5 h-3.5 text-accent" />
              <span>Wavelet Controls</span>
            </div>

            {/* Central Frequency Slider */}
            <div className="space-y-1 text-xs">
              <div className="flex justify-between">
                <span className="font-semibold">Peak Dominant Frequency (f₀):</span>
                <span className="font-mono font-bold text-primary">{peakFrequencyHz} Hz</span>
              </div>
              <input
                type="range"
                min="15"
                max="80"
                step="5"
                value={peakFrequencyHz}
                onChange={(e) => setPeakFrequencyHz(parseFloat(e.target.value))}
                className="range range-xs range-primary w-full"
              />
            </div>

            {/* Phase Rotation Slider & Presets */}
            <div className="space-y-2 text-xs border-t border-base-200 pt-3">
              <div className="flex justify-between">
                <span className="font-semibold">Phase Rotation Angle (θ):</span>
                <span className="font-mono font-bold text-accent">{phaseRotationDeg}°</span>
              </div>
              <input
                type="range"
                min="-180"
                max="180"
                step="5"
                value={phaseRotationDeg}
                onChange={(e) => setPhaseRotationDeg(parseFloat(e.target.value))}
                className="range range-xs range-accent w-full"
              />

              <div className="grid grid-cols-4 gap-1 pt-1">
                {[0, 45, 90, 180].map((deg) => (
                  <button
                    key={deg}
                    type="button"
                    onClick={() => setPhaseRotationDeg(deg)}
                    className={`btn btn-xs ${
                      phaseRotationDeg === deg ? 'btn-accent' : 'btn-outline'
                    }`}
                  >
                    {deg}° {deg === 0 ? 'Zero' : deg === 90 ? 'Anti' : ''}
                  </button>
                ))}
              </div>
            </div>

            {/* Visibility Toggles */}
            <div className="border-t border-base-200 pt-3 space-y-2 text-xs">
              <div className="font-semibold text-base-content/70">Displayed Wavelet Traces</div>
              <div className="space-y-1.5">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={showZero}
                    onChange={(e) => setShowZero(e.target.checked)}
                    className="checkbox checkbox-xs checkbox-primary"
                  />
                  <span>Zero-Phase Ricker (Symmetric)</span>
                </label>
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={showMin}
                    onChange={(e) => setShowMin(e.target.checked)}
                    className="checkbox checkbox-xs checkbox-success"
                  />
                  <span>Minimum-Phase (Front-Loaded Energy)</span>
                </label>
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={showMax}
                    onChange={(e) => setShowMax(e.target.checked)}
                    className="checkbox checkbox-xs checkbox-warning"
                  />
                  <span>Maximum-Phase (Back-Loaded Energy)</span>
                </label>
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={showRotated}
                    onChange={(e) => setShowRotated(e.target.checked)}
                    className="checkbox checkbox-xs checkbox-secondary"
                  />
                  <span>Phase-Rotated Wavelet ({phaseRotationDeg}°)</span>
                </label>
              </div>
            </div>
          </div>
        </div>

        {/* Right Column: 3 Synchronized ECharts Panels & Metrics */}
        <div className="lg:col-span-8 space-y-6">
          {/* Status Cards */}
          {data && (
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              <div className="p-3 bg-base-100 border border-base-300 rounded-lg shadow-xs">
                <div className="text-[11px] text-base-content/60 uppercase font-semibold">
                  Zero-Phase Peak
                </div>
                <div className="text-lg font-black text-primary font-mono">
                  {data.metrics.zero_phase_peak}
                </div>
              </div>

              <div className="p-3 bg-base-100 border border-base-300 rounded-lg shadow-xs">
                <div className="text-[11px] text-base-content/60 uppercase font-semibold">
                  Rotated Peak Amp
                </div>
                <div className="text-lg font-black text-secondary font-mono">
                  {data.metrics.rotated_peak}
                </div>
              </div>

              <div className="p-3 bg-base-100 border border-base-300 rounded-lg shadow-xs">
                <div className="text-[11px] text-base-content/60 uppercase font-semibold">
                  Min-Phase 50% Energy
                </div>
                <div className="text-lg font-black text-success font-mono">
                  +{data.metrics.min_phase_50pct_ms} ms
                </div>
              </div>

              <div className="p-3 bg-base-100 border border-base-300 rounded-lg shadow-xs">
                <div className="text-[11px] text-base-content/60 uppercase font-semibold">
                  Max-Phase 50% Energy
                </div>
                <div className="text-lg font-black text-warning font-mono">
                  +{data.metrics.max_phase_50pct_ms} ms
                </div>
              </div>
            </div>
          )}

          {/* Error alert */}
          {isError && (
            <div className="alert alert-error text-xs shadow-sm">
              <AlertTriangle className="w-4 h-4" />
              <span>Error analyzing wavelet phase: {(error as Error)?.message}</span>
            </div>
          )}

          {/* Panel 1: Time Domain Waveforms */}
          <div className="card bg-base-100 border border-base-300 shadow-sm p-4">
            <EChart
              option={waveformChartOption}
              loading={isLoading}
              className="w-full h-72"
            />
          </div>

          {/* Panel 2: Cumulative Energy Build-up */}
          <div className="card bg-base-100 border border-base-300 shadow-sm p-4">
            <EChart
              option={energyChartOption}
              loading={isLoading}
              className="w-full h-72"
            />
          </div>

          {/* Panel 3: Frequency Spectra */}
          <div className="card bg-base-100 border border-base-300 shadow-sm p-4">
            <EChart
              option={spectraChartOption}
              loading={isLoading}
              className="w-full h-72"
            />
          </div>
        </div>
      </div>
    </div>
  )
}
