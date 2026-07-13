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
  <ul class="app-card-list mx-auto">
    <li
      v-for="item in urls"
      :key="item.id"
      class="group cursor-pointer rounded-2xl border border-slate-300/70 bg-white/92 p-4 shadow transition hover:-translate-y-0.5 hover:shadow-lg dark:border-slate-500/55 dark:bg-slate-950/90"
      @click="openSet(item.id)"
    >
      <div class="flex items-start gap-3">
        <img :src="item.icon" alt="Set icon" class="h-14 w-14 shrink-0 rounded-xl bg-slate-100 p-2 object-contain dark:bg-slate-700" />
        <div class="min-w-0">
          <h3 class="text-base font-semibold text-slate-900 dark:text-slate-100 sm:text-lg">
            {{ item.native_name }}
            <span class="block text-xs font-medium text-slate-500 dark:text-slate-400 sm:inline sm:text-sm">({{ item.eng_name }})</span>
          </h3>
          <p class="mt-1 text-sm text-slate-600 dark:text-slate-300">
            {{ getLangDetails(item.lang)?.emoji_flag }} {{ getLangDetails(item.lang)?.native_name }}
          </p>
          <p class="mt-2 text-xs font-semibold uppercase tracking-wide text-teal-700 group-hover:text-teal-600 dark:text-teal-300 dark:group-hover:text-teal-200">Open collection</p>
        </div>
      </div>
    </li>
  </ul>
</template>
