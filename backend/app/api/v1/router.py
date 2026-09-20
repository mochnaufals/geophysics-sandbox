from fastapi import APIRouter
from app.api.v1 import health
from app.api.v1.endpoints import fourier_1d, sampling_aliasing, wavelet_phase

api_router = APIRouter()
api_router.include_router(health.router, tags=["Health"])
api_router.include_router(
    fourier_1d.router,
    prefix="/signal-processing/fourier-1d",
    tags=["Signal Processing"],
)
api_router.include_router(
    sampling_aliasing.router,
    prefix="/signal-processing/sampling-aliasing",
    tags=["Signal Processing"],
)
api_router.include_router(
    wavelet_phase.router,
    prefix="/signal-processing/wavelet-phase",
    tags=["Signal Processing"],
)


