import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen } from '@testing-library/react'
import * as echarts from 'echarts'
import { EChart } from './EChart'

const mockSetOption = vi.fn()
const mockResize = vi.fn()
const mockDispose = vi.fn()
const mockShowLoading = vi.fn()
const mockHideLoading = vi.fn()

vi.mock('echarts', async () => {
  const actual = await vi.importActual<typeof echarts>('echarts')
  return {
    ...actual,
    init: vi.fn().mockImplementation(() => ({
      setOption: mockSetOption,
      resize: mockResize,
      dispose: mockDispose,
      showLoading: mockShowLoading,
      hideLoading: mockHideLoading,
    })),
  }
})

describe('EChart Component', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('renders chart container element into the DOM', () => {
    const option = {
      title: { text: 'Test Geophysics Plot' },
      xAxis: { type: 'category' as const, data: ['0', '1', '2'] },
      yAxis: { type: 'value' as const },
      series: [{ data: [10, 20, 30], type: 'line' as const }],
    }

    render(<EChart option={option} />)
    const container = screen.getByTestId('echart-container')
    expect(container).toBeInTheDocument()
    expect(echarts.init).toHaveBeenCalled()
    expect(mockSetOption).toHaveBeenCalledWith(option)
  })

  it('calls onChartReady when initialized', () => {
    const onChartReady = vi.fn()
    const option = {
      xAxis: { type: 'value' as const },
      yAxis: { type: 'value' as const },
      series: [],
    }

    render(<EChart option={option} onChartReady={onChartReady} />)
    expect(onChartReady).toHaveBeenCalledTimes(1)
  })

  it('disposes chart instance on unmount', () => {
    const option = {
      xAxis: { type: 'value' as const },
      yAxis: { type: 'value' as const },
      series: [],
    }

    const { unmount } = render(<EChart option={option} />)
    unmount()
    expect(mockDispose).toHaveBeenCalled()
  })
})
