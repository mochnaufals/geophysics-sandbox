import { useQuery } from '@tanstack/react-query'
import { Menu, Search, CheckCircle2, AlertTriangle, Terminal } from 'lucide-react'
import { getHealthStatus } from '../../lib/api'

export interface NavbarProps {
  onToggleSidebar: () => void
  sidebarCollapsed: boolean
  title?: string
}

export function Navbar({ onToggleSidebar, title = 'Geophysics Sandbox' }: NavbarProps) {
  // Query backend health every 30 seconds
  const { data: health, isSuccess, isLoading } = useQuery({
    queryKey: ['backend-health'],
    queryFn: getHealthStatus,
    refetchInterval: 30000,
  })

  return (
    <header className="h-16 border-b border-base-300 bg-base-100/80 backdrop-blur-md px-4 flex items-center justify-between sticky top-0 z-20">
      {/* Left: Sidebar Toggle & Breadcrumb / Title */}
      <div className="flex items-center gap-3">
        <button
          type="button"
          onClick={onToggleSidebar}
          className="btn btn-ghost btn-sm btn-square"
          aria-label="Toggle sidebar"
          title="Toggle sidebar"
        >
          <Menu className="h-4 w-4" />
        </button>

        <div className="flex items-center gap-2 text-sm">
          <span className="text-base-content/50 hidden sm:inline">Workspace /</span>
          <h1 className="font-semibold text-base-content">{title}</h1>
        </div>
      </div>

      {/* Center: Search / Quick Find (Mock / Interactive) */}
      <div className="hidden md:flex items-center">
        <label className="input input-sm input-bordered flex items-center gap-2 w-64 bg-base-200/50">
          <Search className="h-3.5 w-3.5 text-base-content/50" />
          <input
            type="text"
            className="grow text-xs placeholder:text-base-content/40"
            placeholder="Quick search topics & modules..."
          />
          <kbd className="kbd kbd-xs text-[10px]">Ctrl+K</kbd>
        </label>
      </div>

      {/* Right: Backend Status Indicator */}
      <div className="flex items-center gap-2">
        <div className="dropdown dropdown-end">
          <div
            tabIndex={0}
            role="button"
            className="btn btn-ghost btn-sm gap-2 normal-case font-normal"
          >
            {isLoading ? (
              <span className="loading loading-spinner loading-xs text-primary"></span>
            ) : isSuccess ? (
              <span className="flex items-center gap-1.5 text-xs text-success font-medium">
                <span className="h-2 w-2 rounded-full bg-success animate-pulse"></span>
                <span className="hidden sm:inline">FastAPI Live</span>
              </span>
            ) : (
              <span className="flex items-center gap-1.5 text-xs text-warning font-medium">
                <span className="h-2 w-2 rounded-full bg-warning"></span>
                <span className="hidden sm:inline">Backend Offline</span>
              </span>
            )}
          </div>

          <div
            tabIndex={0}
            className="dropdown-content z-30 card card-compact w-72 p-3 shadow-xl bg-base-100 border border-base-300 mt-2 text-xs"
          >
            <div className="flex items-center gap-2 font-semibold pb-2 border-b border-base-200">
              <Terminal className="h-4 w-4 text-primary" />
              <span>Scientific Backend Status</span>
            </div>

            {isSuccess && health ? (
              <div className="py-2 space-y-1.5">
                <div className="flex items-center gap-1.5 text-success">
                  <CheckCircle2 className="h-3.5 w-3.5 shrink-0" />
                  <span className="font-medium">{health.service}</span>
                </div>
                <div className="grid grid-cols-2 gap-1 text-[11px] pt-1">
                  <span className="text-base-content/60">Python:</span>
                  <span className="font-mono text-right">{health.versions.python}</span>
                  <span className="text-base-content/60">FastAPI:</span>
                  <span className="font-mono text-right">{health.versions.fastapi}</span>
                  <span className="text-base-content/60">NumPy:</span>
                  <span className="font-mono text-right">{health.versions.numpy}</span>
                  <span className="text-base-content/60">SciPy:</span>
                  <span className="font-mono text-right">{health.versions.scipy}</span>
                  <span className="text-base-content/60">Matplotlib:</span>
                  <span className="font-mono text-right">{health.versions.matplotlib}</span>
                </div>
              </div>
            ) : (
              <div className="py-2 space-y-1">
                <div className="flex items-center gap-1.5 text-warning font-medium">
                  <AlertTriangle className="h-3.5 w-3.5 shrink-0" />
                  <span>Cannot reach backend API</span>
                </div>
                <p className="text-[11px] text-base-content/70">
                  Run <code className="bg-base-200 px-1 py-0.5 rounded font-mono">uv run uvicorn app.main:app --port 8000</code> in the <code className="bg-base-200 px-1 py-0.5 rounded font-mono">backend</code> directory.
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    </header>
  )
}
