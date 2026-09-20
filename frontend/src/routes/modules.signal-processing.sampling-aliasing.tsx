import { createFileRoute } from '@tanstack/react-router'
import { SamplingAliasingPage } from '../components/modules/sampling/SamplingAliasingPage'

export const Route = createFileRoute('/modules/signal-processing/sampling-aliasing')({
  component: SamplingAliasingPage,
})
