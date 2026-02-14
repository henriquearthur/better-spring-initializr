import { defineConfig } from 'vite'
import { devtools } from '@tanstack/devtools-vite'
import { tanstackStart } from '@tanstack/react-start/plugin/vite'
import viteReact from '@vitejs/plugin-react'
import viteTsConfigPaths from 'vite-tsconfig-paths'
import { fileURLToPath, URL } from 'node:url'
import tailwindcss from '@tailwindcss/vite'
import { nitro } from 'nitro/vite'

const config = defineConfig(({ isSsrBuild }) => {
  const aliases: Record<string, string> = {
    '@': fileURLToPath(new URL('./src', import.meta.url)),
  }

  if (!isSsrBuild) {
    aliases['node:async_hooks'] = fileURLToPath(
      new URL('./src/lib/polyfills/async-hooks.ts', import.meta.url),
    )
    aliases['node:stream/web'] = fileURLToPath(
      new URL('./src/lib/polyfills/node-stream-web.ts', import.meta.url),
    )
    aliases['node:stream'] = fileURLToPath(new URL('./src/lib/polyfills/node-stream.ts', import.meta.url))
  }

  return {
    resolve: {
      alias: aliases,
    },
    plugins: [
      devtools(),
      nitro({ rollupConfig: { external: [/^@sentry\//] } }),
      // this is the plugin that enables path aliases
      viteTsConfigPaths({
        projects: ['./tsconfig.json'],
      }),
      tailwindcss(),
      tanstackStart(),
      viteReact(),
    ],
  }
})

export default config
