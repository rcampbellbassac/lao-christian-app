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
  <main class="mx-auto max-w-3xl min-w-3/7 p-6 mb-20 bg-white rounded-xl shadow-lg outline outline-black/5 dark:bg-slate-800 dark:shadow-none dark:outline-white/10 overflow-y-auto">
    <BreadcrumbNav />
    <section v-if="book">
      <h1 class="text-3xl font-bold mb-2">{{ book.name }}</h1>
      <p v-if="book.content" v-html="book.content" class="text-sm text-gray-600 dark:text-gray-400 mb-6"></p>
      <div>
        <h2 class="text-xl font-semibold mb-3">Chapters</h2>
        <ul class="space-y-1">
          <li
            v-for="content in book.contents"
            :key="content.id"
            class="text-blue-700 dark:text-blue-300 hover:underline"
          >
            <router-link
              :to="`/content/${fileId}/${bookId}/${content.id}`"
            >
              📄 <span v-html="content.name"></span>
            </router-link>
          </li>
        </ul>
      </div>
    </section>

    <section v-else>
      <p class="text-center text-gray-600 dark:text-gray-300">Loading book...</p>
    </section>
  </main>
</template>
