import { Plus, Trash2, RotateCcw, Activity } from 'lucide-react'

export interface HarmonicItem {
  id: string
  frequency: number
  amplitude: number
  phase_deg: number
}

interface HarmonicsBuilderProps {
  harmonics: HarmonicItem[]
  onChange: (updated: HarmonicItem[]) => void
}

export function HarmonicsBuilder({ harmonics, onChange }: HarmonicsBuilderProps) {
  const addHarmonic = () => {
    const nextId = `spring_${Date.now()}`
    const lastFreq = harmonics.length > 0 ? harmonics[harmonics.length - 1].frequency : 10
    onChange([
      ...harmonics,
      {
        id: nextId,
        frequency: Math.min(100, lastFreq + 10),
        amplitude: 0.5,
        phase_deg: 0,
      },
    ])
  }

  const updateHarmonic = (id: string, field: keyof HarmonicItem, value: number) => {
    onChange(
      harmonics.map((h) => (h.id === id ? { ...h, [field]: value } : h))
    )
  }

  const removeHarmonic = (id: string) => {
    if (harmonics.length <= 1) return
    onChange(harmonics.filter((h) => h.id !== id))
  }

  const loadYilmazExample = () => {
    onChange([
      { id: 'yilmaz_1', frequency: 12.5, amplitude: 0.8, phase_deg: 0 },
      { id: 'yilmaz_2', frequency: 25.0, amplitude: 0.4, phase_deg: 0 },
      { id: 'yilmaz_3', frequency: 12.5, amplitude: 0.8, phase_deg: 90 },
    ])
  }

  const resetToSingle = () => {
    onChange([{ id: 'single_1', frequency: 25.0, amplitude: 1.0, phase_deg: 0 }])
  }

  return (
    <div className="card bg-base-100 border border-base-300 p-4 shadow-sm space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-2 border-b border-base-200 pb-3">
        <div className="flex items-center gap-2">
          <Activity className="w-4 h-4 text-primary" />
          <h3 className="font-bold text-sm tracking-tight">Sinusoidal Springs Superposition Builder</h3>
        </div>
        <div className="flex items-center gap-2">
          <button
            type="button"
            className="btn btn-outline btn-xs gap-1"
            onClick={loadYilmazExample}
            title="Load the 3 springs from Yilmaz Figure 1.1-1"
          >
            Load Fig 1.1-1
          </button>
          <button
            type="button"
            className="btn btn-ghost btn-xs gap-1 text-base-content/70"
            onClick={resetToSingle}
          >
            <RotateCcw className="w-3 h-3" />
            Reset
          </button>
          <button
            type="button"
            className="btn btn-primary btn-xs gap-1"
            onClick={addHarmonic}
          >
            <Plus className="w-3 h-3" />
            Add Spring
          </button>
        </div>
      </div>

      <div className="space-y-3 max-h-72 overflow-y-auto pr-1">
        {harmonics.map((h, idx) => (
          <div
            key={h.id}
            className="p-3 bg-base-200/50 rounded-lg border border-base-300/80 grid grid-cols-1 sm:grid-cols-12 gap-3 items-center text-xs"
          >
            {/* Spring Label */}
            <div className="sm:col-span-2 font-semibold text-primary flex items-center gap-1">
              <span className="w-5 h-5 rounded-full bg-primary/10 flex items-center justify-center text-[10px]">
                {idx + 1}
              </span>
              <span>Spring {idx + 1}</span>
            </div>

            {/* Frequency */}
            <div className="sm:col-span-3 space-y-1">
              <div className="flex justify-between text-base-content/70">
                <span>Freq (Hz):</span>
                <span className="font-mono font-bold text-base-content">{h.frequency} Hz</span>
              </div>
              <input
                type="range"
                min="1"
                max="100"
                step="0.5"
                value={h.frequency}
                onChange={(e) => updateHarmonic(h.id, 'frequency', parseFloat(e.target.value))}
                className="range range-xs range-primary w-full"
              />
            </div>

            {/* Peak Amplitude */}
            <div className="sm:col-span-3 space-y-1">
              <div className="flex justify-between text-base-content/70">
                <span>Amp (A):</span>
                <span className="font-mono font-bold text-base-content">{h.amplitude.toFixed(2)}</span>
              </div>
              <input
                type="range"
                min="0.1"
                max="2.0"
                step="0.05"
                value={h.amplitude}
                onChange={(e) => updateHarmonic(h.id, 'amplitude', parseFloat(e.target.value))}
                className="range range-xs range-secondary w-full"
              />
            </div>

            {/* Phase Lag */}
            <div className="sm:col-span-3 space-y-1">
              <div className="flex justify-between text-base-content/70">
                <span>Phase Lag:</span>
                <span className="font-mono font-bold text-base-content">{h.phase_deg}°</span>
              </div>
              <input
                type="range"
                min="0"
                max="360"
                step="15"
                value={h.phase_deg}
                onChange={(e) => updateHarmonic(h.id, 'phase_deg', parseFloat(e.target.value))}
                className="range range-xs range-accent w-full"
              />
            </div>

            {/* Delete button */}
            <div className="sm:col-span-1 flex justify-end">
              <button
                type="button"
                className="btn btn-ghost btn-xs btn-circle text-error/70 hover:text-error"
                onClick={() => removeHarmonic(h.id)}
                disabled={harmonics.length <= 1}
                aria-label={`Remove Spring ${idx + 1}`}
              >
                <Trash2 className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
