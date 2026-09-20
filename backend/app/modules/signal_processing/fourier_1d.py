"""
1D Fourier Transform Engine
Based on Section 1.1 (The 1-D Fourier Transform) of
'Seismic Data Analysis: Processing, Inversion, and Interpretation of Seismic Data'
by Oz Yilmaz (Society of Exploration Geophysicists).

Provides:
- Harmonic spring generation & superposition
- Canonical presets (Single sinusoid, Dual phase-lagged sinusoids, Impulse, Boxcar, Gaussian, Ricker)
- Discrete forward Fourier transform with physical amplitude calibration
- Phase spectrum with noise masking
- Inverse Fourier transform (synthesis) and reconstruction verification
"""

from typing import Dict, List, Optional, Tuple, Any
import numpy as np

from app.common.chart_utils import numpy_to_chart_data


def generate_harmonics_signal(
    harmonics: List[Dict[str, float]],
    t: np.ndarray,
) -> Tuple[np.ndarray, List[Dict[str, Any]]]:
    """
    Synthesize composite signal from a list of sinusoidal springs.
    Each harmonic has:
    - frequency: f in Hz
    - amplitude: peak displacement A
    - phase_deg: phase angle phi in degrees (x(t) = A * cos(2*pi*f*t - phi_rad))

    Adheres to Oz Yilmaz Fig 1.1-1: phase lag corresponds to positive phi.
    Returns:
    - composite_signal: ndarray of total displacement
    - components: list of individual spring trace data
    """
    composite = np.zeros_like(t, dtype=np.float64)
    components = []

    for idx, h in enumerate(harmonics):
        f = float(h.get("frequency", 10.0))
        amp = float(h.get("amplitude", 1.0))
        phase_deg = float(h.get("phase_deg", 0.0))
        phase_rad = np.radians(phase_deg)

        # Tracing spring motion in time: x(t) = A * cos(2*pi*f*t - phi)
        trace = amp * np.cos(2.0 * np.pi * f * t - phase_rad)
        composite += trace

        components.append({
            "id": f"spring_{idx + 1}",
            "name": f"Spring {idx + 1} ({f:.1f} Hz, A={amp:.2f}, φ={phase_deg:.0f}°)",
            "frequency": f,
            "amplitude": amp,
            "phase_deg": phase_deg,
            "data": [[round(float(time_val * 1000.0), 3), round(float(v), 5)] for time_val, v in zip(t, trace)],
        })

    return composite, components


def generate_preset_signal(
    preset_name: str,
    duration: float,
    dt: float,
    params: Optional[Dict[str, Any]] = None,
) -> Tuple[np.ndarray, np.ndarray, List[Dict[str, Any]]]:
    """
    Generate canonical signals from Oz Yilmaz Section 1.1.
    Returns (t, signal, components).
    """
    if params is None:
        params = {}

    t = np.arange(0.0, duration, dt, dtype=np.float64)
    n_pts = len(t)
    t_mid = duration / 2.0

    if preset_name == "spring_superposition":
        # Yilmaz Figures 1.1-1 and 1.1-2:
        # Spring 1: 12.5 Hz, A=0.8, phi=0
        # Spring 2: 25.0 Hz, A=0.4, phi=0
        # Spring 3: 40.0 Hz, A=0.3, phi=45 deg
        harmonics = [
            {"frequency": 12.5, "amplitude": 0.8, "phase_deg": 0.0},
            {"frequency": 25.0, "amplitude": 0.4, "phase_deg": 0.0},
            {"frequency": 40.0, "amplitude": 0.3, "phase_deg": 45.0},
        ]
        sig, comps = generate_harmonics_signal(harmonics, t)
        return t, sig, comps

    elif preset_name == "dual_delay":
        # Replicating Yilmaz Figure 1.1-1 (frames 1 & 3):
        # Two identical 12.5 Hz springs with a 20 ms (90 degree) time delay
        delay_ms = float(params.get("delay_ms", 20.0))
        f0 = float(params.get("frequency", 12.5))
        amp = float(params.get("amplitude", 0.8))
        phase_lag_deg = 360.0 * f0 * (delay_ms / 1000.0)

        harmonics = [
            {"frequency": f0, "amplitude": amp, "phase_deg": 0.0},
            {"frequency": f0, "amplitude": amp, "phase_deg": phase_lag_deg},
        ]
        sig, comps = generate_harmonics_signal(harmonics, t)
        return t, sig, comps

    elif preset_name == "single_sinusoid":
        f0 = float(params.get("frequency", 25.0))
        amp = float(params.get("amplitude", 1.0))
        phase_deg = float(params.get("phase_deg", 0.0))
        harmonics = [{"frequency": f0, "amplitude": amp, "phase_deg": phase_deg}]
        sig, comps = generate_harmonics_signal(harmonics, t)
        return t, sig, comps

    elif preset_name == "dirac_impulse":
        # Single spike: all frequencies present with equal amplitude (flat spectrum)
        sig = np.zeros(n_pts, dtype=np.float64)
        mid_idx = n_pts // 2
        sig[mid_idx] = 1.0
        return t, sig, []

    elif preset_name == "boxcar_pulse":
        # Rectangular gate function: FT is sinc(f * T_w)
        width_s = float(params.get("width_s", 0.1))
        sig = np.zeros(n_pts, dtype=np.float64)
        in_box = np.abs(t - t_mid) <= (width_s / 2.0)
        sig[in_box] = 1.0
        return t, sig, []

    elif preset_name == "gaussian_pulse":
        # Gaussian pulse: FT is also Gaussian
        sigma_s = float(params.get("sigma_s", 0.03))
        sig = np.exp(-0.5 * ((t - t_mid) / max(sigma_s, 1e-6)) ** 2)
        return t, sig, []

    elif preset_name == "ricker_wavelet":
        # Standard seismic Ricker wavelet centered at t_mid
        f0 = float(params.get("frequency", 30.0))
        tau = t - t_mid
        arg = (np.pi * f0 * tau) ** 2
        sig = (1.0 - 2.0 * arg) * np.exp(-arg)
        return t, sig, []

    else:
        # Default fallback: 25 Hz sinusoid
        f0 = 25.0
        sig = np.cos(2.0 * np.pi * f0 * t)
        return t, sig, []


