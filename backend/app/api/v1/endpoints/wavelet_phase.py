from typing import Any, Dict, List
from fastapi import APIRouter, HTTPException
from pydantic import BaseModel, Field

from app.modules.signal_processing.wavelet_phase import compute_wavelet_phase_analysis

router = APIRouter()


class WaveletPhaseRequest(BaseModel):
    peak_frequency_hz: float = Field(
        default=30.0,
        gt=5.0,
        le=120.0,
        description="Peak dominant frequency in Hz",
    )
    phase_rotation_deg: float = Field(
        default=0.0,
        ge=-180.0,
        le=180.0,
        description="Phase rotation angle in degrees (-180 to +180)",
    )
    length_s: float = Field(
        default=0.25,
        gt=0.05,
        le=1.0,
        description="Wavelet length in seconds",
    )
    dt_s: float = Field(
        default=0.001,
        gt=0.0001,
        le=0.01,
        description="Sampling interval in seconds (default: 0.001 s = 1 ms)",
    )


class WaveletPhaseMetrics(BaseModel):
    peak_frequency_hz: float
    phase_rotation_deg: float
    zero_phase_peak: float
    rotated_peak: float
    min_phase_50pct_ms: float
    max_phase_50pct_ms: float
    zero_phase_50pct_ms: float
    is_minimum_phase_frontloaded: bool



class WaveletPhaseResponse(BaseModel):
    waveforms: Dict[str, List[List[float]]]
    energies: Dict[str, List[List[float]]]
    spectra: Dict[str, List[List[float]]]
    metrics: WaveletPhaseMetrics


@router.post("/analyze", response_model=WaveletPhaseResponse)
def analyze_wavelet_phase(request: WaveletPhaseRequest) -> WaveletPhaseResponse:
    """
    Analyze Wavelet Phase, Character, and Energy delay based on Oz Yilmaz Section 1.1.
    """
    try:
        res = compute_wavelet_phase_analysis(
            peak_frequency_hz=request.peak_frequency_hz,
            phase_rotation_deg=request.phase_rotation_deg,
            length_s=request.length_s,
            dt_s=request.dt_s,
        )
        return WaveletPhaseResponse(
            waveforms=res["waveforms"],
            energies=res["energies"],
            spectra=res["spectra"],
            metrics=WaveletPhaseMetrics(**res["metrics"]),
        )
    except Exception as exc:
        raise HTTPException(status_code=400, detail=str(exc)) from exc
