<script setup lang="ts">
import { computed } from 'vue'
import { useRoute } from 'vue-router'
import { useContentStore } from '@/stores/content'

const route = useRoute()
const store = useContentStore()

const fileId = computed(() => parseInt(route.params.fileid as string))
const bookId = computed(() => parseInt(route.params.bookid as string))
const chapterId = computed(() => parseInt(route.params.chapterid as string))

const breadcrumbs = computed(() => {
  const crumbs = []

  if (fileId.value && store.indexList.length > 0) {
    const file = store.getSetById(fileId.value)
    if (file) {
      crumbs.push({
        name: file.native_name || file.eng_name,
        path: `/content/${fileId.value}`,
      })
    }
  }

  if (bookId.value && store.currentSetData) {
    const book = store.currentSetData.unit.find(u => u.id === bookId.value)
    if (book) {
      crumbs.push({
        name: book.name,
        path: `/content/${fileId.value}/${bookId.value}`,
      })
    }
  }

  if (chapterId.value && store.currentSetData) {
    const unit = store.currentSetData.unit.find(u => u.id === bookId.value)
    const chapter = unit?.contents.find(c => c.id === chapterId.value)
    if (chapter) {
      crumbs.push({
        name: chapter.name,
        path: `/content/${fileId.value}/${bookId.value}/${chapterId.value}`,
      })
    }
  }

  return crumbs
})
</script>

<template>
  <nav aria-label="Breadcrumb" class="mb-4 rounded-xl border border-slate-300/60 bg-white/80 px-3 py-2 text-sm text-slate-700 shadow-sm dark:border-slate-500/50 dark:bg-slate-950/82 dark:text-slate-200">
    <ul class="flex flex-wrap items-center gap-x-2 gap-y-1">
      <li>
        <router-link to="/" class="font-semibold text-teal-700 hover:underline dark:text-teal-300">🏠 Home</router-link>
      </li>
      <li v-for="(crumb) in breadcrumbs" :key="crumb.path" class="flex items-center gap-2">
        <span class="text-slate-400">/</span>
        <router-link :to="crumb.path" class="line-clamp-1 max-w-[16rem] hover:underline">
          {{ crumb.name }}
        </router-link>
      </li>
    </ul>
  </nav>
</template>
