<script setup lang="ts">
import { computed, onBeforeUnmount, onMounted, ref } from 'vue'
import { useRoute } from 'vue-router'
import { createUserBackup, importUserBackup, type UserBackupV2 } from '@/utils/userBackup'
import { useStaticText } from '@/composables/useStaticText'
import BilingualText from '@/components/BilingualText.vue'

type MigrationMessage =
  | { type: 'laochristian-migration-ready' }
  | { type: 'laochristian-migration-data'; backup: UserBackupV2 }
  | { type: 'laochristian-migration-complete' }

const route = useRoute()
const status = ref('')
const copy = useStaticText()
const targetUrl = `${import.meta.env.VITE_MIGRATION_TARGET_URL ?? ''}`.trim()
const trustedSourceOrigin = `${import.meta.env.VITE_MIGRATION_SOURCE_ORIGIN ?? 'https://rcampbellbassac.github.io'}`.replace(/\/$/, '')
const receiving = computed(() => route.query.receive === '1')
const canTransfer = computed(() => {
  if (!targetUrl) return false
  try { return new URL(targetUrl).origin !== window.location.origin }
  catch { return false }
})
let targetWindow: Window | null = null

async function sendBackup(event: MessageEvent<MigrationMessage>): Promise<void> {
  if (!targetWindow || event.source !== targetWindow || event.origin !== new URL(targetUrl).origin || event.data?.type !== 'laochristian-migration-ready') return
  status.value = copy.text('migration.sending')
  const backup = await createUserBackup()
  targetWindow.postMessage({ type: 'laochristian-migration-data', backup } satisfies MigrationMessage, event.origin)
}

async function receiveBackup(event: MessageEvent<MigrationMessage>): Promise<void> {
  if (!receiving.value || event.source !== window.opener || event.origin !== trustedSourceOrigin || event.data?.type !== 'laochristian-migration-data') return
  status.value = copy.text('migration.importing')
  try {
    await importUserBackup(event.data.backup, 'merge')
    status.value = copy.text('migration.received')
    window.opener?.postMessage({ type: 'laochristian-migration-complete' } satisfies MigrationMessage, trustedSourceOrigin)
  } catch (error) {
    status.value = error instanceof Error ? error.message : copy.text('migration.failed')
  }
}

function receiveComplete(event: MessageEvent<MigrationMessage>): void {
  if (!targetWindow || event.source !== targetWindow || event.origin !== new URL(targetUrl).origin || event.data?.type !== 'laochristian-migration-complete') return
  status.value = copy.text('migration.completeOld')
}

function beginTransfer(): void {
  if (!canTransfer.value) return
  window.addEventListener('message', sendBackup)
  window.addEventListener('message', receiveComplete)
  const destination = new URL('migrate?receive=1', targetUrl.endsWith('/') ? targetUrl : `${targetUrl}/`)
  targetWindow = window.open(destination, 'laochristian-domain-migration')
  status.value = targetWindow ? copy.text('migration.waitingNew') : copy.text('migration.popup')
}

onMounted(() => {
  if (!receiving.value || !window.opener) return
  window.addEventListener('message', receiveBackup)
  window.opener.postMessage({ type: 'laochristian-migration-ready' } satisfies MigrationMessage, trustedSourceOrigin)
  status.value = copy.text('migration.connected')
})

onBeforeUnmount(() => {
  window.removeEventListener('message', sendBackup)
  window.removeEventListener('message', receiveBackup)
  window.removeEventListener('message', receiveComplete)
})
</script>

<template>
  <main class="app-page">
    <section class="app-panel">
      <h1 class="app-section-title"><BilingualText text-key="migration.title" /></h1>
      <p class="app-muted mt-3"><BilingualText text-key="migration.help" /></p>

      <div v-if="receiving" class="mt-6 rounded-xl bg-[var(--lc-soft)] p-4" role="status">{{ status }}</div>
      <template v-else>
        <button v-if="canTransfer" type="button" class="lc-migration-action mt-6" @click="beginTransfer">{{ copy.text('migration.move') }} →</button>
        <p v-else class="mt-6 rounded-xl bg-[var(--lc-soft)] p-4"><BilingualText text-key="migration.notReady" /></p>
        <p v-if="status" class="mt-3 text-sm" role="status">{{ status }}</p>
        <hr class="app-divider">
        <h2 class="text-lg font-semibold"><BilingualText text-key="migration.manual" /></h2>
        <p class="app-muted mt-1 text-sm"><BilingualText text-key="migration.manualHelp" /></p>
        <router-link to="/study" class="app-link mt-3 inline-block">{{ copy.text('migration.openBackup') }} →</router-link>
      </template>
    </section>
  </main>
</template>

<style scoped>
.lc-migration-action { border-radius: 999px; background: var(--lc-brand); padding: .7rem 1rem; color: #f6f1e7; font-weight: 700; }
</style>
