import { useState } from 'react'
import { BookOpen, ChevronDown, ChevronUp, Sparkles, AlertOctagon } from 'lucide-react'
import { MathFormula } from '../../common/MathFormula'

export function SamplingTheoryDrawer() {
  const [isOpen, setIsOpen] = useState(true)

  return (
    <div className="card bg-base-100 border border-base-300 shadow-sm transition-all duration-200">
      <div
        className="card-body p-4 cursor-pointer select-none flex flex-row items-center justify-between"
        onClick={() => setIsOpen(!isOpen)}
      >
        <div className="flex items-center gap-3">
          <div className="p-2 bg-warning/10 text-warning rounded-lg">
            <BookOpen className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="font-bold text-base tracking-tight">
                Theory & Reference: Oz Yilmaz §1.1 (Sampling & Frequency Aliasing)
              </h2>
              <span className="badge badge-warning badge-sm font-mono">Nyquist Criterion</span>
            </div>
            <p className="text-xs text-base-content/70">
              Discrete sampling, Nyquist folding frequency, and why anti-aliasing filters are mandatory
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
          {/* Section 1: Sampling & The Nyquist Frequency */}
          <div>
            <div className="flex items-center gap-2 mb-2 font-semibold text-base text-warning">
              <Sparkles className="w-4 h-4" />
              <span>1. The Nyquist-Shannon Sampling Theorem</span>
            </div>
            <p className="leading-relaxed">
              Continuous seismic ground vibrations are digitized in time at regular sampling intervals <MathFormula math="\Delta t" /> (typically 1 ms, 2 ms, or 4 ms). The sampling rate is <MathFormula math="f_s = 1 / \Delta t" />.
              To reconstruct a continuous signal from its discrete samples unambiguously, there must be at least <strong>two samples per cycle</strong> for the highest frequency component:
            </p>
            <div className="my-3 p-3 bg-base-200/60 rounded-lg text-center font-mono overflow-x-auto">
              <MathFormula math="f_{\text{Nyquist}} = \frac{f_s}{2} = \frac{1}{2\Delta t}" display />
            </div>
            <p className="text-xs text-base-content/80">
              For example: with <MathFormula math="\Delta t = 2\text{ ms}" />, <MathFormula math="f_s = 500\text{ Hz}" /> and the Nyquist frequency is <MathFormula math="250\text{ Hz}" />. With <MathFormula math="\Delta t = 4\text{ ms}" />, Nyquist is <MathFormula math="125\text{ Hz}" />.
            </p>
          </div>

          {/* Section 2: Frequency Aliasing & Folding */}
          <div>
            <h3 className="font-semibold text-base text-warning mb-2">
              2. Frequency Folding (Aliasing)
            </h3>
            <p className="leading-relaxed mb-3">
              If an analog seismic event oscillates at a frequency <MathFormula math="f_{\text{true}} > f_{\text{Nyquist}}" />, the discrete samples cannot distinguish it from a lower frequency.
              The frequency <em>folds back</em> into the principal Nyquist band according to:
            </p>
            <div className="p-3 bg-base-200/60 rounded-lg text-center font-mono overflow-x-auto my-2">
              <MathFormula math="f_{\text{alias}} = |f_{\text{true}} - k \cdot f_s|, \quad k = \text{round}(f_{\text{true}} / f_s)" display />
            </div>
            <p className="text-xs leading-relaxed text-base-content/80">
              In Yilmaz Figure 1.1-4, a high-frequency sinusoid sampled at too coarse an interval causes the sampled dots to trace out a completely false low-frequency sinusoid. The observer is deceived into interpreting non-existent low-frequency events.
            </p>
          </div>

          {/* Section 3: The Irreversibility of Aliasing */}
          <div className="p-3 bg-error/10 border border-error/20 rounded-lg flex items-start gap-3">
            <AlertOctagon className="w-5 h-5 text-error shrink-0 mt-0.5" />
            <div className="text-xs space-y-1">
              <div className="font-bold text-error uppercase tracking-wider">Crucial Geophysical Takeaway</div>
              <p className="leading-relaxed text-base-content">
                <strong>Aliasing cannot be undone digitally in post-processing.</strong> Once sampled, folded high-frequency energy is numerically identical to native low-frequency energy.
                Therefore, all seismic recording systems apply an analog <strong>anti-aliasing high-cut filter</strong> in the instrument before analog-to-digital conversion.
              </p>
            </div>
          </div>

          {/* Reference Citation Footer */}
          <div className="pt-2 border-t border-base-200 flex items-center justify-between text-xs text-base-content/60">
            <span>Reference: Yilmaz, O. (2001). <em>Seismic Data Analysis</em>, Vol. 1, Ch. 1, pp. 28–34. Society of Exploration Geophysicists.</span>
            <span className="text-warning font-mono text-[11px]">Section 1.1</span>
          </div>
        </div>
      )}
    </div>
  )
}
