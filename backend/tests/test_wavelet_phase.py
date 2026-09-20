import pytest
import numpy as np
from starlette.testclient import TestClient

from app.main import app
from app.modules.signal_processing.wavelet_phase import (
    generate_zero_phase_ricker,
    compute_wavelet_phase_analysis,
)


def test_zero_phase_symmetry():
    """Verify zero-phase Ricker is symmetric around t=0."""
    t = np.linspace(-0.1, 0.1, 201)
    w = generate_zero_phase_ricker(t, 30.0)
    # w(t) == w(-t)
    assert np.allclose(w, w[::-1], atol=1e-5)
    # Maximum peak is at t=0
    mid = len(t) // 2
    assert np.argmax(w) == mid


def test_minimum_phase_energy_frontloading():
    """
    Verify fundamental geophysical property from Oz Yilmaz §1.1:
    Minimum-phase wavelet concentrates its energy earlier in time than mixed or maximum phase.
    """
    res = compute_wavelet_phase_analysis(peak_frequency_hz=30.0)
    metrics = res["metrics"]
    # Minimum phase reaches 50% energy earlier than or at least as early as zero phase center
    assert metrics["is_minimum_phase_frontloaded"] is True
    # Zero phase peak amplitude should be >= rotated peak amplitude
    assert metrics["zero_phase_peak"] >= metrics["rotated_peak"] - 1e-4


def test_hilbert_90_deg_phase_rotation():
    """Verify 90-degree phase rotation produces an antisymmetric wavelet."""
    res = compute_wavelet_phase_analysis(peak_frequency_hz=30.0, phase_rotation_deg=90.0)
    w_rotated = np.array([pt[1] for pt in res["waveforms"]["rotated"]])
    # At t=0, antisymmetric wavelet is zero
    mid = len(w_rotated) // 2
    assert abs(w_rotated[mid]) < 0.05
    # w(t) == -w(-t)
    assert np.allclose(w_rotated, -w_rotated[::-1], atol=0.1)


def test_api_wavelet_phase_endpoint():
    """Integration test for POST /api/v1/signal-processing/wavelet-phase/analyze."""
    client = TestClient(app)
    resp = client.post(
        "/api/v1/signal-processing/wavelet-phase/analyze",
        json={"peak_frequency_hz": 35.0, "phase_rotation_deg": 45.0},
    )
    assert resp.status_code == 200
    data = resp.json()
    assert "waveforms" in data
    assert "zero_phase" in data["waveforms"]
    assert "minimum_phase" in data["waveforms"]
    assert "rotated" in data["waveforms"]
    assert "energies" in data
    assert "metrics" in data
