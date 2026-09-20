import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import * as echarts from 'echarts'
import { WaveletPhasePage } from '../components/modules/wavelet_phase/WaveletPhasePage'
import * as api from '../lib/api'

vi.mock('echarts', async () => {
  const actual = await vi.importActual<typeof echarts>('echarts')
  return {
    ...actual,
    init: vi.fn().mockImplementation(() => ({
      setOption: vi.fn(),
      resize: vi.fn(),
      dispose: vi.fn(),
      showLoading: vi.fn(),
      hideLoading: vi.fn(),
    })),
  }
})

describe('WaveletPhasePage', () => {
  let queryClient: QueryClient

  beforeEach(() => {
    vi.clearAllMocks()
    queryClient = new QueryClient({
      defaultOptions: {
        queries: { retry: false },
      },
    })

    vi.spyOn(api, 'analyzeWaveletPhase').mockResolvedValue({
      waveforms: {
        zero_phase: [[0, 1.0]],
        rotated: [[0, 0.0]],
        minimum_phase: [[0, 0.8]],
        maximum_phase: [[0, 0.1]],
      },
      energies: {
        zero_phase: [[0, 50.0]],
        rotated: [[0, 50.0]],
        minimum_phase: [[0, 20.0]],
        maximum_phase: [[0, 5.0]],
      },
      spectra: {
        amplitude: [[30, 1.0]],
        phase_zero: [[30, 0]],
        phase_rotated: [[30, 90]],
        phase_min: [[30, 45]],
      },
      metrics: {
        peak_frequency_hz: 30.0,
        phase_rotation_deg: 0.0,
        zero_phase_peak: 1.0,
        rotated_peak: 1.0,
        min_phase_50pct_ms: 15.0,
        max_phase_50pct_ms: 85.0,
        zero_phase_50pct_ms: 0.0,
        is_minimum_phase_frontloaded: true,
      },
    })
  })

  function renderPage() {
    return render(
      <QueryClientProvider client={queryClient}>
        <WaveletPhasePage />
      </QueryClientProvider>
    )
  }

  it('renders title and theory drawer', () => {
    renderPage()
    expect(screen.getByText('Wavelet Phase & Character')).toBeInTheDocument()
    expect(screen.getByText(/Theory & Reference: Oz Yilmaz §1.1 \(Phase Considerations\)/i)).toBeInTheDocument()
  })

  it('displays metrics when data loads', async () => {
    renderPage()

    await waitFor(() => {
      expect(screen.getByText('+15 ms')).toBeInTheDocument()
      expect(screen.getByText('+85 ms')).toBeInTheDocument()
    })
  })

  it('allows clicking quick phase rotation button', () => {
    renderPage()
    const btn90 = screen.getByRole('button', { name: /90° Anti/i })
    fireEvent.click(btn90)
    expect(btn90).toBeInTheDocument()
  })

  it('renders all 3 ECharts containers', () => {
    renderPage()
    const containers = screen.getAllByTestId('echart-container')
    expect(containers.length).toBe(3)
  })
})
