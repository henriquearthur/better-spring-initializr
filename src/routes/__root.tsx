import { TanStackDevtools } from '@tanstack/react-devtools'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { createRootRoute,HeadContent, Scripts } from '@tanstack/react-router'
import { TanStackRouterDevtoolsPanel } from '@tanstack/react-router-devtools'
import { Analytics } from '@vercel/analytics/react'
import { NuqsAdapter } from 'nuqs/adapters/tanstack-router'

import { ThemeProvider } from '../shared/ui/theme/theme-provider'
import appCss from '../styles/app.css?url'

const THEME_BOOTSTRAP_SCRIPT = `
(() => {
  const root = document.documentElement
  const key = 'better-spring-initializr-theme'

  try {
    const stored = window.localStorage.getItem(key)
    const theme = stored === 'light' || stored === 'dark' ? stored : 'dark'
    root.classList.toggle('dark', theme === 'dark')
  } catch {
    root.classList.add('dark')
  }
})()
`

export const Route = createRootRoute({
  head: () => ({
    meta: [
      {
        charSet: 'utf-8',
      },
      {
        name: 'viewport',
        content: 'width=device-width, initial-scale=1',
      },
      {
        title: 'Better Spring Initializr',
      },
    ],
    links: [
      {
        rel: 'stylesheet',
        href: appCss,
      },
      {
        rel: 'icon',
        type: 'image/png',
        href: '/icon.png',
      },
      {
        rel: 'apple-touch-icon',
        href: '/icon.png',
      },
      {
        rel: 'manifest',
        href: '/manifest.json',
      },
    ],
  }),
  shellComponent: RootDocument,
})

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 1,
      refetchOnWindowFocus: false,
    },
  },
})

function RootDocument({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <head>
        <script dangerouslySetInnerHTML={{ __html: THEME_BOOTSTRAP_SCRIPT }} />
        <HeadContent />
      </head>
      <body>
        <ThemeProvider>
          <QueryClientProvider client={queryClient}>
            <NuqsAdapter>{children}</NuqsAdapter>
          </QueryClientProvider>
        </ThemeProvider>
        <TanStackDevtools
          config={{
            position: 'bottom-right',
          }}
          plugins={[
            {
              name: 'Tanstack Router',
              render: <TanStackRouterDevtoolsPanel />,
            },
          ]}
        />
        <Scripts />
        <Analytics />
      </body>
    </html>
  )
}
