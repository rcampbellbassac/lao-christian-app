<script setup lang="ts">
import { onMounted, watch } from 'vue'
import { RouterView } from 'vue-router'
import MainToolbar from './components/MainToolbar.vue'
import MainFooter from './components/MainFooter.vue'
import { useSettingsStore } from '@/stores/settings'
import { useRegisterSW } from 'virtual:pwa-register/vue'

const settings = useSettingsStore()

onMounted(async () => {
  await settings.load()
})

watch(
  () => settings.contentFontScale,
  (scale) => {
    document.documentElement.style.setProperty('--app-content-font-scale', String(scale))
  },
  { immediate: true }
)

// registerType: 'autoUpdate' (vite.config.ts) makes this reload the page
// automatically once a new service worker activates, instead of leaving
// visitors stuck on stale precached assets until they happen to refresh
// twice. The interval + visibility check make that detection prompt
// instead of waiting on the browser's own lazy update-check timing.
const UPDATE_CHECK_INTERVAL_MS = 5 * 60 * 1000

useRegisterSW({
  immediate: true,
  onRegisteredSW(_swUrl, registration) {
    if (!registration) return

    setInterval(() => {
      void registration.update()
    }, UPDATE_CHECK_INTERVAL_MS)

    document.addEventListener('visibilitychange', () => {
      if (document.visibilityState === 'visible') {
        void registration.update()
      }
    })
  },
  onRegisterError(error) {
    console.error('Service worker registration failed', error)
  },
})
</script>

<template>
  <div class="relative min-h-screen overflow-x-hidden">
    <div class="pointer-events-none fixed inset-0 -z-10 bg-no-repeat bg-cover bg-center opacity-75 dark:opacity-35 bg-[url(../assets/img/fog-8519076_1280-web.jpg)] dark:bg-[url(../assets/img/autumn-8620917-web.jpg)]"></div>
    <div class="pointer-events-none fixed inset-0 -z-10 bg-gradient-to-b from-white/72 via-white/58 to-white/82 dark:from-slate-950/97 dark:via-slate-950/94 dark:to-slate-950/97"></div>
    <MainToolbar />
    <RouterView class="pb-5 transition-all duration-300 ease-out" />
    <MainFooter />
  </div>
</template>
