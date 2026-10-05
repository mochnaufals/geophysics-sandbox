import { render, screen, fireEvent } from '@testing-library/react'
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { CommandPalette } from '../components/layout/CommandPalette'
import { Navbar } from '../components/layout/Navbar'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'

const mockNavigate = vi.fn()
vi.mock('@tanstack/react-router', () => ({
  useNavigate: () => mockNavigate,
}))

describe('CommandPalette & Ctrl+K Search', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    localStorage.clear()
    document.documentElement.removeAttribute('data-theme')
  })

  it('renders command palette dialog when open is true', () => {
    render(<CommandPalette open={true} onOpenChange={vi.fn()} />)

    expect(
      screen.getByPlaceholderText('Search topics, equations, modules, or actions...')
    ).toBeInTheDocument()

    expect(screen.getByText('1D Fourier Transform')).toBeInTheDocument()
    expect(screen.getByText('Sampling & Frequency Aliasing')).toBeInTheDocument()
    expect(screen.getByText('Wavelet Phase & Character')).toBeInTheDocument()
  })

  it('filters results when typing search keywords', async () => {
    render(<CommandPalette open={true} onOpenChange={vi.fn()} />)

    const input = screen.getByPlaceholderText('Search topics, equations, modules, or actions...')
    fireEvent.change(input, { target: { value: 'ricker' } })

    expect(screen.getByText('Wavelet Phase & Character')).toBeInTheDocument()
    expect(screen.queryByText('1D Fourier Transform')).not.toBeInTheDocument()
  })

  it('navigates to module route on selection', () => {
    const handleOpenChange = vi.fn()
    render(<CommandPalette open={true} onOpenChange={handleOpenChange} />)

    const item = screen.getByText('Sampling & Frequency Aliasing')
    fireEvent.click(item)

    expect(mockNavigate).toHaveBeenCalledWith({
      to: '/modules/signal-processing/sampling-aliasing',
    })
    expect(handleOpenChange).toHaveBeenCalledWith(false)
  })

  it('executes theme toggle action from quick actions', () => {
    const handleOpenChange = vi.fn()
    render(<CommandPalette open={true} onOpenChange={handleOpenChange} />)

    const themeItem = screen.getByText('Toggle Light / Dark Theme')
    fireEvent.click(themeItem)

    expect(handleOpenChange).toHaveBeenCalledWith(false)
    expect(document.documentElement.getAttribute('data-theme')).toBeTruthy()
  })

  it('triggers onOpenSearch from Navbar search button', () => {
    const handleOpenSearch = vi.fn()
    const queryClient = new QueryClient()

    render(
      <QueryClientProvider client={queryClient}>
        <Navbar
          onToggleSidebar={vi.fn()}
          sidebarCollapsed={false}
          onOpenSearch={handleOpenSearch}
        />
      </QueryClientProvider>
    )

    const searchBtn = screen.getByRole('button', {
      name: /quick search topics & modules/i,
    })
    fireEvent.click(searchBtn)

    expect(handleOpenSearch).toHaveBeenCalledTimes(1)
  })
})
