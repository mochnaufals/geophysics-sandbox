import sys
from datetime import datetime, timezone
import fastapi
import matplotlib
import numpy as np
from pydantic import BaseModel
import scipy
from fastapi import APIRouter

router = APIRouter()


class LibraryVersions(BaseModel):
    python: str
    fastapi: str
    numpy: str
    scipy: str
    matplotlib: str


class HealthResponse(BaseModel):
    status: str
    service: str
    timestamp: str
    versions: LibraryVersions


@router.get("/health", response_model=HealthResponse)
def get_health() -> HealthResponse:
    """Returns backend health status, system time, and scientific package versions."""
    return HealthResponse(
        status="ok",
        service="geophysics-sandbox-backend",
        timestamp=datetime.now(timezone.utc).isoformat(),
        versions=LibraryVersions(
            python=f"{sys.version_info.major}.{sys.version_info.minor}.{sys.version_info.micro}",
            fastapi=fastapi.__version__,
            numpy=np.__version__,
            scipy=scipy.__version__,
            matplotlib=matplotlib.__version__,
        ),
    )
