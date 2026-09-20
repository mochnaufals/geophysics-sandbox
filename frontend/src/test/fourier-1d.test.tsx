import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import * as echarts from 'echarts'
import { Fourier1DModulePage } from '../components/modules/fourier1d/Fourier1DModulePage'


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

describe('Fourier1DModulePage', () => {
  let queryClient: QueryClient

  beforeEach(() => {
    vi.clearAllMocks()
    queryClient = new QueryClient({
      defaultOptions: {
        queries: { retry: false },
      },
    })

    // Mock API response
    vi.spyOn(api, 'analyzeFourier1D').mockResolvedValue({
      time_series: [[0, 0.8], [2, 0.7]],
      components: [
        {
          id: 'spring_1',
          name: 'Spring 1 (12.5 Hz)',
          frequency: 12.5,
          amplitude: 0.8,
          phase_deg: 0,
          data: [[0, 0.8], [2, 0.7]],
        },
      ],
      reconstructed_series: [[0, 0.8], [2, 0.7]],
      amplitude_series_linear: [[12.5, 0.8]],
      amplitude_series_db: [[12.5, 0]],
      phase_series: [[12.5, 0]],
      metrics: {
        dominant_frequency_hz: 12.5,
        peak_amplitude: 0.8,
        nyquist_frequency_hz: 250.0,
        sampling_interval_ms: 2.0,
        total_samples: 500,
        total_energy: 160.0,
        reconstruction_mse: 1e-15,
      },
    })
  })

  function renderPage() {
    return render(
      <QueryClientProvider client={queryClient}>
        <Fourier1DModulePage />
      </QueryClientProvider>
    )
  }

  it('renders page title and Oz Yilmaz §1.1 badge', async () => {
    renderPage()
    expect(screen.getByText('1D Fourier Transform')).toBeInTheDocument()
    expect(screen.getByText(/Theory & Reference: Oz Yilmaz §1.1/i)).toBeInTheDocument()
  })

  it('toggles between Presets and Harmonics Builder', async () => {
    renderPage()

    // Initially in Presets mode
    expect(screen.getByText('Spring Superposition')).toBeInTheDocument()

    // Switch to Springs Builder
    const harmonicsTab = screen.getByRole('button', { name: /Springs Builder/i })
    fireEvent.click(harmonicsTab)

    expect(screen.getByText(/Sinusoidal Springs Superposition Builder/i)).toBeInTheDocument()
    expect(screen.getByText('Spring 1')).toBeInTheDocument()

    // Add another spring
    const addBtn = screen.getByRole('button', { name: /Add Spring/i })
    fireEvent.click(addBtn)

    expect(screen.getByText('Spring 4')).toBeInTheDocument()
  })

  it('displays calculated metrics when query succeeds', async () => {
    renderPage()

    await waitFor(() => {
      expect(screen.getByText('12.5 Hz')).toBeInTheDocument()
      expect(screen.getByText('250 Hz')).toBeInTheDocument()
    })
  })

  it('renders all 3 ECharts containers for Time, Amplitude, and Phase', () => {
    renderPage()
    const containers = screen.getAllByTestId('echart-container')
    expect(containers.length).toBe(3)
  })
})
