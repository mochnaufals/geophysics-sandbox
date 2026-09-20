import { createFileRoute } from '@tanstack/react-router'
import { Fourier1DModulePage } from '../components/modules/fourier1d/Fourier1DModulePage'

export const Route = createFileRoute('/modules/signal-processing/fourier-1d')({
  component: Fourier1DModulePage,
})
