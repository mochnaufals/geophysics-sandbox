import pytest
from starlette.testclient import TestClient

from app.main import app
from app.modules.signal_processing.sampling_aliasing import (
    calculate_alias_frequency,
    compute_sampling_aliasing,
)


def test_alias_frequency_formula():
    """Verify Yilmaz folding frequency formula."""
    fs = 125.0  # Nyquist = 62.5 Hz
    # Below Nyquist: no alias
    assert calculate_alias_frequency(40.0, fs) == 40.0

    # Above Nyquist: 70 Hz folds to 55 Hz (|70 - 125| = 55)
    assert calculate_alias_frequency(70.0, fs) == 55.0

    # 100 Hz folds to 25 Hz (|100 - 125| = 25)
    assert calculate_alias_frequency(100.0, fs) == 25.0

    # Exactly at Nyquist: 62.5 Hz
    assert calculate_alias_frequency(62.5, fs) == 62.5

    # Above 2 * Nyquist: 150 Hz folds to 25 Hz (|150 - 125| = 25)
    assert calculate_alias_frequency(150.0, fs) == 25.0


def test_compute_sampling_aliasing_behavior():
    """Test computation without anti-aliasing filter."""
    # 70 Hz signal with dt = 0.008 s (fs = 125 Hz, Nyquist = 62.5 Hz)
    res = compute_sampling_aliasing(
        frequency_hz=70.0,
        dt_s=0.008,
        duration_s=1.0,
        apply_anti_alias=False,
    )
    metrics = res["metrics"]
    assert metrics["is_aliased"] is True
    assert metrics["alias_frequency_hz"] == 55.0
    assert metrics["nyquist_frequency_hz"] == 62.5
    # Sampled dots should be present
    assert len(res["sampled_dots"]) == 125
    # Perceived frequency in sampled FFT should be 55 Hz
    assert abs(metrics["perceived_dominant_freq_hz"] - 55.0) <= 2.0


def test_anti_aliasing_filter_attenuation():
    """Test that anti-aliasing filter attenuates frequencies above Nyquist."""
    # 80 Hz signal with Nyquist = 62.5 Hz
    res_unfiltered = compute_sampling_aliasing(
        frequency_hz=80.0,
        dt_s=0.008,
        duration_s=1.0,
        apply_anti_alias=False,
    )
    res_filtered = compute_sampling_aliasing(
        frequency_hz=80.0,
        dt_s=0.008,
        duration_s=1.0,
        apply_anti_alias=True,
    )
    # Filtered sampled points should have much lower amplitude
    unfiltered_max = max(abs(pt[1]) for pt in res_unfiltered["sampled_dots"])
    filtered_max = max(abs(pt[1]) for pt in res_filtered["sampled_dots"])
    assert filtered_max < unfiltered_max * 0.3


def test_api_sampling_aliasing_endpoint():
    """Integration test for POST /api/v1/signal-processing/sampling-aliasing/analyze."""
    client = TestClient(app)
    resp = client.post(
        "/api/v1/signal-processing/sampling-aliasing/analyze",
        json={"frequency_hz": 75.0, "dt_s": 0.008, "duration_s": 0.5},
    )
    assert resp.status_code == 200
    data = resp.json()
    assert "true_continuous_series" in data
    assert "sampled_dots" in data
    assert "metrics" in data
    assert data["metrics"]["is_aliased"] is True