def compute_1d_fourier_transform(
    t: np.ndarray,
    signal: np.ndarray,
    dt: float,
    phase_threshold_db: float = -60.0,
    unwrap_phase: bool = False,
) -> Dict[str, Any]:
    """
    Perform 1D forward and inverse Fourier Transform analysis.
    Calibrates amplitude spectrum to physical peak displacement values
    as illustrated in Yilmaz Figure 1.1-1.

    Returns:
    - time_domain: [t_ms, amplitude]
    - amplitude_spectrum: [f_hz, amplitude], [f_hz, amplitude_db]
    - phase_spectrum: [f_hz, phase_deg]
    - reconstruction: [t_ms, reconstructed_amplitude]
    - metrics: dominant frequency, Nyquist, energy, MSE
    """
    n_pts = len(signal)
    if n_pts == 0:
        raise ValueError("Signal cannot be empty.")

    fs = 1.0 / dt
    nyquist = fs / 2.0

    # 1. Forward Discrete Fourier Transform via RFFT (real input)
    # X_k = sum_{n=0}^{N-1} x_n * exp(-i 2pi k n / N)
    dft_complex = np.fft.rfft(signal)
    freqs = np.fft.rfftfreq(n_pts, d=dt)

    # 2. Physical Amplitude Spectrum Normalization
    # Pure cosine wave x(t) = A * cos(2*pi*f*t) yields a peak magnitude of A
    raw_mag = np.abs(dft_complex)
    amp_spectrum = (2.0 / n_pts) * raw_mag
    # DC component (k=0) and Nyquist bin (if N is even) have single-sided coefficient of 1/N
    amp_spectrum[0] = raw_mag[0] / n_pts
    if n_pts % 2 == 0 and len(amp_spectrum) > 1:
        amp_spectrum[-1] = raw_mag[-1] / n_pts

    # 3. Decibel Amplitude Spectrum (relative to peak)
    max_amp = float(np.max(amp_spectrum))
    if max_amp > 1e-12:
        norm_amp = amp_spectrum / max_amp
        # Cap at -120 dB to avoid log10(0)
        amp_db = 20.0 * np.log10(np.maximum(norm_amp, 1e-6))
    else:
        amp_db = np.full_like(amp_spectrum, -120.0)

    # 4. Phase Spectrum Calculation
    # Convention in Yilmaz Section 1.1: phase = - (phase lag) = atan2(Im, Re)
    phase_rad = np.angle(dft_complex)
    if unwrap_phase:
        phase_rad = np.unwrap(phase_rad)
    phase_deg = np.degrees(phase_rad)

    # Phase noise thresholding:
    # At frequencies with negligible amplitude, phase is arbitrary numerical noise.
    # We zero out phase where power is below the threshold.
    if max_amp > 1e-12:
        mask = amp_db < phase_threshold_db
        phase_deg[mask] = 0.0

    # 5. Inverse Fourier Transform (Synthesis / Reconstruction)
    reconstructed = np.fft.irfft(dft_complex, n=n_pts)
    mse = float(np.mean((signal - reconstructed) ** 2))

    # 6. Physical Metrics
    dom_idx = int(np.argmax(amp_spectrum))
    dom_freq = float(freqs[dom_idx]) if dom_idx < len(freqs) else 0.0
    total_energy_time = float(np.sum(signal ** 2))

    # Format data pairs for ECharts: [ [x1, y1], [x2, y2], ... ]
    t_ms = t * 1000.0  # Convert to milliseconds for geophysical display
    time_series = [[round(float(t_val), 3), round(float(y_val), 5)] for t_val, y_val in zip(t_ms, signal)]
    amp_series_lin = [[round(float(f_val), 2), round(float(a_val), 5)] for f_val, a_val in zip(freqs, amp_spectrum)]
    amp_series_db = [[round(float(f_val), 2), round(float(db_val), 2)] for f_val, db_val in zip(freqs, amp_db)]
    phase_series = [[round(float(f_val), 2), round(float(p_val), 2)] for f_val, p_val in zip(freqs, phase_deg)]
    reconstructed_series = [[round(float(t_val), 3), round(float(y_val), 5)] for t_val, y_val in zip(t_ms, reconstructed)]

    return {
        "time_series": numpy_to_chart_data(time_series),
        "reconstructed_series": numpy_to_chart_data(reconstructed_series),
        "amplitude_series_linear": numpy_to_chart_data(amp_series_lin),
        "amplitude_series_db": numpy_to_chart_data(amp_series_db),
        "phase_series": numpy_to_chart_data(phase_series),
        "metrics": {
            "dominant_frequency_hz": round(dom_freq, 2),
            "peak_amplitude": round(max_amp, 4),
            "nyquist_frequency_hz": round(nyquist, 2),
            "sampling_interval_ms": round(dt * 1000.0, 3),
            "total_samples": int(n_pts),
            "total_energy": round(total_energy_time, 4),
            "reconstruction_mse": mse,
        },
    }
