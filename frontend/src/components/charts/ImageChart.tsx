import { useState } from 'react'
import { Download, ZoomIn, AlertCircle } from 'lucide-react'

export interface ImageChartProps {
  src?: string
  alt?: string
  title?: string
  caption?: string
  loading?: boolean
  error?: string | null
  className?: string
}

export function ImageChart({
  src,
  alt = 'Geophysics Plot',
  title,
  caption,
  loading = false,
  error = null,
  className = '',
}: ImageChartProps) {
  const [isZoomed, setIsZoomed] = useState(false)

  const handleDownload = () => {
    if (!src) return
    const a = document.createElement('a')
    a.href = src
    a.download = `${(title || 'geophysics-plot').toLowerCase().replace(/\s+/g, '-')}.png`
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
  }

  if (loading) {
    return (
      <div className={`card bg-base-200 shadow-sm border border-base-300 p-6 flex flex-col items-center justify-center min-h-64 ${className}`}>
        <span className="loading loading-spinner loading-lg text-primary"></span>
        <p className="mt-3 text-sm text-base-content/70">Rendering scientific plot...</p>
      </div>
    )
  }

  if (error) {
    return (
      <div className={`alert alert-error shadow-sm ${className}`}>
        <AlertCircle className="h-5 w-5" />
        <div>
          <h4 className="font-semibold text-sm">Failed to generate plot</h4>
          <p className="text-xs">{error}</p>
        </div>
      </div>
    )
  }

  if (!src) {
    return (
      <div className={`card bg-base-200/50 border border-dashed border-base-300 p-8 text-center ${className}`}>
        <p className="text-sm text-base-content/60">No plot data generated yet.</p>
      </div>
    )
  }

  return (
    <div className={`card bg-base-100 shadow-sm border border-base-300 overflow-hidden ${className}`}>
      {title && (
        <div className="card-header px-4 py-3 border-b border-base-200 flex items-center justify-between">
          <h3 className="font-medium text-sm text-base-content">{title}</h3>
          <div className="flex items-center gap-1">
            <button
              type="button"
              onClick={() => setIsZoomed(true)}
              className="btn btn-ghost btn-xs btn-square"
              title="Zoom view"
              aria-label="Zoom view"
            >
              <ZoomIn className="h-3.5 w-3.5" />
            </button>
            <button
              type="button"
              onClick={handleDownload}
              className="btn btn-ghost btn-xs btn-square"
              title="Download image"
              aria-label="Download image"
            >
              <Download className="h-3.5 w-3.5" />
            </button>
          </div>
        </div>
      )}

      <div className="card-body p-3 flex items-center justify-center bg-base-100">
        <img
          src={src}
          alt={alt}
          className="max-h-96 w-auto object-contain rounded transition-transform cursor-pointer hover:opacity-95"
          onClick={() => setIsZoomed(true)}
        />
      </div>

      {caption && (
        <div className="px-4 py-2 bg-base-200/50 border-t border-base-200 text-xs text-base-content/70">
          {caption}
        </div>
      )}

      {/* Modal Zoom */}
      {isZoomed && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4"
          onClick={() => setIsZoomed(false)}
        >
          <div
            className="relative max-w-4xl max-h-[90vh] bg-base-100 rounded-lg p-2 shadow-2xl overflow-auto"
            onClick={(e) => e.stopPropagation()}
          >
            <button
              type="button"
              className="btn btn-circle btn-sm btn-ghost absolute right-2 top-2 z-10"
              onClick={() => setIsZoomed(false)}
              aria-label="Close zoomed view"
            >
              ✕
            </button>
            <img src={src} alt={alt} className="max-w-full h-auto object-contain rounded" />
          </div>
        </div>
      )}
    </div>
  )
}
