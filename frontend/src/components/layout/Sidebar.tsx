import { useState } from 'react'
import { Link } from '@tanstack/react-router'
import {
  Activity,
  Layers,
  Waves,
  Radio,
  Compass,
  ChevronLeft,
  ChevronRight,
  ChevronDown,
  Home,
  Info,
} from 'lucide-react'
import { ThemeToggle } from '../theme/ThemeToggle'

export interface SidebarProps {
  collapsed: boolean
  onToggleCollapse: () => void
}

interface DomainSection {
  id: string
  name: string
  icon: typeof Activity
  modules: Array<{ id: string; title: string; route: string }>
}

export function Sidebar({ collapsed, onToggleCollapse }: SidebarProps) {
  // Geophysics domain sections (empty initial state as requested)
  const domains: DomainSection[] = [
    {
      id: 'seismology',
      name: 'Seismology',
      icon: Waves,
      modules: [],
    },
    {
      id: 'potential-fields',
      name: 'Potential Fields',
      icon: Compass,
      modules: [],
    },
    {
      id: 'signal-processing',
      name: 'Signal Processing',
      icon: Radio,
      modules: [],
    },
    {
      id: 'petrophysics',
      name: 'Petrophysics',
      icon: Layers,
      modules: [],
    },
  ]

  const [openSections, setOpenSections] = useState<Record<string, boolean>>({
    seismology: true,
    'signal-processing': true,
  })

  const toggleSection = (id: string) => {
    setOpenSections((prev) => ({ ...prev, [id]: !prev[id] }))
  }

  return (
    <aside
      className={`relative flex flex-col bg-base-200 border-r border-base-300 transition-all duration-300 z-30 select-none ${
        collapsed ? 'w-16' : 'w-64'
      }`}
    >
      {/* Brand Header */}
      <div className="h-16 flex items-center px-4 border-b border-base-300 gap-3">
        <div className="flex items-center justify-center p-2 rounded-lg bg-primary/10 text-primary shrink-0">
          <Activity className="h-5 w-5" />
        </div>
        {!collapsed && (
          <div className="flex flex-col overflow-hidden">
            <span className="font-bold text-sm tracking-wide text-base-content truncate">
              Geophysics Sandbox
            </span>
            <span className="text-[10px] text-base-content/60 uppercase tracking-wider font-semibold">
              Interactive Lab
            </span>
          </div>
        )}
      </div>

      {/* Navigation Links */}
      <div className="flex-1 overflow-y-auto overflow-x-hidden p-2 space-y-4">
        {/* Main Dashboard / Home */}
        <div className="menu p-0">
          <Link
            to="/"
            className="flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium hover:bg-base-300 transition-colors text-base-content"
            activeProps={{ className: 'bg-primary text-primary-content hover:bg-primary/90' }}
            title="Dashboard Overview"
          >
            <Home className="h-4 w-4 shrink-0" />
            {!collapsed && <span>Overview</span>}
          </Link>
        </div>

        {/* Domain Sections */}
        <div className="space-y-2">
          {!collapsed && (
            <div className="px-3 text-[11px] font-semibold text-base-content/50 uppercase tracking-wider">
              Domains
            </div>
          )}

          {domains.map((domain) => {
            const Icon = domain.icon
            const isOpen = openSections[domain.id] ?? false

            if (collapsed) {
              return (
                <div key={domain.id} className="flex justify-center py-1">
                  <div
                    className="p-2 rounded-lg hover:bg-base-300 text-base-content/70 cursor-pointer"
                    title={domain.name}
                  >
                    <Icon className="h-4 w-4" />
                  </div>
                </div>
              )
            }

            return (
              <div key={domain.id} className="rounded-lg overflow-hidden">
                <button
                  type="button"
                  onClick={() => toggleSection(domain.id)}
                  className="w-full flex items-center justify-between px-3 py-1.5 text-xs font-medium text-base-content/80 hover:bg-base-300 rounded transition-colors"
                >
                  <div className="flex items-center gap-2">
                    <Icon className="h-3.5 w-3.5 text-primary" />
                    <span>{domain.name}</span>
                  </div>
                  <ChevronDown
                    className={`h-3.5 w-3.5 transition-transform duration-200 text-base-content/50 ${
                      isOpen ? 'rotate-180' : ''
                    }`}
                  />
                </button>

                {isOpen && (
                  <div className="pl-6 pr-2 py-1 space-y-1">
                    {domain.modules.length === 0 ? (
                      <div className="text-[11px] text-base-content/40 italic py-0.5 px-2">
                        No modules added yet
                      </div>
                    ) : (
                      domain.modules.map((m) => (
                        <Link
                          key={m.id}
                          to={m.route}
                          className="block text-xs py-1 px-2 rounded hover:bg-base-300 text-base-content/70 hover:text-base-content transition-colors"
                        >
                          {m.title}
                        </Link>
                      ))
                    )}
                  </div>
                )}
              </div>
            )
          })}
        </div>

        {/* Informational Guidance Box (when expanded) */}
        {!collapsed && (
          <div className="mx-1 mt-4 p-3 bg-base-300/40 rounded-xl border border-base-300 text-xs text-base-content/70">
            <div className="flex items-center gap-1.5 font-medium text-base-content mb-1">
              <Info className="h-3.5 w-3.5 text-info" />
              <span>Modular Sandbox</span>
            </div>
            <p className="text-[11px] leading-relaxed">
              As you study books and references, new topic modules will be added to the domains above.
            </p>
          </div>
        )}
      </div>

      {/* Bottom Pinned Controls (Collapse toggle + Theme Toggle) */}
      <div className="p-3 border-t border-base-300 flex items-center justify-between gap-2 bg-base-200/80">
        <ThemeToggle className={collapsed ? 'btn-square' : ''} />

        <button
          type="button"
          onClick={onToggleCollapse}
          className="btn btn-ghost btn-sm btn-square"
          aria-label={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
          title={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
        >
          {collapsed ? (
            <ChevronRight className="h-4 w-4" />
          ) : (
            <ChevronLeft className="h-4 w-4" />
          )}
        </button>
      </div>
    </aside>
  )
}
