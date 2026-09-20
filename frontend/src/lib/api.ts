export interface LibraryVersions {
  python: string
  fastapi: string
  numpy: string
  scipy: string
  matplotlib: string
}

export interface HealthResponse {
  status: string
  service: string
  timestamp: string
  versions: LibraryVersions
}

// Configurable base URL from .env (e.g. VITE_API_BASE_URL=http://localhost:8000)
// Strips trailing slashes to prevent double slashes in request paths
export const API_BASE_URL: string = (import.meta.env.VITE_API_BASE_URL ?? '').replace(/\/+$/, '')

export async function apiFetch<T>(endpoint: string, options?: RequestInit): Promise<T> {
  const normalizedEndpoint = endpoint.startsWith('/') ? endpoint : `/${endpoint}`
  const url = `${API_BASE_URL}${normalizedEndpoint}`

  const response = await fetch(url, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...options?.headers,
    },
  })

  if (!response.ok) {
    const errorText = await response.text().catch(() => 'Unknown network error')
    throw new Error(`API Error ${response.status}: ${errorText}`)
  }

  return response.json()
}

export async function getHealthStatus(): Promise<HealthResponse> {
  return apiFetch<HealthResponse>('/api/v1/health')
}

export interface HarmonicParam {
  frequency: number
  amplitude: number
  phase_deg: number
}

export interface Fourier1DRequest {
  mode: 'preset' | 'harmonics'
  preset?: string
  harmonics?: HarmonicParam[]
  duration_s?: number
  dt_s?: number
  phase_threshold_db?: number
  unwrap_phase?: boolean
  preset_params?: Record<string, unknown>
}

export interface Fourier1DMetrics {
  dominant_frequency_hz: number
  peak_amplitude: number
  nyquist_frequency_hz: number
  sampling_interval_ms: number
  total_samples: number
  total_energy: number
  reconstruction_mse: number
}

export interface HarmonicComponentTrace {
  id: string
  name: string
  frequency: number
  amplitude: number
  phase_deg: number
  data: [number, number][]
}

export interface Fourier1DResponse {
  time_series: [number, number][]
  components: HarmonicComponentTrace[]
  reconstructed_series: [number, number][]
  amplitude_series_linear: [number, number][]
  amplitude_series_db: [number, number][]
  phase_series: [number, number][]
  metrics: Fourier1DMetrics
}

export async function analyzeFourier1D(payload: Fourier1DRequest): Promise<Fourier1DResponse> {
  return apiFetch<Fourier1DResponse>('/api/v1/signal-processing/fourier-1d/analyze', {
    method: 'POST',
    body: JSON.stringify(payload),
  })
}

