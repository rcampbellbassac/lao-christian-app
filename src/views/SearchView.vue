<script setup lang="ts">
import { onMounted, ref } from 'vue'
import { useContentStore } from '@/stores/content'
import { searchContentSets, type CachedSearchSet, type ContentSearchResult } from '@/utils/contentSearch'
import { useStaticText } from '@/composables/useStaticText'
import BilingualText from '@/components/BilingualText.vue'

const content = useContentStore()
const query = ref('')
const results = ref<ContentSearchResult[]>([])
const cachedSets = ref<CachedSearchSet[]>([])
const loading = ref(true)
const copy = useStaticText()

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
      <p class="app-muted"><BilingualText text-key="search.help" /></p>
      <form class="mt-5 flex gap-2" @submit.prevent="runSearch">
        <input v-model="query" type="search" minlength="2" required autofocus class="search-input" :placeholder="copy.lao('search.placeholder')" :aria-label="copy.text('search.placeholder')">
        <button type="submit" class="search-submit">ຄົ້ນຫາ</button>
      </form>
      <p class="app-muted mt-3 text-sm">
        {{ loading ? copy.text('search.loading') : `${cachedSets.length} ${copy.text('search.libraries')}` }}
      </p>
      <div v-if="!loading && cachedSets.length === 0" class="mt-6 rounded-lg bg-[var(--lc-soft)] p-4">
        <BilingualText text-key="search.emptyLibrary" />
      </div>
      <ol class="mt-6 grid gap-3">
        <li v-for="result in results" :key="`${result.fileId}:${result.bookId}:${result.chapterId}`" class="lc-card p-4">
          <router-link :to="`/content/${result.fileId}/${result.bookId}/${result.chapterId}`" class="app-link text-lg">{{ result.chapterTitle }}</router-link>
          <p class="app-muted mt-1 text-sm">{{ result.collectionTitle }} · {{ result.bookTitle }}</p>
          <p class="mt-2 line-clamp-3">{{ result.snippet }}</p>
        </li>
      </ol>
      <p v-if="query.length >= 2 && !results.length && !loading" class="app-muted mt-8 text-center"><BilingualText text-key="search.noResults" /></p>
    </section>
  </main>
</template>

<style scoped>
.search-input { min-width: 0; flex: 1; border: 1px solid var(--lc-border); border-radius: 999px; padding: .7rem 1rem; background: var(--app-panel); color: var(--app-ink); }
.search-submit { border-radius: 999px; padding: .7rem 1.2rem; background: var(--lc-brand); color: #f6f1e7; font-weight: 600; }
</style>
