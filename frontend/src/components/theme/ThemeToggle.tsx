import { useEffect, useState } from 'react'
import { Sun, Moon } from 'lucide-react'

export type Theme = 'light' | 'dark'

export function getInitialTheme(): Theme {
  if (typeof window === 'undefined') return 'dark'
  const stored = localStorage.getItem('geophysics-theme') as Theme | null
  if (stored === 'light' || stored === 'dark') return stored
  return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light'
}

export function ThemeToggle({ className = '' }: { className?: string }) {
  const [theme, setTheme] = useState<Theme>(getInitialTheme)

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme)
    localStorage.setItem('geophysics-theme', theme)
    window.dispatchEvent(new CustomEvent('themechange', { detail: { theme } }))
  }, [theme])

  const toggleTheme = () => {
    setTheme((prev) => (prev === 'light' ? 'dark' : 'light'))
  }

  return (
    <button
      type="button"
      onClick={toggleTheme}
      className={`btn btn-ghost btn-sm gap-2 transition-colors ${className}`}
      aria-label={`Switch to ${theme === 'light' ? 'dark' : 'light'} mode`}
      title={`Switch to ${theme === 'light' ? 'dark' : 'light'} mode`}
    >
      {theme === 'light' ? (
        <>
          <Sun className="h-4 w-4 text-warning" />
          <span className="text-xs font-medium">Light</span>
        </>
      ) : (
        <>
          <Moon className="h-4 w-4 text-primary" />
          <span className="text-xs font-medium">Dark</span>
        </>
      )}
    </button>
  )
}
