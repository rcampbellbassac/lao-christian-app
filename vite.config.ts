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
  const basePath = env.VITE_BASE_PATH || '/'

  return {
    base: basePath,
  plugins: [
    vue(),
    ...(mode === 'production' ? [] : [vueDevTools()]),
    tailwindcss(),
    VitePWA({
      registerType: 'autoUpdate',
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
        enabled: true
      }
    }),
  ],
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./src', import.meta.url))
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
