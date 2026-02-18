import { defineConfig, type Plugin } from 'vite'
import { devtools } from '@tanstack/devtools-vite'
import { tanstackStart } from '@tanstack/react-start/plugin/vite'
import viteReact from '@vitejs/plugin-react'
import viteTsConfigPaths from 'vite-tsconfig-paths'
import { fileURLToPath, URL } from 'node:url'
import tailwindcss from '@tailwindcss/vite'
import { nitro } from 'nitro/vite'

function createClientNodePolyfillPlugin(): Plugin {
  const polyfills = new Map<string, string>([
    [
      'node:async_hooks',
      fileURLToPath(new URL('./src/lib/polyfills/async-hooks.ts', import.meta.url)),
    ],
    [
      'node:stream/web',
      fileURLToPath(new URL('./src/lib/polyfills/node-stream-web.ts', import.meta.url)),
    ],
    ['node:stream', fileURLToPath(new URL('./src/lib/polyfills/node-stream.ts', import.meta.url))],
  ])

  return {
    name: 'client-node-polyfills',
    enforce: 'pre',
    resolveId(source, _importer, options) {
      if (options?.ssr) {
        return null
      }

      return polyfills.get(source) ?? null
    },
  }
}

const config = defineConfig(() => {
  const aliases: Record<string, string> = {
    '@': fileURLToPath(new URL('./src', import.meta.url)),
  }

  return {
    resolve: {
      alias: aliases,
    },
    plugins: [
      createClientNodePolyfillPlugin(),
      devtools(),
      nitro({ rollupConfig: { external: [/^@sentry\//] } }),
      // this is the plugin that enables path aliases
      viteTsConfigPaths({
        projects: ['./tsconfig.json'],
      }),
      tailwindcss(),
      tanstackStart(),
      viteReact({
        babel: {
          plugins: [['babel-plugin-react-compiler']],
        },
      }),
    ],
  }
})

export default config
