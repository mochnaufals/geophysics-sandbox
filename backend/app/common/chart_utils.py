import base64
import io
from typing import Any, List, Union
import matplotlib
matplotlib.use("Agg")
import matplotlib.pyplot as plt
import numpy as np


def numpy_to_chart_data(arr: Union[np.ndarray, List[Any]], handle_nan: Any = None) -> Any:
    """
    Recursively convert NumPy array to native Python lists/floats for JSON serialization.
    Replaces NaN and Inf values with handle_nan (default: None, which serializes to null in JSON).
    """
    if isinstance(arr, list):
        return [numpy_to_chart_data(x, handle_nan=handle_nan) for x in arr]

    if not isinstance(arr, np.ndarray):
        arr = np.asarray(arr)

    # Handle float / numeric types with NaN/Inf checks
    if np.issubdtype(arr.dtype, np.floating):
        clean_arr = np.where(np.isnan(arr) | np.isinf(arr), np.nan, arr)
        raw_list = clean_arr.tolist()
        def sanitize(val):
            if isinstance(val, list):
                return [sanitize(v) for v in val]
            return handle_nan if val is None or (isinstance(val, float) and np.isnan(val)) else val
        return sanitize(raw_list)

    return arr.tolist()


def figure_to_base64(fig: plt.Figure, format: str = "png", dpi: int = 150) -> str:
    """
    Render Matplotlib figure to a Base64-encoded Data URL string.
    Safely closes the figure afterwards to prevent memory leaks in server processes.
    """
    try:
        buf = io.BytesIO()
        fig.savefig(buf, format=format, dpi=dpi, bbox_inches="tight")
        buf.seek(0)
        encoded = base64.b64encode(buf.read()).decode("utf-8")
        mime = "image/svg+xml" if format == "svg" else f"image/{format}"
        return f"data:{mime};base64,{encoded}"
    finally:
        plt.close(fig)
