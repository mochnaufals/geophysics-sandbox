"""
Sampling & Frequency Aliasing Engine
Based on Section 1.1 (Analog versus Digital Signal & Frequency Aliasing, pp. 28-34) of
'Seismic Data Analysis: Processing, Inversion, and Interpretation of Seismic Data'
by Oz Yilmaz (Society of Exploration Geophysicists).

Demonstrates:
- Continuous vs discrete sampling
- Nyquist frequency f_Nyq = 1 / (2 * dt)
- Frequency folding & aliasing formula f_alias = |f_true - k * fs|
- Visual dual-curve superposition: true high-frequency wave vs deceptive low-frequency alias
- Anti-aliasing low-pass filtering prior to digitization
"""

from typing import Dict, Any, List
import numpy as np
from scipy.signal import butter, filtfilt

from app.common.chart_utils import numpy_to_chart_data


def calculate_alias_frequency(f_true: float, fs: float) -> float:
    """
    Calculate the apparent alias frequency folded into the principal Nyquist zone [0, fs/2].
    f_alias = |f_true - round(f_true / fs) * fs|
    """
    if fs <= 0:
        return 0.0
    nyquist = fs / 2.0
    k = round(f_true / fs)
    f_alias = abs(f_true - k * fs)
    return round(float(f_alias), 3)


