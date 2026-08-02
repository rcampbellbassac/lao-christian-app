<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import indexData from '@/assets/data/index.json'
import { useUiText } from '@/composables/useUiText'

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
const text = useUiText()

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
      class="lc-card group cursor-pointer p-4"
      @click="openSet(item.id)"
    >
      <div class="flex items-start gap-3">
        <img :src="item.icon" alt="" class="h-14 w-14 shrink-0 rounded-xl bg-[var(--lc-soft)] p-2 object-contain" />
        <div class="min-w-0">
          <h3 class="text-base font-semibold text-slate-900 dark:text-slate-100 sm:text-lg">
            {{ item.native_name }}
            <span class="block text-xs font-medium text-slate-500 dark:text-slate-400 sm:inline sm:text-sm">({{ item.eng_name }})</span>
          </h3>
          <p class="mt-1 text-sm text-slate-600 dark:text-slate-300">
            {{ getLangDetails(item.lang)?.emoji_flag }} {{ getLangDetails(item.lang)?.native_name }}
          </p>
          <p class="lc-card-action mt-2 text-sm font-semibold">{{ text.lao('openCollection') }} <span v-if="text.english('openCollection')" class="font-normal">· {{ text.english('openCollection') }}</span> →</p>
        </div>
      </div>
    </li>
  </ul>
</template>
