import { createRootRoute } from '@tanstack/react-router'
import { QueryClientProvider } from '@tanstack/react-query'
// import { ReactQueryDevtools } from '@tanstack/react-query-devtools'
// import { TanStackRouterDevtools } from '@tanstack/router-devtools'
import { queryClient } from '../lib/queryClient'
import { AppLayout } from '../components/layout/AppLayout'

export const Route = createRootRoute({
  component: RootComponent,
})

function RootComponent() {
  return (
    <QueryClientProvider client={queryClient}>
      <AppLayout />
      {import.meta.env.DEV && (
        <>
          {/* <TanStackRouterDevtools position="bottom-right" />
          <ReactQueryDevtools initialIsOpen={false} buttonPosition="bottom-left" /> */}
        </>
      )}
    </QueryClientProvider>
  )
}
