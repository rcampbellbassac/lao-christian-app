<script setup lang="ts">
import { onMounted, computed } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useContentStore } from '@/stores/content'
import BreadcrumbNav from '@/components/BreadcrumbNav.vue'

const route = useRoute()
const router = useRouter()
const store = useContentStore()

onMounted(async () => {
  const fileId = parseInt(route.params.fileid as string, 10)
  await store.loadIndex()

  const key = store.getKeyFromId(fileId)
  if (!key) {
    router.push({ name: 'home' })
    return
  }

  try {
    await store.loadContentSet(key)
  } catch (err) {
    console.warn(err)
    router.push({ name: 'home' })
  }
})

const contentSet = computed(() => store.currentSetData)
</script>

<template>
  <main class="mx-auto max-w-3xl  min-w-3/7 p-6 mb-20 bg-white rounded-xl shadow-lg outline outline-black/5 dark:bg-slate-800 dark:shadow-none dark:outline-white/10 overflow-y-auto">
    <BreadcrumbNav />
    <section v-if="contentSet">
      <div class="flex items-center mb-4">
        <img :src="store.getSetById(parseInt(route.params.fileid as string, 10))?.icon" alt="Set Icon" class="h-16 mr-4" />
        <div>
          <h1 v-html="contentSet.title" class="text-3xl font-bold"></h1>
          <p v-html="contentSet.description" class="text-sm text-gray-600 dark:text-gray-400 mt-1"></p>
        </div>
      </div>

      <hr class="my-6 border-gray-300 dark:border-gray-600" />

      <h2 class="text-xl font-semibold mb-4">Books</h2>
      <ul class="space-y-2">
        <li v-for="book in contentSet.unit" :key="book.id" class="border-b pb-2 border-gray-300 dark:border-gray-600">
          <router-link
            :to="{ path: `/content/${route.params.fileid}/${book.id}` }"
            class="text-blue-700 dark:text-blue-300 hover:underline text-lg"
          >
            📘 <span v-html="book.name"></span>
          </router-link>
          <p v-if="book.content" class="text-gray-600 dark:text-gray-400 text-sm mt-1"><span v-html="book.content"></span></p>
        </li>
      </ul>
    </section>

    <section v-else>
      <p class="text-center text-gray-600 dark:text-gray-300">Loading content set...</p>
    </section>
  </main>
</template>
