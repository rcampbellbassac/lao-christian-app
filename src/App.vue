<script setup lang="ts">
import { onMounted, watch } from 'vue'
import { RouterView, useRoute } from 'vue-router'
import MainToolbar from './components/MainToolbar.vue'
import MainFooter from './components/MainFooter.vue'
import CookieConsent from './components/CookieConsent.vue'
import { useSettingsStore } from '@/stores/settings'
import { useRegisterSW } from 'virtual:pwa-register/vue'

const settings = useSettingsStore()
const route = useRoute()

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
  <div class="app-shell relative min-h-screen overflow-x-hidden">
    <MainToolbar v-if="!route.meta.bare" />
    <RouterView class="pb-5 transition-all duration-300 ease-out" />
    <MainFooter v-if="!route.meta.bare" />
    <CookieConsent v-if="!route.meta.bare" />
  </div>
</template>
