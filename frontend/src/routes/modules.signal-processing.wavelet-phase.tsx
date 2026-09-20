import { createFileRoute } from '@tanstack/react-router'
import { WaveletPhasePage } from '../components/modules/wavelet_phase/WaveletPhasePage'

export const Route = createFileRoute('/modules/signal-processing/wavelet-phase')({
  component: WaveletPhasePage,
})
