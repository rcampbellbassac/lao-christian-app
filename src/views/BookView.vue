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

const book = computed(() =>
  store.currentSetData?.unit.find((unit) => unit.id === bookId)
)
</script>

<template>
  <main class="app-page">
    <section class="app-panel">
      <BreadcrumbNav />
    <section v-if="book">
      <h1 class="app-section-title mb-2">{{ book.name }}</h1>
      <p v-if="book.content" v-html="book.content" class="mb-4 text-sm text-slate-600 dark:text-slate-300"></p>
      <div>
        <h2 class="mb-3 text-lg font-semibold text-slate-800 dark:text-slate-100">Chapters</h2>
        <ul class="app-card-list">
          <li
            v-for="content in book.contents"
            :key="content.id"
            class="rounded-xl border border-slate-300/70 bg-white/85 p-3 dark:border-slate-500/55 dark:bg-slate-950/88"
          >
            <router-link
              :to="`/content/${fileId}/${bookId}/${content.id}`"
              class="app-link"
            >
              📄 <span v-html="content.name"></span>
            </router-link>
          </li>
        </ul>
      </div>
    </section>

    <section v-else>
      <p class="text-center text-slate-600 dark:text-slate-300">Loading book...</p>
    </section>
    </section>
  </main>
</template>
