import { Command } from 'cmdk'
import { useNavigate } from '@tanstack/react-router'
import {
  Search,
  Radio,
  Waves,
  Sun,
  Menu,
  Terminal,
  ExternalLink,
  Activity,
  Compass,
  Layers,
} from 'lucide-react'
import { toggleGlobalTheme } from '../theme/ThemeToggle'

export interface CommandPaletteProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onToggleSidebar?: () => void
}

interface SearchableModule {
  id: string
  title: string
  route: string
  domain: string
  description: string
  icon: typeof Radio
  keywords: string[]
}

const MODULES_REGISTRY: SearchableModule[] = [
  {
    id: 'fourier-1d',
    title: '1D Fourier Transform',
    route: '/modules/signal-processing/fourier-1d',
    domain: 'Signal Processing',
    description: 'Spring motion synthesis, harmonic superposition, amplitude & phase spectrum',
    icon: Radio,
    keywords: [
      'fourier',
      '1d',
      'spring',
      'superposition',
      'phase lag',
      'amplitude spectrum',
      'euler',
      'sinusoid',
      'fft',
      'ifft',
      'yilmaz 1.1',
    ],
  },
  {
    id: 'sampling-aliasing',
    title: 'Sampling & Frequency Aliasing',
    route: '/modules/signal-processing/sampling-aliasing',
    domain: 'Signal Processing',
    description: 'Continuous vs discrete sampling, Nyquist folding, anti-aliasing filter',
    icon: Activity,
    keywords: [
      'sampling',
      'aliasing',
      'nyquist',
      'folding',
      'shannon',
      'sample rate',
      'butterworth',
      'anti-alias',
      'discrete',
      'analog',
      'ghost wave',
      'yilmaz 1.1.2',
    ],
  },
  {
    id: 'wavelet-phase',
    title: 'Wavelet Phase & Character',
    route: '/modules/signal-processing/wavelet-phase',
    domain: 'Signal Processing',
    description: 'Zero, minimum, maximum phase, Hilbert rotation, Kolmogorov factorization',
    icon: Waves,
    keywords: [
      'wavelet',
      'phase',
      'ricker',
      'minimum phase',
      'maximum phase',
      'kolmogorov',
      'hilbert',
      'phase rotation',
      'cumulative energy',
      'yilmaz 1.1.3',
    ],
  },
  {
    id: 'overview',
    title: 'Dashboard Overview',
    route: '/',
    domain: 'Core',
    description: 'Geophysics Sandbox laboratory dashboard and domain navigation',
    icon: Compass,
    keywords: ['home', 'overview', 'dashboard', 'domains', 'welcome', 'sandbox'],
  },
]

