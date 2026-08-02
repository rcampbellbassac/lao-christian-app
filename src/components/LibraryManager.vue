<script setup lang="ts">
import { onMounted, ref } from 'vue'
import { useContentStore, type ContentCacheStatus } from '@/stores/content'

const content = useContentStore()
const statuses = ref<ContentCacheStatus[]>([])
const busyKey = ref<string | null>(null)
const message = ref('')
const storageLabel = ref('')

function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${Math.round(bytes / 1024)} KB`
  return `${(bytes / 1024 / 1024).toFixed(1)} MB`
}

async function refresh(): Promise<void> {
  statuses.value = await content.getContentCacheStatuses()
  if (navigator.storage?.estimate) {
    const estimate = await navigator.storage.estimate()
    storageLabel.value = `${formatBytes(estimate.usage ?? 0)} used locally`
  }
}

async function download(item: ContentCacheStatus): Promise<void> {
  busyKey.value = item.key
  message.value = ''
  try {
    await content.downloadContentSet(item.key)
    message.value = `${item.material.native_name} is available offline.`
  } catch {
    message.value = `Could not download ${item.material.native_name}. Check your connection.`
  } finally {
    busyKey.value = null
    await refresh()
  }
}

async function remove(item: ContentCacheStatus): Promise<void> {
  busyKey.value = item.key
  await content.removeContentSet(item.key)
  busyKey.value = null
  message.value = `${item.material.native_name} was removed from this device.`
  await refresh()
}

onMounted(refresh)
</script>

<template>
  <section>
    <div class="flex flex-wrap items-end justify-between gap-2">
      <div>
        <h2 class="text-xl font-semibold text-sky-900 dark:text-sky-100">ດາວໂຫຼດເນື້ອຫາ · Offline libraries</h2>
        <p class="app-muted mt-1 text-sm">Choose what is stored on this device. Downloaded libraries can be read and searched without a connection.</p>
      </div>
      <span v-if="storageLabel" class="app-chip">{{ storageLabel }}</span>
    </div>
    <p v-if="message" class="mt-3 rounded-lg bg-[var(--lc-soft)] p-3 text-sm">{{ message }}</p>
    <ul class="mt-4 grid gap-2">
      <li v-for="item in statuses" :key="item.key" class="lc-card flex flex-wrap items-center justify-between gap-3 p-3">
        <div class="flex min-w-0 items-center gap-3">
          <img :src="item.material.icon" alt="" class="h-10 w-10 object-contain">
          <div class="min-w-0">
            <p class="font-semibold">{{ item.material.native_name }}</p>
            <p class="app-muted text-xs">{{ item.cached ? `${formatBytes(item.approximateBytes)} · available offline` : 'Not downloaded' }}</p>
          </div>
        </div>
        <button v-if="!item.cached" type="button" class="app-chip" :disabled="busyKey === item.key" @click="download(item)">{{ busyKey === item.key ? '…' : 'Download' }}</button>
        <button v-else type="button" class="app-chip" :disabled="busyKey === item.key" @click="remove(item)">Remove</button>
      </li>
    </ul>
  </section>
</template>
