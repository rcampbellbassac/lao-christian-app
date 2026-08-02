<script setup lang="ts">
import { onMounted, ref } from 'vue'
import { useContentStore } from '@/stores/content'
import { searchContentSets, type CachedSearchSet, type ContentSearchResult } from '@/utils/contentSearch'

const content = useContentStore()
const query = ref('')
const results = ref<ContentSearchResult[]>([])
const cachedSets = ref<CachedSearchSet[]>([])
const loading = ref(true)

onMounted(async () => {
  cachedSets.value = await content.getCachedContentSets()
  loading.value = false
})

function runSearch(): void {
  results.value = searchContentSets(cachedSets.value, query.value)
}
</script>

<template>
  <main class="app-page">
    <section class="app-panel">
      <h1 class="app-section-title">ຄົ້ນຫາ</h1>
      <p class="app-muted">Search downloaded Lao content and existing English titles. No content is translated.</p>
      <form class="mt-5 flex gap-2" @submit.prevent="runSearch">
        <input v-model="query" type="search" minlength="2" required autofocus class="search-input" placeholder="ຄົ້ນຫາ…" aria-label="Search">
        <button type="submit" class="search-submit">ຄົ້ນຫາ</button>
      </form>
      <p class="app-muted mt-3 text-sm">
        {{ loading ? 'Loading local indexes…' : `${cachedSets.length} downloaded libraries available to search.` }}
      </p>
      <div v-if="!loading && cachedSets.length === 0" class="mt-6 rounded-lg bg-[var(--lc-soft)] p-4">
        Open a library while online to download it. It will then be searchable here, including offline.
      </div>
      <ol class="mt-6 grid gap-3">
        <li v-for="result in results" :key="`${result.fileId}:${result.bookId}:${result.chapterId}`" class="lc-card p-4">
          <router-link :to="`/content/${result.fileId}/${result.bookId}/${result.chapterId}`" class="app-link text-lg">{{ result.chapterTitle }}</router-link>
          <p class="app-muted mt-1 text-sm">{{ result.collectionTitle }} · {{ result.bookTitle }}</p>
          <p class="mt-2 line-clamp-3">{{ result.snippet }}</p>
        </li>
      </ol>
      <p v-if="query.length >= 2 && !results.length && !loading" class="app-muted mt-8 text-center">No matching downloaded content.</p>
    </section>
  </main>
</template>

<style scoped>
.search-input { min-width: 0; flex: 1; border: 1px solid var(--lc-border); border-radius: 999px; padding: .7rem 1rem; background: var(--app-panel); color: var(--app-ink); }
.search-submit { border-radius: 999px; padding: .7rem 1.2rem; background: var(--lc-brand); color: #f6f1e7; font-weight: 600; }
</style>
