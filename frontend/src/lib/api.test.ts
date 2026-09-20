import { describe, it, expect, vi, beforeEach } from 'vitest'
import { apiFetch, getHealthStatus } from './api'

describe('API Client', () => {
  beforeEach(() => {
    vi.restoreAllMocks()
  })

  it('fetches successfully and parses JSON', async () => {
    const mockData = { status: 'ok', service: 'test' }
    vi.spyOn(globalThis, 'fetch').mockResolvedValueOnce({
      ok: true,
      json: async () => mockData,
    } as Response)

    const result = await apiFetch('/test-endpoint')
    expect(result).toEqual(mockData)
    expect(globalThis.fetch).toHaveBeenCalledWith(
      expect.stringMatching(/\/test-endpoint$/),
      expect.objectContaining({
        headers: expect.objectContaining({ 'Content-Type': 'application/json' }),
      }),
    )
  })

  it('throws an error on non-ok HTTP responses', async () => {
    vi.spyOn(globalThis, 'fetch').mockResolvedValueOnce({
      ok: false,
      status: 500,
      text: async () => 'Internal Server Error',
    } as Response)

    await expect(apiFetch('/fail')).rejects.toThrow('API Error 500: Internal Server Error')
  })

  it('getHealthStatus calls /api/v1/health', async () => {
    const healthMock = {
      status: 'ok',
      service: 'geophysics-sandbox-backend',
      timestamp: '2026-09-20T00:00:00Z',
      versions: {
        python: '3.12',
        fastapi: '0.141',
        numpy: '2.5',
        scipy: '1.18',
        matplotlib: '3.11',
      },
    }

    vi.spyOn(globalThis, 'fetch').mockResolvedValueOnce({
      ok: true,
      json: async () => healthMock,
    } as Response)

    const result = await getHealthStatus()
    expect(result.status).toBe('ok')
    expect(globalThis.fetch).toHaveBeenCalledWith(
      expect.stringMatching(/\/api\/v1\/health$/),
      expect.anything(),
    )
  })
})
