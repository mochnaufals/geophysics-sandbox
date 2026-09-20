import matplotlib
matplotlib.use("Agg")
import matplotlib.pyplot as plt
import numpy as np
from app.common.chart_utils import figure_to_base64, numpy_to_chart_data


def test_numpy_to_chart_data_1d():
    arr = np.array([1.0, 2.5, 3.0])
    result = numpy_to_chart_data(arr)
    assert result == [1.0, 2.5, 3.0]


def test_numpy_to_chart_data_with_nan():
    arr = np.array([1.0, np.nan, 3.0, np.inf])
    result = numpy_to_chart_data(arr)
    assert result == [1.0, None, 3.0, None]


def test_numpy_to_chart_data_2d():
    arr = np.array([[1.0, 2.0], [3.0, 4.0]])
    result = numpy_to_chart_data(arr)
    assert result == [[1.0, 2.0], [3.0, 4.0]]


def test_figure_to_base64():
    fig, ax = plt.subplots()
    ax.plot([0, 1, 2], [0, 1, 4])
    ax.set_title("Test Curve")

    data_url = figure_to_base64(fig, format="png")
    assert isinstance(data_url, str)
    assert data_url.startswith("data:image/png;base64,")
    assert len(data_url) > 50

    # Ensure figure is closed
    assert not plt.fignum_exists(fig.number)
