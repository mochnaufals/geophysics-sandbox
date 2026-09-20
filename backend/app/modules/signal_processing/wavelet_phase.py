"""
Wavelet Phase & Character Engine
Based on Section 1.1 (Phase Considerations, pp. 34-36) of
'Seismic Data Analysis: Processing, Inversion, and Interpretation of Seismic Data'
by Oz Yilmaz (Society of Exploration Geophysicists).

Demonstrates:
- Zero-phase wavelet (symmetric, highest peak, non-causal)
- Minimum-phase wavelet (causal, front-loaded cumulative energy)
- Maximum-phase wavelet (back-loaded cumulative energy)
- Arbitrary phase rotation via Hilbert transform (w_theta = cos(theta)*w + sin(theta)*H[w])
- Cumulative energy build-up curves E(t)
- Identical amplitude spectra with distinct phase spectra
"""

from typing import Dict, Any, List
import numpy as np
from scipy.signal import hilbert

from app.common.chart_utils import numpy_to_chart_data


def generate_zero_phase_ricker(t: np.ndarray, f0: float) -> np.ndarray:
    """Generate symmetric zero-phase Ricker wavelet."""
    arg = (np.pi * f0 * t) ** 2
    return (1.0 - 2.0 * arg) * np.exp(-arg)


def minimum_phase_from_spectrum(amp_spec: np.ndarray) -> np.ndarray:
    """
    Compute minimum-phase wavelet from amplitude spectrum via Kolmogorov spectral factorization.
    ln(W_min) = ln|W| - i * Hilbert(ln|W|)
    """
    # Prevent log(0)
    eps = 1e-8 * np.max(amp_spec)
    safe_amp = np.maximum(amp_spec, eps)
    log_amp = np.log(safe_amp)

    # Hilbert transform of real sequence log_amp
    # In frequency domain, Hilbert transform introduces -i * sgn(k)
    hilb_log = np.imag(hilbert(log_amp))
    min_phase_spectrum = safe_amp * np.exp(-1j * hilb_log)

    # Inverse FFT to time domain (causal minimum phase)
    w_min = np.fft.irfft(min_phase_spectrum)
    return w_min


