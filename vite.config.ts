import { fileURLToPath, URL } from 'node:url'

import { defineConfig } from 'vite'
import { loadEnv } from 'vite'
import { VitePWA } from 'vite-plugin-pwa'
import tailwindcss from '@tailwindcss/vite'
import vue from '@vitejs/plugin-vue'
import vueDevTools from 'vite-plugin-vue-devtools'

// https://vite.dev/config/
export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '')
  const configuredBasePath = env.VITE_BASE_PATH || '/'
  // GitHub Pages reports project base paths without a trailing slash. Vite's
  // %BASE_URL% replacement is string-based, so normalize it before it is used
  // by the manifest link, router, service worker, and generated asset URLs.
  const basePath =
    configuredBasePath === '/' ? '/' : `/${configuredBasePath.replace(/^\/+|\/+$/g, '')}/`

  return {
    base: basePath,
    plugins: [
      vue(),
      ...(mode === 'production' ? [] : [vueDevTools()]),
      tailwindcss(),
      VitePWA({
        registerType: 'autoUpdate',
        manifest: {
          name: 'LaoChristian.org',
          short_name: 'LaoChristian.org',
          description: 'Lao Bible, worship, study, and presentation resources',
          lang: 'lo',
          id: '.',
          start_url: '.',
          scope: '.',
          display: 'standalone',
          orientation: 'any',
          background_color: '#f6f1e7',
          theme_color: '#2e675e',
          icons: [
            { src: 'android-chrome-192x192.png', sizes: '192x192', type: 'image/png' },
            { src: 'android-chrome-256x256.png', sizes: '256x256', type: 'image/png' },
          ],
        },
        // Registration is handled explicitly in App.vue via useRegisterSW(),
        // so a client actually reloads when a new version activates instead
        // of silently sitting on stale precached assets until a 2nd refresh.
        injectRegister: false,
        // vite-plugin-pwa only auto-sets these when it manages registration
        // itself (injectRegister !== false), so with manual registration
        // above they must be set explicitly -- otherwise the generated SW
        // falls back to waiting for an explicit skip-waiting postMessage
        // that never arrives, and a new version just sits in "waiting"
        // forever instead of activating and taking over the page.
        workbox: {
          skipWaiting: true,
          clientsClaim: true,
          globPatterns: ['**/*.{js,css,html,ico,png,svg,webp,woff,woff2,ttf}'],
        },
        devOptions: {
          enabled: env.VITE_DISABLE_PWA !== 'true',
        },
      }),
    ],
    resolve: {
      alias: {
        '@': fileURLToPath(new URL('./src', import.meta.url)),
      },
    },
    server: {
      host: '0.0.0.0',
      port: 5173,
      strictPort: true,
      watch: {
        usePolling: true,
      },
    },
  }
})
