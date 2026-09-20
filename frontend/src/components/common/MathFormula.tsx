import { useMemo } from 'react'
import katex from 'katex'

interface MathFormulaProps {
  math: string
  display?: boolean
  className?: string
}

export function MathFormula({ math, display = false, className = '' }: MathFormulaProps) {
  const html = useMemo(() => {
    try {
      return katex.renderToString(math, {
        displayMode: display,
        throwOnError: false,
      })
    } catch {
      return math
    }
  }, [math, display])

  return (
    <span
      className={className}
      dangerouslySetInnerHTML={{ __html: html }}
    />
  )
}