def compute_wavelet_phase_analysis(
    peak_frequency_hz: float = 30.0,
    phase_rotation_deg: float = 0.0,
    length_s: float = 0.25,
    dt_s: float = 0.001,  # 1 ms sampling
) -> Dict[str, Any]:
    """
    Generate and analyze Zero-Phase, Minimum-Phase, Maximum-Phase,
    and arbitrary Phase-Rotated wavelets with identical amplitude spectra.
    """
    if length_s <= 0 or dt_s <= 0:
        raise ValueError("Length and dt must be positive.")

    n_pts = int(round(length_s / dt_s))
    if n_pts % 2 == 0:
        n_pts += 1  # Make odd to have exact t=0 center

    half_len = (n_pts - 1) // 2
    t = np.arange(-half_len, half_len + 1, dtype=np.float64) * dt_s
    t_ms = t * 1000.0

    # 1. Zero-phase Ricker wavelet
    w_zero = generate_zero_phase_ricker(t, peak_frequency_hz)

    # 2. Phase-rotated wavelet via Hilbert transform
    # w_theta(t) = cos(theta) * w(t) + sin(theta) * H[w(t)]
    theta_rad = np.radians(phase_rotation_deg)
    w_analytic = hilbert(w_zero)
    w_quadrature = np.imag(w_analytic)  # 90-degree phase shift
    w_rotated = np.cos(theta_rad) * w_zero + np.sin(theta_rad) * w_quadrature

    # 3. Minimum-phase wavelet (causal, starting at t=0)
    # Generate Ricker amplitude spectrum on a positive time grid
    n_fft = 2 * n_pts
    t_causal = np.arange(0, n_fft) * dt_s
    tau_centered = t_causal - (n_fft * dt_s / 2.0)
    ricker_sym = generate_zero_phase_ricker(tau_centered, peak_frequency_hz)

    rfft_sym = np.fft.rfft(ricker_sym)
    amp_sym = np.abs(rfft_sym)

    w_min_full = minimum_phase_from_spectrum(amp_sym)
    # Window to match n_pts duration
    w_min_raw = w_min_full[:n_pts]
    # Normalize peak energy to match zero-phase wavelet energy
    scale = np.sqrt(np.sum(w_zero ** 2) / max(np.sum(w_min_raw ** 2), 1e-12))
    w_min = w_min_raw * scale

    # Align minimum phase on the display grid starting at t=0
    # Before t=0, minimum phase is strictly zero (causal)
    zero_idx = half_len
    w_min_display = np.zeros_like(t)
    avail_len = min(n_pts - zero_idx, len(w_min))
    w_min_display[zero_idx : zero_idx + avail_len] = w_min[:avail_len]

    # 4. Maximum-phase wavelet (causal time-reversal of minimum phase on [0, duration])
    w_max_display = np.zeros_like(t)
    w_max_display[zero_idx : zero_idx + avail_len] = w_min[:avail_len][::-1]

    # 5. Cumulative Energy Build-up curves: E(t) = sum_{tau <= t} w^2(tau) / E_total
    def cumulative_energy(w: np.ndarray) -> np.ndarray:
        energy = np.cumsum(w ** 2)
        total = energy[-1] if energy[-1] > 1e-12 else 1.0
        return (energy / total) * 100.0

    energy_zero = cumulative_energy(w_zero)
    energy_min = cumulative_energy(w_min_display)
    energy_max = cumulative_energy(w_max_display)
    energy_rotated = cumulative_energy(w_rotated)


    # 6. Amplitude and Phase Spectra
    freqs = np.fft.rfftfreq(n_pts, d=dt_s)
    fft_zero = np.fft.rfft(w_zero)
    fft_rotated = np.fft.rfft(w_rotated)
    fft_min = np.fft.rfft(w_min_display)

    amp_spectrum = (2.0 / n_pts) * np.abs(fft_zero)
    phase_zero = np.degrees(np.angle(fft_zero))
    phase_rotated = np.degrees(np.angle(fft_rotated))
    phase_min = np.degrees(np.angle(fft_min))

    # Mask phase at low amplitudes
    mask = amp_spectrum < (0.01 * np.max(amp_spectrum))
    phase_zero[mask] = 0.0
    phase_rotated[mask] = 0.0
    phase_min[mask] = 0.0

    # Format for ECharts
    waveforms = {
        "zero_phase": [[round(float(tv), 2), round(float(yv), 5)] for tv, yv in zip(t_ms, w_zero)],
        "rotated": [[round(float(tv), 2), round(float(yv), 5)] for tv, yv in zip(t_ms, w_rotated)],
        "minimum_phase": [[round(float(tv), 2), round(float(yv), 5)] for tv, yv in zip(t_ms, w_min_display)],
        "maximum_phase": [[round(float(tv), 2), round(float(yv), 5)] for tv, yv in zip(t_ms, w_max_display)],
    }

    energies = {
        "zero_phase": [[round(float(tv), 2), round(float(yv), 2)] for tv, yv in zip(t_ms, energy_zero)],
        "rotated": [[round(float(tv), 2), round(float(yv), 2)] for tv, yv in zip(t_ms, energy_rotated)],
        "minimum_phase": [[round(float(tv), 2), round(float(yv), 2)] for tv, yv in zip(t_ms, energy_min)],
        "maximum_phase": [[round(float(tv), 2), round(float(yv), 2)] for tv, yv in zip(t_ms, energy_max)],
    }

    spectra = {
        "amplitude": [[round(float(fv), 1), round(float(yv), 5)] for fv, yv in zip(freqs, amp_spectrum)],
        "phase_zero": [[round(float(fv), 1), round(float(yv), 1)] for fv, yv in zip(freqs, phase_zero)],
        "phase_rotated": [[round(float(fv), 1), round(float(yv), 1)] for fv, yv in zip(freqs, phase_rotated)],
        "phase_min": [[round(float(fv), 1), round(float(yv), 1)] for fv, yv in zip(freqs, phase_min)],
    }

    # Time to reach 50% and 90% energy for each wavelet
    def energy_arrival_ms(energy_arr: np.ndarray, threshold: float) -> float:
        idx = np.searchsorted(energy_arr, threshold)
        idx = min(idx, len(t_ms) - 1)
        return round(float(t_ms[idx]), 2)

    return {
        "waveforms": numpy_to_chart_data(waveforms),
        "energies": numpy_to_chart_data(energies),
        "spectra": numpy_to_chart_data(spectra),
        "metrics": {
            "peak_frequency_hz": peak_frequency_hz,
            "phase_rotation_deg": phase_rotation_deg,
            "zero_phase_peak": round(float(np.max(w_zero)), 4),
            "rotated_peak": round(float(np.max(np.abs(w_rotated))), 4),
            "min_phase_50pct_ms": energy_arrival_ms(energy_min, 50.0),
            "max_phase_50pct_ms": energy_arrival_ms(energy_max, 50.0),
            "zero_phase_50pct_ms": energy_arrival_ms(energy_zero, 50.0),
            "is_minimum_phase_frontloaded": bool(energy_arrival_ms(energy_min, 50.0) < energy_arrival_ms(energy_max, 50.0)),
        },
    }

