<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import { useStudyStore } from '@/stores/study'

const study = useStudyStore()
const importInput = ref<HTMLInputElement | null>(null)
const importMessage = ref('')
const importMode = ref<'merge' | 'replace'>('merge')

onMounted(() => study.load())

const hasItems = computed(() => study.bookmarks.length + study.highlights.length + study.notes.length > 0)

function contentPath(item: { fileId: number; bookId: number; chapterId: number }): string {
  return `/content/${item.fileId}/${item.bookId}/${item.chapterId}`
}

function exportBackup(): void {
  const blob = new Blob([JSON.stringify(study.createBackup(), null, 2)], { type: 'application/json' })
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.download = `laochristian-study-backup-${new Date().toISOString().slice(0, 10)}.json`
  link.click()
  URL.revokeObjectURL(url)
}

async function importBackup(event: Event): Promise<void> {
  const file = (event.target as HTMLInputElement).files?.[0]
  if (!file) return
  if (file.size > 10 * 1024 * 1024) {
    importMessage.value = 'Backup is too large.'
    return
  }
  try {
    await study.importBackup(JSON.parse(await file.text()), importMode.value)
    importMessage.value = importMode.value === 'merge' ? 'Backup merged successfully.' : 'Study data replaced successfully.'
  } catch (error) {
    importMessage.value = error instanceof Error ? error.message : 'Import failed.'
  } finally {
    if (importInput.value) importInput.value.value = ''
  }
}
</script>

<template>
  <main class="app-page">
    <section class="app-panel">
      <div class="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 class="app-section-title">ການສຶກສາຂອງຂ້ອຍ</h1>
          <p class="app-muted">My Study · Stored only on this device</p>
        </div>
        <div class="flex gap-2">
          <button type="button" class="app-chip" @click="exportBackup">Export JSON</button>
          <select v-model="importMode" class="app-chip" aria-label="Import mode">
            <option value="merge">Merge import</option>
            <option value="replace">Replace all</option>
          </select>
          <label class="app-chip cursor-pointer">
            Import JSON
            <input ref="importInput" type="file" accept="application/json,.json" class="sr-only" @change="importBackup">
          </label>
        </div>
      </div>
      <p class="mt-3 rounded-lg bg-[var(--lc-soft)] p-3 text-sm">
        Privacy notice: exported files contain your private notes and reading activity and are not encrypted.
      </p>
      <p v-if="importMessage" class="mt-2 text-sm">{{ importMessage }}</p>

      <div v-if="!hasItems" class="py-12 text-center app-muted">No saved study items yet.</div>

      <section v-if="study.history.length" class="mt-8">
        <h2 class="text-xl font-semibold">ອ່ານຕໍ່ · Continue reading</h2>
        <ul class="mt-3 grid gap-2 sm:grid-cols-2">
          <li v-for="item in study.history.slice(0, 6)" :key="`${item.fileId}:${item.bookId}:${item.chapterId}`" class="lc-card p-3">
            <router-link :to="contentPath(item)" class="app-link">{{ item.title }}</router-link>
            <p class="app-muted mt-1 text-xs">{{ new Date(item.visitedAt).toLocaleString() }}</p>
          </li>
        </ul>
      </section>

      <section v-if="study.bookmarks.length" class="mt-8">
        <h2 class="text-xl font-semibold">Bookmarks</h2>
        <ul class="mt-3 grid gap-2">
          <li v-for="item in study.bookmarks" :key="item.id" class="lc-card flex items-center justify-between gap-3 p-3">
            <router-link :to="contentPath(item)" class="app-link">{{ item.title }}</router-link>
            <button type="button" aria-label="Remove bookmark" @click="study.removeRecord('bookmarks', item.id)">×</button>
          </li>
        </ul>
      </section>

      <section v-if="study.highlights.length" class="mt-8">
        <h2 class="text-xl font-semibold">Highlights</h2>
        <ul class="mt-3 grid gap-2">
          <li v-for="item in study.highlights" :key="item.id" class="lc-card p-3">
            <router-link :to="contentPath(item)" class="app-link">{{ item.title }}</router-link>
            <p class="mt-2 line-clamp-3">{{ item.quote }}</p>
          </li>
        </ul>
      </section>

      <section v-if="study.notes.length" class="mt-8">
        <h2 class="text-xl font-semibold">Notes</h2>
        <ul class="mt-3 grid gap-2">
          <li v-for="item in study.notes" :key="item.id" class="lc-card p-3">
            <div class="flex justify-between gap-3"><router-link :to="contentPath(item)" class="app-link">{{ item.title }}</router-link><button type="button" aria-label="Delete note" @click="study.removeRecord('notes', item.id)">×</button></div>
            <p class="mt-2 whitespace-pre-wrap">{{ item.body }}</p>
          </li>
        </ul>
      </section>
    </section>
  </main>
</template>
