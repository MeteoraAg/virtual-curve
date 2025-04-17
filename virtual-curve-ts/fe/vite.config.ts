import {
  vitePlugin as remix,
  cloudflareDevProxyVitePlugin as remixCloudflareDevProxy,
} from '@remix-run/dev'
import { defineConfig } from 'vite'
import tsconfigPaths from 'vite-tsconfig-paths'
import tailwindcss from '@tailwindcss/vite'
import { getLoadContext } from './load-context'
import { installGlobals } from '@remix-run/node'

installGlobals({ nativeFetch: true })

declare module '@remix-run/cloudflare' {
  interface Future {
    v3_singleFetch: true
  }
}

export default defineConfig({
  resolve: {
    dedupe: ['buffer', 'bn.js'],
  },
  optimizeDeps: {
    include: ['bn.js'],
    esbuildOptions: {
      target: 'esnext',
    },
  },
  // build: {
  //   commonjsOptions: {
  //     exclude: messedUpDeps,
  //   },
  // },
  plugins: [
    remixCloudflareDevProxy({
      getLoadContext,
    }),
    remix({
      ignoredRouteFiles: ['**/*.css'],
      future: {
        v3_fetcherPersist: true,
        v3_relativeSplatPath: true,
        v3_throwAbortReason: true,
        v3_singleFetch: true,
        v3_lazyRouteDiscovery: true,
      },
    }),
    tsconfigPaths(),
    tailwindcss(),
  ],
})
