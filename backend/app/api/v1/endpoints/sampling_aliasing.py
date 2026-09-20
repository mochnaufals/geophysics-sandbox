from typing import Any, Dict, List, Literal
from fastapi import APIRouter, HTTPException
from pydantic import BaseModel, Field

from app.modules.signal_processing.sampling_aliasing import compute_sampling_aliasing

router = APIRouter()


class SamplingAliasingRequest(BaseModel):
    frequency_hz: float = Field(
        default=70.0,
        gt=0.0,
        le=500.0,
        description="True analog continuous signal frequency in Hz",
    )
    dt_s: float = Field(
        default=0.008,
        gt=0.0002,
        le=0.05,
        description="Sampling interval in seconds (e.g. 0.008 s = 8 ms, fs = 125 Hz, f_Nyq = 62.5 Hz)",
    )
    duration_s: float = Field(
        default=0.5,
        gt=0.05,
        le=5.0,
        description="Signal duration in seconds",
    )
    amplitude: float = Field(
        default=1.0,
        gt=0.0,
        description="Signal amplitude",
    )
    apply_anti_alias: bool = Field(
        default=False,
        description="Apply analog anti-aliasing high-cut Butterworth filter prior to sampling",
    )
    waveform_type: Literal["sinusoid", "multi_harmonic"] = Field(
        default="sinusoid",
        description="Waveform type",
    )


class SamplingAliasingMetrics(BaseModel):
    true_frequency_hz: float
    sampling_interval_ms: float
    sampling_frequency_hz: float
    nyquist_frequency_hz: float
    alias_frequency_hz: float
    is_aliased: bool
    perceived_dominant_freq_hz: float
    anti_alias_applied: bool
    sample_count: int


class SamplingAliasingResponse(BaseModel):
    true_continuous_series: List[List[float]]
    alias_continuous_series: List[List[float]]
    sampled_dots: List[List[float]]
    spectrum_series: List[List[float]]
    metrics: SamplingAliasingMetrics


@router.post("/analyze", response_model=SamplingAliasingResponse)
def analyze_sampling_aliasing(request: SamplingAliasingRequest) -> SamplingAliasingResponse:
    """
    Analyze frequency aliasing and sampling rate effects based on Oz Yilmaz Section 1.1.
    """
    try:
        res = compute_sampling_aliasing(
            frequency_hz=request.frequency_hz,
            dt_s=request.dt_s,
            duration_s=request.duration_s,
            amplitude=request.amplitude,
            apply_anti_alias=request.apply_anti_alias,
            waveform_type=request.waveform_type,
        )
        return SamplingAliasingResponse(
            true_continuous_series=res["true_continuous_series"],
            alias_continuous_series=res["alias_continuous_series"],
            sampled_dots=res["sampled_dots"],
            spectrum_series=res["spectrum_series"],
            metrics=SamplingAliasingMetrics(**res["metrics"]),
        )
    except Exception as exc:
        raise HTTPException(status_code=400, detail=str(exc)) from exc
