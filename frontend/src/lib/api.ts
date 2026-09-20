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
