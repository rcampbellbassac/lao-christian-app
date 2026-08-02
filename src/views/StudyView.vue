<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import { useStudyStore } from '@/stores/study'
import { createUserBackup, downloadUserBackup, importUserBackup } from '@/utils/userBackup'

const study = useStudyStore()
const importInput = ref<HTMLInputElement | null>(null)
const importMessage = ref('')
const importMode = ref<'merge' | 'replace'>('merge')

onMounted(() => study.load())

const hasItems = computed(() => study.bookmarks.length + study.highlights.length + study.notes.length > 0)

function contentPath(item: { fileId: number; bookId: number; chapterId: number }): string {
  return `/content/${item.fileId}/${item.bookId}/${item.chapterId}`
}

async function exportBackup(): Promise<void> {
  downloadUserBackup(await createUserBackup())
}

async function importBackup(event: Event): Promise<void> {
  const file = (event.target as HTMLInputElement).files?.[0]
  if (!file) return
  if (file.size > 10 * 1024 * 1024) {
    importMessage.value = 'Backup is too large.'
    return
  }
  try {
    await importUserBackup(JSON.parse(await file.text()), importMode.value)
    importMessage.value = importMode.value === 'merge' ? 'Backup merged successfully.' : 'Local data replaced successfully.'
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
          <button type="button" class="app-chip" @click="exportBackup">Export all JSON</button>
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
        Privacy notice: exported files contain private notes, reading activity, slide decks, and preferences. They are not encrypted.
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
            <div class="flex items-start justify-between gap-3">
              <router-link :to="contentPath(item)" class="app-link">{{ item.title }}</router-link>
              <button type="button" aria-label="Delete highlight" @click="study.removeRecord('highlights', item.id)">×</button>
            </div>
            <p class="mt-2 line-clamp-3">{{ item.quote }}</p>
            <p v-if="item.unmatched" class="mt-2 text-xs font-semibold text-amber-700 dark:text-amber-300">Content changed · open the chapter to review this unmatched highlight.</p>
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
