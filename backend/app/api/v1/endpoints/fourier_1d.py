from typing import Any, Dict, List, Literal, Optional
from fastapi import APIRouter, HTTPException
from pydantic import BaseModel, Field

from app.modules.signal_processing.fourier_1d import (
    generate_harmonics_signal,
    generate_preset_signal,
    compute_1d_fourier_transform,
)

router = APIRouter()


class HarmonicItem(BaseModel):
    frequency: float = Field(..., gt=0.0, description="Frequency in Hz")
    amplitude: float = Field(..., ge=0.0, description="Peak amplitude displacement")
    phase_deg: float = Field(default=0.0, description="Phase lag in degrees")


class Fourier1DRequest(BaseModel):
    mode: Literal["preset", "harmonics"] = Field(
        default="preset",
        description="Source of signal: 'preset' or custom 'harmonics' spring builder",
    )
    preset: str = Field(
        default="spring_superposition",
        description="Preset identifier (spring_superposition, single_sinusoid, dual_delay, dirac_impulse, boxcar_pulse, gaussian_pulse, ricker_wavelet)",
    )
    harmonics: Optional[List[HarmonicItem]] = Field(
        default=None,
        description="List of sinusoidal spring components when mode='harmonics'",
    )
    duration_s: float = Field(
        default=1.0,
        gt=0.01,
        le=10.0,
        description="Signal duration in seconds",
    )
    dt_s: float = Field(
        default=0.002,
        gt=0.0001,
        le=0.1,
        description="Sampling interval in seconds (default: 0.002 s = 2 ms, fs = 500 Hz)",
    )
    phase_threshold_db: float = Field(
        default=-60.0,
        le=0.0,
        description="Threshold in dB below peak to suppress numerical phase noise",
    )
    unwrap_phase: bool = Field(
        default=False,
        description="Whether to unwrap phase angle discontinuity",
    )
    preset_params: Optional[Dict[str, Any]] = Field(
        default_factory=dict,
        description="Specific parameters for chosen preset (e.g. delay_ms, width_s, sigma_s)",
    )


class Fourier1DMetrics(BaseModel):
    dominant_frequency_hz: float
    peak_amplitude: float
    nyquist_frequency_hz: float
    sampling_interval_ms: float
    total_samples: int
    total_energy: float
    reconstruction_mse: float


class Fourier1DResponse(BaseModel):
    time_series: List[List[float]]
    components: List[Dict[str, Any]]
    reconstructed_series: List[List[float]]
    amplitude_series_linear: List[List[float]]
    amplitude_series_db: List[List[float]]
    phase_series: List[List[float]]
    metrics: Fourier1DMetrics


@router.post("/analyze", response_model=Fourier1DResponse)
def analyze_fourier_1d(request: Fourier1DRequest) -> Fourier1DResponse:
    """
    Perform 1D Fourier Transform analysis on synthetic or preset signals
    following Oz Yilmaz's Seismic Data Analysis Section 1.1.
    """
    try:
        import numpy as np

        t = np.arange(0.0, request.duration_s, request.dt_s, dtype=np.float64)

        if request.mode == "harmonics":
            if not request.harmonics:
                # Default spring superposition if list is empty
                harmonics_dicts = [
                    {"frequency": 12.5, "amplitude": 0.8, "phase_deg": 0.0},
                    {"frequency": 25.0, "amplitude": 0.4, "phase_deg": 0.0},
                ]
            else:
                harmonics_dicts = [h.model_dump() for h in request.harmonics]
            signal, components = generate_harmonics_signal(harmonics_dicts, t)
        else:
            t, signal, components = generate_preset_signal(
                request.preset,
                request.duration_s,
                request.dt_s,
                request.preset_params,
            )

        result = compute_1d_fourier_transform(
            t=t,
            signal=signal,
            dt=request.dt_s,
            phase_threshold_db=request.phase_threshold_db,
            unwrap_phase=request.unwrap_phase,
        )

        return Fourier1DResponse(
            time_series=result["time_series"],
            components=components,
            reconstructed_series=result["reconstructed_series"],
            amplitude_series_linear=result["amplitude_series_linear"],
            amplitude_series_db=result["amplitude_series_db"],
            phase_series=result["phase_series"],
            metrics=Fourier1DMetrics(**result["metrics"]),
        )
    except Exception as exc:
        raise HTTPException(status_code=400, detail=str(exc)) from exc
