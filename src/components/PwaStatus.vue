<script setup lang="ts">
import { onBeforeUnmount, onMounted, ref } from 'vue'
import { library } from '@fortawesome/fontawesome-svg-core'
import { faCloudArrowDown, faCloudBolt } from '@fortawesome/free-solid-svg-icons'
import { FontAwesomeIcon } from '@fortawesome/vue-fontawesome'
import { useStaticText } from '@/composables/useStaticText'

interface InstallPromptEvent extends Event {
  prompt: () => Promise<void>
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>
}

library.add(faCloudArrowDown, faCloudBolt)
const online = ref(typeof navigator === 'undefined' ? true : navigator.onLine)
const installPrompt = ref<InstallPromptEvent | null>(null)
const copy = useStaticText()

function updateOnlineState(): void { online.value = navigator.onLine }
function captureInstallPrompt(event: Event): void {
  event.preventDefault()
  installPrompt.value = event as InstallPromptEvent
}
function clearInstallPrompt(): void { installPrompt.value = null }
async function install(): Promise<void> {
  if (!installPrompt.value) return
  const prompt = installPrompt.value
  await prompt.prompt()
  await prompt.userChoice
  installPrompt.value = null
}

onMounted(() => {
  window.addEventListener('online', updateOnlineState)
  window.addEventListener('offline', updateOnlineState)
  window.addEventListener('beforeinstallprompt', captureInstallPrompt)
  window.addEventListener('appinstalled', clearInstallPrompt)
})
onBeforeUnmount(() => {
  window.removeEventListener('online', updateOnlineState)
  window.removeEventListener('offline', updateOnlineState)
  window.removeEventListener('beforeinstallprompt', captureInstallPrompt)
  window.removeEventListener('appinstalled', clearInstallPrompt)
})
</script>

<template>
  <span v-if="!online" class="lc-status-pill" role="status" :title="copy.text('pwa.offline')">
    <font-awesome-icon icon="cloud-bolt" />
    <span class="hidden md:inline">ອອບລາຍ</span>
  </span>
  <button v-else-if="installPrompt" type="button" class="lc-icon-control" :aria-label="copy.text('pwa.install')" :title="copy.text('pwa.install')" @click="install">
    <font-awesome-icon icon="cloud-arrow-down" />
  </button>
</template>
