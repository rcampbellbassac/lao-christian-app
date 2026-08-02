<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import { useStudyStore } from '@/stores/study'
import { createUserBackup, downloadUserBackup, importUserBackup } from '@/utils/userBackup'
import { useStaticText } from '@/composables/useStaticText'
import BilingualText from '@/components/BilingualText.vue'
import DevelopmentNotice from '@/components/DevelopmentNotice.vue'

const study = useStudyStore()
const importInput = ref<HTMLInputElement | null>(null)
const importMessage = ref('')
const importMode = ref<'merge' | 'replace'>('merge')
const copy = useStaticText()

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
    importMessage.value = copy.text('study.backupTooLarge')
    return
  }
  try {
    await importUserBackup(JSON.parse(await file.text()), importMode.value)
    importMessage.value = importMode.value === 'merge' ? copy.text('study.backupMerged') : copy.text('study.backupReplaced')
  } catch (error) {
    importMessage.value = error instanceof Error ? error.message : copy.text('study.importFailed')
  } finally {
    if (importInput.value) importInput.value.value = ''
  }
}
</script>

<template>
  <main class="app-page">
    <section class="app-panel">
      <DevelopmentNotice />
      <div class="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 class="app-section-title">ການສຶກສາຂອງຂ້ອຍ</h1>
          <p class="app-muted"><BilingualText text-key="study.localOnly" /></p>
        </div>
        <div class="flex gap-2">
          <button type="button" class="app-chip" @click="exportBackup">⇩ {{ copy.text('study.export') }}</button>
          <select v-model="importMode" class="app-chip" :aria-label="copy.text('study.importMode')">
            <option value="merge">{{ copy.text('study.merge') }}</option>
            <option value="replace">{{ copy.text('study.replace') }}</option>
          </select>
          <label class="app-chip cursor-pointer">
            ⇧ {{ copy.text('study.import') }}
            <input ref="importInput" type="file" accept="application/json,.json" class="sr-only" @change="importBackup">
          </label>
        </div>
      </div>
      <p class="mt-3 rounded-lg bg-[var(--lc-soft)] p-3 text-sm">
        <BilingualText text-key="study.privateWarning" />
      </p>
      <p v-if="importMessage" class="mt-2 text-sm">{{ importMessage }}</p>

      <div v-if="!hasItems" class="py-12 text-center app-muted"><BilingualText text-key="study.empty" /></div>

      <section v-if="study.history.length" class="mt-8">
        <h2 class="text-xl font-semibold"><BilingualText text-key="study.continue" /></h2>
        <ul class="mt-3 grid gap-2 sm:grid-cols-2">
          <li v-for="item in study.history.slice(0, 6)" :key="`${item.fileId}:${item.bookId}:${item.chapterId}`" class="lc-card p-3">
            <router-link :to="contentPath(item)" class="app-link">{{ item.title }}</router-link>
            <p class="app-muted mt-1 text-xs">{{ new Date(item.visitedAt).toLocaleString() }}</p>
          </li>
        </ul>
      </section>

      <section v-if="study.bookmarks.length" class="mt-8">
        <h2 class="text-xl font-semibold"><BilingualText text-key="study.bookmarks" /></h2>
        <ul class="mt-3 grid gap-2">
          <li v-for="item in study.bookmarks" :key="item.id" class="lc-card flex items-center justify-between gap-3 p-3">
            <router-link :to="contentPath(item)" class="app-link">{{ item.title }}</router-link>
            <button type="button" :aria-label="copy.text('study.removeBookmark')" :title="copy.text('study.removeBookmark')" @click="study.removeRecord('bookmarks', item.id)">×</button>
          </li>
        </ul>
      </section>

      <section v-if="study.highlights.length" class="mt-8">
        <h2 class="text-xl font-semibold"><BilingualText text-key="study.highlights" /></h2>
        <ul class="mt-3 grid gap-2">
          <li v-for="item in study.highlights" :key="item.id" class="lc-card p-3">
            <div class="flex items-start justify-between gap-3">
              <router-link :to="contentPath(item)" class="app-link">{{ item.title }}</router-link>
              <button type="button" :aria-label="copy.text('study.deleteHighlight')" :title="copy.text('study.deleteHighlight')" @click="study.removeRecord('highlights', item.id)">×</button>
            </div>
            <p class="mt-2 line-clamp-3">{{ item.quote }}</p>
            <p v-if="item.unmatched" class="mt-2 text-xs font-semibold text-amber-700 dark:text-amber-300"><BilingualText text-key="study.unmatched" /></p>
          </li>
        </ul>
      </section>

      <section v-if="study.notes.length" class="mt-8">
        <h2 class="text-xl font-semibold"><BilingualText text-key="study.notes" /></h2>
        <ul class="mt-3 grid gap-2">
          <li v-for="item in study.notes" :key="item.id" class="lc-card p-3">
            <div class="flex justify-between gap-3"><router-link :to="contentPath(item)" class="app-link">{{ item.title }}</router-link><button type="button" :aria-label="copy.text('study.deleteNote')" :title="copy.text('study.deleteNote')" @click="study.removeRecord('notes', item.id)">×</button></div>
            <p class="mt-2 whitespace-pre-wrap">{{ item.body }}</p>
          </li>
        </ul>
      </section>
    </section>
  </main>
</template>
