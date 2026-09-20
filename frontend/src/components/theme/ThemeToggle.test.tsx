import { describe, it, expect, beforeEach, vi } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import { ThemeToggle } from './ThemeToggle'

describe('ThemeToggle', () => {
  beforeEach(() => {
    localStorage.clear()
    document.documentElement.removeAttribute('data-theme')
  })

  it('renders theme toggle button with accessible label', () => {
    render(<ThemeToggle />)
    const button = screen.getByRole('button')
    expect(button).toBeInTheDocument()
    expect(button).toHaveAttribute('aria-label')
  })

  it('toggles theme between dark and light on click and updates document and localStorage', () => {
    localStorage.setItem('geophysics-theme', 'light')
    render(<ThemeToggle />)

    expect(document.documentElement.getAttribute('data-theme')).toBe('light')
    expect(screen.getByText('Light')).toBeInTheDocument()

    const button = screen.getByRole('button')
    fireEvent.click(button)

    expect(document.documentElement.getAttribute('data-theme')).toBe('dark')
    expect(localStorage.getItem('geophysics-theme')).toBe('dark')
    expect(screen.getByText('Dark')).toBeInTheDocument()
  })

  it('dispatches themechange custom event when toggled', () => {
    const handler = vi.fn()
    window.addEventListener('themechange', handler)

    render(<ThemeToggle />)
    const button = screen.getByRole('button')
    fireEvent.click(button)

    expect(handler).toHaveBeenCalled()
    window.removeEventListener('themechange', handler)
  })
})
