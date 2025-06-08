import { ref } from 'vue'
import { defineStore } from 'pinia'
import localforage from 'localforage'
import indexData from '@/assets/data/index.json'


// LocalForage config
localforage.config({
  name: 'lao-christian-app',
  storeName: 'content-store',
  description: 'Store for content data in Lao Christian App',
})

// ---------- Interfaces ----------

export interface TocItem {
  id: number
  name: string
  content: string
  type: number
  units_id: number
  created_at: string
  updated_at: string
  sortorder: number
}

export interface ContentItem {
  id: number
  name: string
  content: string
  pdfurl: string
  audiourl: string
  videourl: string
  audioembed: string
  videoembed: string
  units_id: number
  created_at: string
  updated_at: string
  sortorder: number
}

export interface Unit {
  id: number
  name: string
  content: string | null
  enabled: number
  books_id: number
  created_at: string
  updated_at: string
  sortorder: number
  toc: TocItem[]
  contents: ContentItem[]
}

export interface ContentSet {
  id: number
  title: string
  description: string
  imageurl: string
  enabled: number
  created_at: string
  updated_at: string
  language: string
  sortorder: number
  series: number
  lang: number
  unit: Unit[]
}

export interface Lang {
  name: string
  native_name: string
  emoji_flag: string
}

export interface MaterialSet {
  id: number
  eng_name: string
  native_name: string
  url: string
  lang: Lang
  icon: string
}

export interface ContentState {
  indexList: MaterialSet[]
  currentSetKey: string | null
  currentSetData: ContentSet | null
}

// ---------- Store ----------

export const useContentStore = defineStore('content', () => {
  const indexList = ref<MaterialSet[]>([])
  const currentSetKey = ref<string | null>(null)
  const currentSetData = ref<ContentSet | null>(null)

  function _keyFromUrl(url: string): string {
    return url.split('/').pop()?.replace('.json', '') ?? ''
  }

  async function loadIndex(): Promise<void> {
    if (indexList.value.length > 0) return
    indexList.value = indexData.urls.map((item: {
      id: number
      eng_name: string
      native_name: string
      url: string
      lang: string | Lang
      icon: string
    }) => ({
      ...item,
      lang: typeof item.lang === 'string'
        ? { name: item.lang, native_name: item.lang, emoji_flag: '' }
        : item.lang
    }))
  }

  async function loadContentSet(setKey: string): Promise<void> {
    if (currentSetKey.value === setKey && currentSetData.value) return

    currentSetKey.value = null
    currentSetData.value = null

    // Try localForage
    const cached = await localforage.getItem<ContentSet>(setKey)
    if (cached) {
      currentSetKey.value = setKey
      currentSetData.value = cached
      return
    }

    // Fetch from remote if not cached
    const match = indexList.value.find(item => _keyFromUrl(item.url) === setKey)
    if (!match) throw new Error(`Material set "${setKey}" not found in index`)

    const res = await fetch(match.url)
    if (!res.ok) throw new Error(`Failed to fetch ${match.url}`)

    const data = await res.json() as ContentSet

    await localforage.setItem(setKey, data)

    currentSetKey.value = setKey
    currentSetData.value = data
  }

  async function removeContentSet(setKey: string): Promise<void> {
    await localforage.removeItem(setKey)
    if (currentSetKey.value === setKey) {
      currentSetKey.value = null
      currentSetData.value = null
    }
  }

  function getSetById(id: number): MaterialSet | undefined {
    return indexList.value.find(item => item.id === id)
  }

  function getKeyFromId(id: number): string | undefined {
    const match = getSetById(id)
    return match ? _keyFromUrl(match.url) : undefined
  }

  return {
    indexList,
    currentSetKey,
    currentSetData,
    loadIndex,
    loadContentSet,
    removeContentSet,
    getSetById,
    getKeyFromId,
  }
})
