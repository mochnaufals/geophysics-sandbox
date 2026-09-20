import { useState } from 'react'
import { BookOpen, ChevronDown, ChevronUp, Sparkles } from 'lucide-react'
import { MathFormula } from '../../common/MathFormula'


export function TheoryDrawer() {
  const [isOpen, setIsOpen] = useState(true)

  return (
    <div className="card bg-base-100 border border-base-300 shadow-sm transition-all duration-200">
      <div
        className="card-body p-4 cursor-pointer select-none flex flex-row items-center justify-between"
        onClick={() => setIsOpen(!isOpen)}
      >
        <div className="flex items-center gap-3">
          <div className="p-2 bg-primary/10 text-primary rounded-lg">
            <BookOpen className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="font-bold text-base tracking-tight">
                Theory & Reference: Oz Yilmaz §1.1
              </h2>
              <span className="badge badge-primary badge-sm font-mono">1-D Fourier Transform</span>
            </div>
            <p className="text-xs text-base-content/70">
              Spring motion experiment, superposition, forward analysis, and inverse synthesis
            </p>
          </div>
        </div>

        <button
          type="button"
          className="btn btn-ghost btn-sm btn-circle"
          aria-label={isOpen ? 'Collapse theory notes' : 'Expand theory notes'}
        >
          {isOpen ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
        </button>
      </div>

      {isOpen && (
        <div className="border-t border-base-200 px-5 py-4 space-y-6 text-sm text-base-content/90">
          {/* Section 1: The Spring Motion Experiment */}
          <div>
            <div className="flex items-center gap-2 mb-2 font-semibold text-base text-primary">
              <Sparkles className="w-4 h-4" />
              <span>1. The Elastic Spring Experiment (Physical Analogy)</span>
            </div>
            <p className="leading-relaxed">
              In Section 1.1 of <em>Seismic Data Analysis</em>, Oz Yilmaz introduces the Fourier transform through an intuitive physical experiment:
              holding a spring at one end with a suspended weight. Pulling the weight down and releasing it produces sinusoidal motion:
            </p>
            <div className="my-3 p-3 bg-base-200/60 rounded-lg text-center font-mono overflow-x-auto">
              <MathFormula math="x(t) = A \cos(2\pi f t - \phi)" display />
            </div>
            <ul className="list-disc list-inside space-y-1 pl-2 text-xs text-base-content/80">
              <li>
                <strong>Peak Amplitude (<MathFormula math="A" />):</strong> The maximum displacement of the weight from unstretched equilibrium.
              </li>
              <li>
                <strong>Period (<MathFormula math="T" />) & Frequency (<MathFormula math="f = 1/T" />):</strong> The time elapsed between two consecutive crests, measured in Hertz (Hz or cycles/sec).
              </li>
              <li>
                <strong>Phase-Lag & Phase (<MathFormula math="\phi" />):</strong> Releasing a second identical spring after a delay <MathFormula math="\Delta \tau = 20\text{ ms}" /> (one-quarter of a <MathFormula math="12.5\text{ Hz}" /> cycle) imparts a <MathFormula math="+90^\circ" /> phase-lag. Yilmaz defines <em>phase as the negative of phase-lag</em>.
              </li>
            </ul>
          </div>

          {/* Section 2: Superposition & Fourier Transform */}
          <div>
            <h3 className="font-semibold text-base text-primary mb-2">
              2. Analysis vs. Synthesis (The Two-Way Process)
            </h3>
            <p className="leading-relaxed mb-3">
              Imagine an ensemble of many springs, each oscillating at its own frequency, amplitude, and phase.
              When their traces are added together, the result is a complex composite time-dependent signal.
            </p>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="p-3 bg-base-200/50 rounded-lg border border-base-300">
                <div className="font-bold text-xs uppercase tracking-wider text-secondary mb-1">
                  Forward Transform (Analysis)
                </div>
                <p className="text-xs mb-2">
                  Breaks down any arbitrary continuous or discrete time trace into its constituent sinusoidal harmonics:
                </p>
                <div className="overflow-x-auto py-1">
                  <MathFormula math="X(f) = \int_{-\infty}^{\infty} x(t) e^{-i 2\pi f t} dt" display />
                </div>
              </div>

              <div className="p-3 bg-base-200/50 rounded-lg border border-base-300">
                <div className="font-bold text-xs uppercase tracking-wider text-secondary mb-1">
                  Inverse Transform (Synthesis)
                </div>
                <p className="text-xs mb-2">
                  Reconstructs the original time-domain waveform by summing up all frequency components:
                </p>
                <div className="overflow-x-auto py-1">
                  <MathFormula math="x(t) = \int_{-\infty}^{\infty} X(f) e^{i 2\pi f t} df" display />
                </div>
              </div>
            </div>
          </div>

          {/* Section 3: Amplitude & Phase Spectra */}
          <div>
            <h3 className="font-semibold text-base text-primary mb-2">
              3. Amplitude and Phase Spectra
            </h3>
            <p className="leading-relaxed mb-2">
              Each Fourier coefficient <MathFormula math="X(f)" /> is a complex number composed of real (<MathFormula math="\text{Re}" />) and imaginary (<MathFormula math="\text{Im}" />) parts:
            </p>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="p-3 bg-base-200/50 rounded-lg border border-base-300">
                <div className="font-bold text-xs uppercase tracking-wider mb-1">Amplitude Spectrum</div>
                <MathFormula math="|X(f)| = \sqrt{\text{Re}^2(f) + \text{Im}^2(f)}" display />
                <p className="text-xs text-base-content/70 mt-1">
                  Measures <em>how much energy</em> is present at each frequency. Invariant to pure time translations.
                </p>
              </div>
              <div className="p-3 bg-base-200/50 rounded-lg border border-base-300">
                <div className="font-bold text-xs uppercase tracking-wider mb-1">Phase Spectrum</div>
                <MathFormula math="\phi(f) = \arctan\left(\frac{\text{Im}(f)}{\text{Re}(f)}\right)" display />
                <p className="text-xs text-base-content/70 mt-1">
                  Measures <em>where that energy is located in time</em>. Crucial in seismic processing for wavelet character, minimum phase vs zero phase, and traveltime arrivals.
                </p>
              </div>
            </div>
          </div>

          {/* Reference Citation Footer */}
          <div className="pt-2 border-t border-base-200 flex items-center justify-between text-xs text-base-content/60">
            <span>Reference: Yilmaz, O. (2001). <em>Seismic Data Analysis</em>, Vol. 1, Ch. 1, pp. 25–34. Society of Exploration Geophysicists.</span>
            <span className="flex items-center gap-1 text-primary">
              Investigations in Geophysics No. 10
            </span>
          </div>
        </div>
      )}
    </div>
  )
}