def compute_sampling_aliasing(
    frequency_hz: float = 70.0,
    dt_s: float = 0.008,  # 8 ms sample rate -> fs = 125 Hz, f_Nyq = 62.5 Hz
    duration_s: float = 0.5,
    amplitude: float = 1.0,
    apply_anti_alias: bool = False,
    waveform_type: str = "sinusoid",
) -> Dict[str, Any]:
    """
    Simulate continuous analog signal and discrete digitization.
    """
    if dt_s <= 0:
        raise ValueError("Sampling interval dt_s must be positive.")
    if duration_s <= 0:
        raise ValueError("Duration must be positive.")

    fs = 1.0 / dt_s
    nyquist = fs / 2.0
    is_aliased = bool(frequency_hz > nyquist)
    f_alias = calculate_alias_frequency(frequency_hz, fs)

    # 1. Fine time grid simulating analog continuous wave
    dt_fine = 0.0001  # 0.1 ms (10,000 Hz)
    t_fine = np.arange(0.0, duration_s, dt_fine, dtype=np.float64)

    # Generate continuous true signal
    if waveform_type == "multi_harmonic":
        # Sum of 25 Hz and user frequency
        x_true_fine = 0.6 * np.cos(2.0 * np.pi * 25.0 * t_fine) + 0.6 * np.cos(2.0 * np.pi * frequency_hz * t_fine)
    else:
        x_true_fine = amplitude * np.cos(2.0 * np.pi * frequency_hz * t_fine)

    # 2. Discrete sampled points at interval dt_s
    t_sampled = np.arange(0.0, duration_s, dt_s, dtype=np.float64)
    if waveform_type == "multi_harmonic":
        x_sampled_raw = 0.6 * np.cos(2.0 * np.pi * 25.0 * t_sampled) + 0.6 * np.cos(2.0 * np.pi * frequency_hz * t_sampled)
    else:
        x_sampled_raw = amplitude * np.cos(2.0 * np.pi * frequency_hz * t_sampled)

    # 3. Anti-Aliasing Filter
    # If applied, pass through a Butterworth low-pass filter with cutoff at 0.85 * f_Nyq
    if apply_anti_alias:
        # Design 4th order low-pass filter with temporal padding to eliminate edge transients
        cutoff_hz = min(0.85 * nyquist, 0.45 * (1.0 / dt_fine))
        sos = butter(4, cutoff_hz, btype="low", fs=1.0 / dt_fine, output="sos")
        from scipy.signal import sosfiltfilt
        t_pad = 0.05
        t_fine_padded = np.arange(-t_pad, duration_s + t_pad, dt_fine, dtype=np.float64)
        if waveform_type == "multi_harmonic":
            x_padded = 0.6 * np.cos(2.0 * np.pi * 25.0 * t_fine_padded) + 0.6 * np.cos(2.0 * np.pi * frequency_hz * t_fine_padded)
        else:
            x_padded = amplitude * np.cos(2.0 * np.pi * frequency_hz * t_fine_padded)
        x_filtered_padded = sosfiltfilt(sos, x_padded)
        mask = (t_fine_padded >= 0.0) & (t_fine_padded < duration_s)
        x_filtered_fine = x_filtered_padded[mask][:len(t_fine)]
        # Sample the filtered continuous waveform
        sample_indices = np.searchsorted(t_fine, t_sampled)
        sample_indices = np.clip(sample_indices, 0, len(x_filtered_fine) - 1)
        x_sampled = x_filtered_fine[sample_indices]
    else:
        x_filtered_fine = x_true_fine
        x_sampled = x_sampled_raw


    # 4. Continuous alias wave (if aliased and no anti-alias filter)
    # The perceived low-frequency waveform that passes through the exact same sample dots
    if is_aliased and not apply_anti_alias:
        # Calculate phase match at t=0
        # If round(f_true / fs) is odd, sign of alias wave is inverted or phase shifted
        k = round(frequency_hz / fs)
        phase_alias = np.pi if (k % 2 == 1 and (k * fs - frequency_hz) > 0) else 0.0
        x_alias_fine = amplitude * np.cos(2.0 * np.pi * f_alias * t_fine + phase_alias)
    else:
        x_alias_fine = np.zeros_like(t_fine)

    # 5. Discrete Fourier Transform of sampled data
    n_sampled = len(x_sampled)
    dft_sampled = np.fft.rfft(x_sampled)
    freqs_sampled = np.fft.rfftfreq(n_sampled, d=dt_s)
    amp_sampled = (2.0 / n_sampled) * np.abs(dft_sampled)
    if len(amp_sampled) > 0:
        amp_sampled[0] /= 2.0  # DC normalization

    # Format chart data (time in ms for geophysics)
    t_fine_ms = t_fine * 1000.0
    t_sampled_ms = t_sampled * 1000.0

    # Downsample fine curve slightly for responsive 60fps rendering (max 1000 points)
    step = max(1, len(t_fine) // 800)
    true_fine_series = [
        [round(float(t_val), 2), round(float(y_val), 4)]
        for t_val, y_val in zip(t_fine_ms[::step], x_true_fine[::step])
    ]
    alias_fine_series = (
        [
            [round(float(t_val), 2), round(float(y_val), 4)]
            for t_val, y_val in zip(t_fine_ms[::step], x_alias_fine[::step])
        ]
        if is_aliased and not apply_anti_alias
        else []
    )
    sampled_dots = [
        [round(float(t_val), 2), round(float(y_val), 4)]
        for t_val, y_val in zip(t_sampled_ms, x_sampled)
    ]
    spectrum_series = [
        [round(float(f_val), 2), round(float(a_val), 4)]
        for f_val, a_val in zip(freqs_sampled, amp_sampled)
    ]

    dom_idx = int(np.argmax(amp_sampled)) if len(amp_sampled) > 0 else 0
    perceived_dom_freq = float(freqs_sampled[dom_idx]) if dom_idx < len(freqs_sampled) else 0.0

    return {
        "true_continuous_series": numpy_to_chart_data(true_fine_series),
        "alias_continuous_series": numpy_to_chart_data(alias_fine_series),
        "sampled_dots": numpy_to_chart_data(sampled_dots),
        "spectrum_series": numpy_to_chart_data(spectrum_series),
        "metrics": {
            "true_frequency_hz": round(frequency_hz, 2),
            "sampling_interval_ms": round(dt_s * 1000.0, 2),
            "sampling_frequency_hz": round(fs, 2),
            "nyquist_frequency_hz": round(nyquist, 2),
            "alias_frequency_hz": round(f_alias, 2),
            "is_aliased": is_aliased,
            "perceived_dominant_freq_hz": round(perceived_dom_freq, 2),
            "anti_alias_applied": apply_anti_alias,
            "sample_count": int(n_sampled),
        },
    }
