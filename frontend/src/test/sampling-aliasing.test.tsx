import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import * as echarts from 'echarts'
import { SamplingAliasingPage } from '../components/modules/sampling/SamplingAliasingPage'
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

describe('SamplingAliasingPage', () => {
  let queryClient: QueryClient

  beforeEach(() => {
    vi.clearAllMocks()
    queryClient = new QueryClient({
      defaultOptions: {
        queries: { retry: false },
      },
    })

    vi.spyOn(api, 'analyzeSamplingAliasing').mockResolvedValue({
      true_continuous_series: [[0, 1.0], [2, 0.8]],
      alias_continuous_series: [[0, 1.0], [2, 0.5]],
      sampled_dots: [[0, 1.0], [8, -0.7]],
      spectrum_series: [[55.0, 1.0]],
      metrics: {
        true_frequency_hz: 70.0,
        sampling_interval_ms: 8.0,
        sampling_frequency_hz: 125.0,
        nyquist_frequency_hz: 62.5,
        alias_frequency_hz: 55.0,
        is_aliased: true,
        perceived_dominant_freq_hz: 55.0,
        anti_alias_applied: false,
        sample_count: 50,
      },
    })
  })

  function renderPage() {
    return render(
      <QueryClientProvider client={queryClient}>
        <SamplingAliasingPage />
      </QueryClientProvider>
    )
  }

  it('renders title and theory drawer', () => {
    renderPage()
    expect(screen.getByText('Sampling & Frequency Aliasing')).toBeInTheDocument()
    expect(screen.getByText(/Theory & Reference: Oz Yilmaz §1.1 \(Sampling & Frequency Aliasing\)/i)).toBeInTheDocument()
  })

  it('displays aliased badge and metrics', async () => {
    renderPage()

    await waitFor(() => {
      expect(screen.getByText(/ALIASED \(55 Hz\)/i)).toBeInTheDocument()
      expect(screen.getByText('62.5 Hz')).toBeInTheDocument()
    })
  })

  it('allows clicking quick educational preset', () => {
    renderPage()
    const presetBtn = screen.getByRole('button', { name: /Yilmaz Fig 1.1-4:/i })
    fireEvent.click(presetBtn)
    expect(presetBtn).toBeInTheDocument()
  })

  it('renders the 2 chart containers', () => {
    renderPage()
    const containers = screen.getAllByTestId('echart-container')
    expect(containers.length).toBe(2)
  })
})
