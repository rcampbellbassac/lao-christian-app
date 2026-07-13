<script setup lang="ts">
import { computed, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useContentStore } from '@/stores/content'
import BreadcrumbNav from '@/components/BreadcrumbNav.vue'

const route = useRoute()
const router = useRouter()
const store = useContentStore()

const fileId = parseInt(route.params.fileid as string, 10)
const bookId = parseInt(route.params.bookid as string, 10)
const chapterId = parseInt(route.params.chapterid as string, 10)

onMounted(async () => {
  await store.loadIndex()
  const key = store.getKeyFromId(fileId)
  if (!key) {
    router.push({ name: 'home' })
    return
  }
  try {
    await store.loadContentSet(key)
  } catch (err) {
    console.error(err)
    router.push({ name: 'home' })
  }
})

const unit = computed(() =>
  store.currentSetData?.unit.find((unit) => unit.id === bookId)
)

const chapter = computed(() =>
  unit.value?.contents.find((c) => c.id === chapterId)
)
</script>

<template>
  <main class="app-page">
    <section class="app-panel">
      <BreadcrumbNav />
    <section v-if="chapter">
      <div class="mb-4 flex justify-end">
        <router-link
          :to="`/present/${fileId}/${bookId}/${chapterId}`"
          class="inline-flex items-center rounded-full bg-teal-700 px-4 py-2 text-sm font-semibold text-white shadow transition hover:bg-teal-800"
        >
          Presentation mode
        </router-link>
      </div>
      <h1 class="app-section-title mb-3"><span v-html="chapter.name"></span></h1>
      <div class="prose prose-slate max-w-none dark:prose-invert" v-html="chapter.content" />
      <div v-if="chapter.audioembed || chapter.videoembed" class="mt-5 rounded-xl border border-slate-300/70 bg-white/75 p-3 dark:border-slate-500/50 dark:bg-slate-950/86">
        <div v-if="chapter.audioembed" v-html="chapter.audioembed" />
        <div v-if="chapter.videoembed" v-html="chapter.videoembed" />
      </div>
    </section>
    <section v-else>
      <p class="text-center text-slate-500 dark:text-slate-300">
        Loading chapter...
      </p>
    </section>
    </section>
  </main>
</template>
