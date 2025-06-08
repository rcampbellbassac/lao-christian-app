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
  <main class="mx-auto max-w-3xl min-w-11/12 p-6 mb-20 bg-white rounded-xl shadow-lg outline outline-black/5 dark:bg-slate-800 dark:shadow-none dark:outline-white/10 overflow-y-auto">
    <BreadcrumbNav />
    <section v-if="chapter">
      <h1 class="text-2xl font-bold mb-2">{{ chapter.name }}</h1>
      <div class="prose dark:prose-invert max-w-none" v-html="chapter.content" />
      <div v-if="chapter.audioembed || chapter.videoembed" class="mt-4">
        <div v-if="chapter.audioembed" v-html="chapter.audioembed" />
        <div v-if="chapter.videoembed" v-html="chapter.videoembed" />
      </div>
    </section>
    <section v-else>
      <p class="text-center text-gray-500 dark:text-gray-300">
        Loading chapter...
      </p>
    </section>
  </main>
</template>
