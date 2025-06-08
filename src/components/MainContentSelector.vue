<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import indexData from '@/assets/data/index.json'

interface UrlItem {
  id: number
  eng_name: string
  native_name: string
  url: string
  lang: string
  icon: string
}

interface LangItem {
  name: string
  native_name: string
  emoji_flag: string
}

const urls = ref<UrlItem[]>([])
const langs = ref<LangItem[]>([])
const router = useRouter()

onMounted(() => {
  const data = indexData as {
    urls?: UrlItem[]
    langs?: LangItem[]
    default?: { urls?: UrlItem[]; langs?: LangItem[] }
  }

  urls.value = data.urls || data.default?.urls || []
  langs.value = data.langs || data.default?.langs || []
})

function getLangDetails(langName: string): LangItem | undefined {
  return langs.value.find((lang) => lang.name === langName)
}

function openSet(fileId: number) {
  router.push({ path: `/content/${fileId}` })
}
</script>

<template>
  <ul class="space-y-4 max-w-3xl mx-auto px-4">
    <li
      v-for="item in urls"
      :key="item.id"
      class="p-4 border rounded-lg shadow hover:shadow-md transition bg-slate-200 dark:bg-slate-700 dark:border-gray-600"
    >
      <div class="flex items-center space-x-4 cursor-pointer" @click="openSet(item.id)">
        <img :src="item.icon" alt="Set icon" class="h-14 w-14 object-contain" />
        <div>
          <h3 class="text-lg font-semibold text-gray-900 dark:text-gray-100">
            {{ item.native_name }} <span class="text-sm text-gray-700 dark:text-gray-400">({{ item.eng_name }})</span>
          </h3>
          <p class="text-sm text-gray-600 dark:text-gray-400">
            {{ getLangDetails(item.lang)?.emoji_flag }} {{ getLangDetails(item.lang)?.native_name }}
          </p>
        </div>
      </div>
    </li>
  </ul>
</template>