export function CommandPalette({ open, onOpenChange, onToggleSidebar }: CommandPaletteProps) {
  const navigate = useNavigate()

  const handleSelectModule = (route: string) => {
    navigate({ to: route })
    onOpenChange(false)
  }

  const handleToggleTheme = () => {
    toggleGlobalTheme()
    onOpenChange(false)
  }

  const handleToggleSidebar = () => {
    onToggleSidebar?.()
    onOpenChange(false)
  }

  const handleOpenDocs = () => {
    window.open('http://localhost:8000/docs', '_blank')
    onOpenChange(false)
  }

  return (
    <Command.Dialog
      open={open}
      onOpenChange={onOpenChange}
      label="Geophysics Sandbox Command Palette"
      overlayClassName="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 animate-in fade-in duration-150"
      contentClassName="fixed top-[15vh] left-1/2 -translate-x-1/2 w-[calc(100vw-2rem)] max-w-xl rounded-2xl bg-base-100 border border-base-300 shadow-2xl overflow-hidden z-50 focus:outline-none p-0 animate-in zoom-in-95 duration-150"
      className="w-full bg-base-100 text-base-content"
    >
      {/* Search Input Bar */}
      <div className="flex items-center px-4 border-b border-base-200">
        <Search className="h-4 w-4 text-base-content/50 shrink-0" />
        <Command.Input
          placeholder="Search topics, equations, modules, or actions..."
          className="w-full bg-transparent px-3 py-3.5 text-sm text-base-content placeholder:text-base-content/40 focus:outline-none"
        />
        <kbd
          onClick={() => onOpenChange(false)}
          className="kbd kbd-xs bg-base-200 text-base-content/60 text-[10px] cursor-pointer hover:bg-base-300 transition-colors"
        >
          ESC
        </kbd>
      </div>

      {/* Results List */}
      <Command.List className="max-h-80 overflow-y-auto p-2 scrollbar-thin">
        <Command.Empty className="py-8 text-center text-xs text-base-content/50">
          No geophysics modules or actions matching your search.
        </Command.Empty>

        {/* Modules Group */}
        <Command.Group
          heading="Geophysics Modules"
          className="px-1 py-1.5 [&_[cmdk-group-heading]]:px-2 [&_[cmdk-group-heading]]:py-1.5 [&_[cmdk-group-heading]]:text-[10px] [&_[cmdk-group-heading]]:font-bold [&_[cmdk-group-heading]]:uppercase [&_[cmdk-group-heading]]:tracking-wider [&_[cmdk-group-heading]]:text-base-content/50"
        >
          {MODULES_REGISTRY.map((item) => {
            const Icon = item.icon
            return (
              <Command.Item
                key={item.id}
                value={`${item.title} ${item.domain} ${item.description} ${item.keywords.join(' ')}`}
                keywords={item.keywords}
                onSelect={() => handleSelectModule(item.route)}
                className="flex items-center justify-between px-3 py-2.5 rounded-lg text-xs cursor-pointer select-none transition-colors data-[selected=true]:bg-primary data-[selected=true]:text-primary-content text-base-content mb-1 group"
              >
                <div className="flex items-center gap-3 min-w-0">
                  <div className="p-1.5 rounded-md bg-base-200 group-data-[selected=true]:bg-primary-content/20 shrink-0">
                    <Icon className="h-3.5 w-3.5" />
                  </div>
                  <div className="flex flex-col min-w-0">
                    <span className="font-medium truncate">{item.title}</span>
                    <span className="text-[11px] opacity-70 truncate">{item.description}</span>
                  </div>
                </div>
                <div className="shrink-0 ml-2">
                  <span className="badge badge-xs bg-base-200/80 group-data-[selected=true]:bg-primary-content/20 group-data-[selected=true]:text-primary-content border-none font-medium">
                    {item.domain}
                  </span>
                </div>
              </Command.Item>
            )
          })}
        </Command.Group>

        {/* Future Domain Outlines */}
        <Command.Group
          heading="Domain Laboratories"
          className="px-1 py-1.5 mt-1 border-t border-base-200/60 [&_[cmdk-group-heading]]:px-2 [&_[cmdk-group-heading]]:py-1.5 [&_[cmdk-group-heading]]:text-[10px] [&_[cmdk-group-heading]]:font-bold [&_[cmdk-group-heading]]:uppercase [&_[cmdk-group-heading]]:tracking-wider [&_[cmdk-group-heading]]:text-base-content/50"
        >
          <Command.Item
            value="Signal Processing Domain Fourier Sampling Wavelets"
            keywords={['signal', 'fourier', 'wavelet', 'sampling', 'filter']}
            onSelect={() => handleSelectModule('/modules/signal-processing/fourier-1d')}
            className="flex items-center justify-between px-3 py-2 rounded-lg text-xs cursor-pointer select-none transition-colors data-[selected=true]:bg-primary data-[selected=true]:text-primary-content text-base-content mb-1 group"
          >
            <div className="flex items-center gap-3">
              <div className="p-1.5 rounded-md bg-base-200 group-data-[selected=true]:bg-primary-content/20 shrink-0">
                <Radio className="h-3.5 w-3.5" />
              </div>
              <span className="font-medium">Signal Processing (Active)</span>
            </div>
            <span className="badge badge-xs badge-success badge-outline">3 Modules</span>
          </Command.Item>

          <Command.Item
            value="Seismology Domain Wave Propagation Reflection Traveltimes"
            keywords={['seismology', 'seismic', 'wave', 'reflection', 'traveltime']}
            onSelect={() => handleSelectModule('/')}
            className="flex items-center justify-between px-3 py-2 rounded-lg text-xs cursor-pointer select-none transition-colors data-[selected=true]:bg-primary data-[selected=true]:text-primary-content text-base-content mb-1 group"
          >
            <div className="flex items-center gap-3">
              <div className="p-1.5 rounded-md bg-base-200 group-data-[selected=true]:bg-primary-content/20 shrink-0">
                <Waves className="h-3.5 w-3.5" />
              </div>
              <span className="font-medium">Seismology</span>
            </div>
            <span className="badge badge-xs badge-ghost">Planned</span>
          </Command.Item>

          <Command.Item
            value="Potential Fields Domain Gravity Magnetics"
            keywords={['potential', 'fields', 'gravity', 'magnetics', 'bouguer']}
            onSelect={() => handleSelectModule('/')}
            className="flex items-center justify-between px-3 py-2 rounded-lg text-xs cursor-pointer select-none transition-colors data-[selected=true]:bg-primary data-[selected=true]:text-primary-content text-base-content mb-1 group"
          >
            <div className="flex items-center gap-3">
              <div className="p-1.5 rounded-md bg-base-200 group-data-[selected=true]:bg-primary-content/20 shrink-0">
                <Compass className="h-3.5 w-3.5" />
              </div>
              <span className="font-medium">Potential Fields</span>
            </div>
            <span className="badge badge-xs badge-ghost">Planned</span>
          </Command.Item>

          <Command.Item
            value="Petrophysics Domain Well Logging Porosity Resistivity Archie"
            keywords={['petrophysics', 'porosity', 'resistivity', 'archie', 'logging']}
            onSelect={() => handleSelectModule('/')}
            className="flex items-center justify-between px-3 py-2 rounded-lg text-xs cursor-pointer select-none transition-colors data-[selected=true]:bg-primary data-[selected=true]:text-primary-content text-base-content mb-1 group"
          >
            <div className="flex items-center gap-3">
              <div className="p-1.5 rounded-md bg-base-200 group-data-[selected=true]:bg-primary-content/20 shrink-0">
                <Layers className="h-3.5 w-3.5" />
              </div>
              <span className="font-medium">Petrophysics</span>
            </div>
            <span className="badge badge-xs badge-ghost">Planned</span>
          </Command.Item>
        </Command.Group>

        {/* Quick Actions */}
        <Command.Group
          heading="System Actions"
          className="px-1 py-1.5 mt-1 border-t border-base-200/60 [&_[cmdk-group-heading]]:px-2 [&_[cmdk-group-heading]]:py-1.5 [&_[cmdk-group-heading]]:text-[10px] [&_[cmdk-group-heading]]:font-bold [&_[cmdk-group-heading]]:uppercase [&_[cmdk-group-heading]]:tracking-wider [&_[cmdk-group-heading]]:text-base-content/50"
        >
          <Command.Item
            value="Toggle Light / Dark Theme mode"
            keywords={['theme', 'dark', 'light', 'mode', 'color', 'toggle']}
            onSelect={handleToggleTheme}
            className="flex items-center justify-between px-3 py-2 rounded-lg text-xs cursor-pointer select-none transition-colors data-[selected=true]:bg-primary data-[selected=true]:text-primary-content text-base-content mb-1 group"
          >
            <div className="flex items-center gap-3">
              <div className="p-1.5 rounded-md bg-base-200 group-data-[selected=true]:bg-primary-content/20 shrink-0">
                <Sun className="h-3.5 w-3.5" />
              </div>
              <span className="font-medium">Toggle Light / Dark Theme</span>
            </div>
            <kbd className="kbd kbd-xs bg-base-200/80 group-data-[selected=true]:bg-primary-content/20 group-data-[selected=true]:text-primary-content border-none text-[10px]">
              Theme
            </kbd>
          </Command.Item>

          <Command.Item
            value="Toggle Sidebar Collapse Expand"
            keywords={['sidebar', 'collapse', 'expand', 'menu', 'navigation']}
            onSelect={handleToggleSidebar}
            className="flex items-center justify-between px-3 py-2 rounded-lg text-xs cursor-pointer select-none transition-colors data-[selected=true]:bg-primary data-[selected=true]:text-primary-content text-base-content mb-1 group"
          >
            <div className="flex items-center gap-3">
              <div className="p-1.5 rounded-md bg-base-200 group-data-[selected=true]:bg-primary-content/20 shrink-0">
                <Menu className="h-3.5 w-3.5" />
              </div>
              <span className="font-medium">Toggle Sidebar</span>
            </div>
            <kbd className="kbd kbd-xs bg-base-200/80 group-data-[selected=true]:bg-primary-content/20 group-data-[selected=true]:text-primary-content border-none text-[10px]">
              Layout
            </kbd>
          </Command.Item>

          <Command.Item
            value="Open Backend FastAPI Swagger Documentation"
            keywords={['api', 'docs', 'swagger', 'fastapi', 'backend', 'documentation']}
            onSelect={handleOpenDocs}
            className="flex items-center justify-between px-3 py-2 rounded-lg text-xs cursor-pointer select-none transition-colors data-[selected=true]:bg-primary data-[selected=true]:text-primary-content text-base-content mb-1 group"
          >
            <div className="flex items-center gap-3">
              <div className="p-1.5 rounded-md bg-base-200 group-data-[selected=true]:bg-primary-content/20 shrink-0">
                <Terminal className="h-3.5 w-3.5" />
              </div>
              <span className="font-medium">Open Scientific Backend API Docs</span>
            </div>
            <ExternalLink className="h-3.5 w-3.5 opacity-60 group-data-[selected=true]:opacity-100" />
          </Command.Item>
        </Command.Group>
      </Command.List>

      {/* Footer Helper Bar */}
      <div className="px-4 py-2 border-t border-base-200 bg-base-200/40 flex items-center justify-between text-[11px] text-base-content/60">
        <div className="flex items-center gap-2">
          <span>Navigate</span>
          <kbd className="kbd kbd-xs">↑</kbd>
          <kbd className="kbd kbd-xs">↓</kbd>
          <span className="ml-1">Select</span>
          <kbd className="kbd kbd-xs">↵</kbd>
          <span className="ml-1">Close</span>
          <kbd className="kbd kbd-xs">ESC</kbd>
        </div>
        <div className="flex items-center gap-1.5">
          <span className="font-medium text-base-content/70">Geophysics Sandbox</span>
        </div>
      </div>
    </Command.Dialog>
  )
}
