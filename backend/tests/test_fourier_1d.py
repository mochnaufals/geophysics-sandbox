import pytest
import numpy as np
from starlette.testclient import TestClient

from app.main import app
from app.modules.signal_processing.fourier_1d import (
    generate_harmonics_signal,
    generate_preset_signal,
    compute_1d_fourier_transform,
)


def test_harmonics_spring_superposition():
    """Verify superposition of sinusoidal springs from Oz Yilmaz Figure 1.1-1."""
    dt = 0.001
    t = np.arange(0, 1.0, dt)
    harmonics = [
        {"frequency": 12.5, "amplitude": 0.8, "phase_deg": 0.0},
        {"frequency": 25.0, "amplitude": 0.4, "phase_deg": 0.0},
    ]
    composite, comps = generate_harmonics_signal(harmonics, t)
    assert len(composite) == len(t)
    assert len(comps) == 2
    # At t=0, cos(0)=1, so composite should be 0.8 + 0.4 = 1.2
    assert np.isclose(composite[0], 1.2, atol=1e-5)


def test_preset_signals():
    """Verify all canonical presets generate valid signals."""
    dt = 0.002
    duration = 1.0
    presets = [
        "spring_superposition",
        "single_sinusoid",
        "dual_delay",
        "dirac_impulse",
        "boxcar_pulse",
        "gaussian_pulse",
        "ricker_wavelet",
    ]
    for p in presets:
        t, sig, comps = generate_preset_signal(p, duration, dt)
        assert len(t) == 500
        assert len(sig) == 500
        assert not np.isnan(sig).any()
        assert not np.isinf(sig).any()


def test_fourier_single_sinusoid_peak_calibration():
    """
    Test physical amplitude calibration:
    A pure sinusoid of peak displacement 0.8 at 25 Hz must have an amplitude spectrum peak of 0.8 at 25 Hz.
    """
    dt = 0.001
    duration = 2.0
    t = np.arange(0, duration, dt)
    f0 = 25.0
    a0 = 0.8
    sig = a0 * np.cos(2.0 * np.pi * f0 * t)

    res = compute_1d_fourier_transform(t, sig, dt)
    amp_lin = res["amplitude_series_linear"]
    metrics = res["metrics"]

    assert metrics["dominant_frequency_hz"] == 25.0
    # Peak amplitude should match 0.8 closely
    assert np.isclose(metrics["peak_amplitude"], 0.8, atol=1e-2)
    # Round-trip IFFT reconstruction MSE should be near machine precision
    assert metrics["reconstruction_mse"] < 1e-12


def test_phase_lag_delay():
    """
    Verify Oz Yilmaz §1.1 phase delay:
    A 20 ms delay at 12.5 Hz corresponds to 1/4 cycle = 90 degrees phase lag.
    """
    dt = 0.001
    duration = 2.0
    t = np.arange(0, duration, dt)
    f0 = 12.5
    # Signal with 90 deg phase lag: cos(2*pi*f0*t - pi/2) = sin(2*pi*f0*t)
    sig_shifted = 0.8 * np.cos(2.0 * np.pi * f0 * t - np.pi / 2.0)

    res = compute_1d_fourier_transform(t, sig_shifted, dt)
    phase_data = res["phase_series"]
    # Find phase value at 12.5 Hz
    val_at_12_5 = [p[1] for p in phase_data if abs(p[0] - 12.5) < 0.1]
    assert len(val_at_12_5) > 0
    # Phase angle atan2(-1, 0) = -90 deg in standard angle convention
    assert np.isclose(abs(val_at_12_5[0]), 90.0, atol=2.0)


def test_api_endpoint_fourier_analyze():
    """Test POST /api/v1/signal-processing/fourier-1d/analyze."""
    client = TestClient(app)

    # 1. Test with preset
    payload = {
        "mode": "preset",
        "preset": "spring_superposition",
        "duration_s": 1.0,
        "dt_s": 0.002,
        "phase_threshold_db": -50.0,
    }
    response = client.post("/api/v1/signal-processing/fourier-1d/analyze", json=payload)
    assert response.status_code == 200
    data = response.json()
    assert "time_series" in data
    assert "components" in data
    assert "reconstructed_series" in data
    assert "amplitude_series_linear" in data
    assert "amplitude_series_db" in data
    assert "phase_series" in data
    assert "metrics" in data
    assert data["metrics"]["dominant_frequency_hz"] > 0

    # 2. Test with harmonics mode
    harmonics_payload = {
        "mode": "harmonics",
        "harmonics": [
            {"frequency": 15.0, "amplitude": 1.5, "phase_deg": 30.0},
            {"frequency": 45.0, "amplitude": 0.5, "phase_deg": 0.0},
        ],
        "duration_s": 1.0,
        "dt_s": 0.002,
    }
    resp_harmonics = client.post(
        "/api/v1/signal-processing/fourier-1d/analyze", json=harmonics_payload
    )
    assert resp_harmonics.status_code == 200
    h_data = resp_harmonics.json()
    assert len(h_data["components"]) == 2
    assert h_data["metrics"]["dominant_frequency_hz"] == 15.0
