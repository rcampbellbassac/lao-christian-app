import { ref } from 'vue'
import { defineStore } from 'pinia'
import localforage from 'localforage'
import indexData from '@/assets/data/index.json'
import type { SlideContentType } from '@/utils/slideGenerators'


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
  content_type?: SlideContentType
}

export interface ContentState {
  indexList: MaterialSet[]
  currentSetKey: string | null
  currentSetData: ContentSet | null
}

interface CachedSetEnvelope {
  data: ContentSet
  fetchedAt: string
  sourceUpdate: string | null
  etag: string | null
  lastModified: string | null
}

const CONTENT_REFRESH_WINDOW_MS = 1000 * 60 * 60 * 6

// ---------- Store ----------

export const useContentStore = defineStore('content', () => {
  const indexList = ref<MaterialSet[]>([])
  const currentSetKey = ref<string | null>(null)
  const currentSetData = ref<ContentSet | null>(null)
  const indexUpdate = ref<string | null>(null)
  const lastContentRefresh = ref<string | null>(null)

  function _metaKey(setKey: string): string {
    return `${setKey}::__meta`
  }

  function _isEnvelope(value: unknown): value is CachedSetEnvelope {
    return Boolean(
      value &&
      typeof value === 'object' &&
      'data' in value &&
      'fetchedAt' in value
    )
  }

  function _isStale(iso: string): boolean {
    const checkedAt = Date.parse(iso)
    if (!Number.isFinite(checkedAt)) return true
    return Date.now() - checkedAt > CONTENT_REFRESH_WINDOW_MS
  }

  function _isCatalogUpdateNewer(cached: string | null, incoming: string | null): boolean {
    if (!incoming) return false
    if (!cached) return true
    const cachedTime = Date.parse(cached)
    const incomingTime = Date.parse(incoming)
    if (!Number.isFinite(cachedTime) || !Number.isFinite(incomingTime)) return incoming !== cached
    return incomingTime > cachedTime
  }

  function _keyFromUrl(url: string): string {
    return url.split('/').pop()?.replace('.json', '') ?? ''
  }

  function _resolveContentUrl(url: string): string {
    // Absolute URLs keep existing behavior.
    if (/^https?:\/\//i.test(url)) return url

    const base = import.meta.env.VITE_CONTENT_BASE_URL
    if (!base) return url

    const normalizedBase = base.endsWith('/') ? base : `${base}/`
    const normalizedPath = url.startsWith('/') ? url.slice(1) : url
    return new URL(normalizedPath, normalizedBase).toString()
  }

  function _normalizeContentType(value: string | undefined): SlideContentType {
    if (!value) return 'default'
    const normalized = value.toLowerCase()
    if (normalized === 'bible') return 'bible'
    if (normalized === 'songs' || normalized === 'song') return 'songs'
    if (normalized === 'studies' || normalized === 'study' || normalized === 'prose') return 'studies'
    return 'default'
  }

  function _inferContentType(material: MaterialSet, setKey: string): SlideContentType {
    if (material.content_type) return _normalizeContentType(material.content_type)

    const combined = `${material.eng_name} ${setKey}`.toLowerCase()
    if (combined.includes('bible') && !combined.includes('stud')) return 'bible'
    if (combined.includes('song')) return 'songs'
    if (combined.includes('study') || combined.includes('health') || combined.includes('egw') || combined.includes('story')) {
      return 'studies'
    }
    return 'default'
  }

  async function loadIndex(): Promise<void> {
    if (indexList.value.length > 0) return
    indexUpdate.value = indexData.update ?? null
    indexList.value = indexData.urls.map((item: {
      id: number
      eng_name: string
      native_name: string
      url: string
      lang: string | Lang
      icon: string
      content_type?: string
    }) => ({
      ...item,
      content_type: _normalizeContentType(item.content_type),
      lang: typeof item.lang === 'string'
        ? { name: item.lang, native_name: item.lang, emoji_flag: '' }
        : item.lang
    }))
  }

  async function loadContentSet(setKey: string): Promise<void> {
    currentSetKey.value = null
    currentSetData.value = null

    const match = indexList.value.find(item => _keyFromUrl(item.url) === setKey)
    if (!match) throw new Error(`Material set "${setKey}" not found in index`)
    const sourceUrl = _resolveContentUrl(match.url)

    const cachedRaw = await localforage.getItem<ContentSet | CachedSetEnvelope>(setKey)
    const cachedMeta = await localforage.getItem<CachedSetEnvelope>(_metaKey(setKey))

    let cachedData: ContentSet | null = null
    let fetchedAt: string | null = null
    let sourceUpdate: string | null = null
    let etag: string | null = null
    let lastModified: string | null = null

    if (cachedRaw) {
      if (_isEnvelope(cachedRaw)) {
        cachedData = cachedRaw.data
        fetchedAt = cachedRaw.fetchedAt
        sourceUpdate = cachedRaw.sourceUpdate
        etag = cachedRaw.etag
        lastModified = cachedRaw.lastModified
      } else {
        cachedData = cachedRaw
      }
    }

    if (cachedMeta) {
      fetchedAt = cachedMeta.fetchedAt
      sourceUpdate = cachedMeta.sourceUpdate
      etag = cachedMeta.etag
      lastModified = cachedMeta.lastModified
    }

    if (cachedData) {
      currentSetKey.value = setKey
      currentSetData.value = cachedData
    }

    const shouldRefresh = !cachedData ||
      !fetchedAt ||
      _isStale(fetchedAt) ||
      _isCatalogUpdateNewer(sourceUpdate, indexUpdate.value)

    if (!shouldRefresh && currentSetData.value) {
      return
    }

    const requestHeaders = new Headers()
    if (etag) requestHeaders.set('If-None-Match', etag)
    if (lastModified) requestHeaders.set('If-Modified-Since', lastModified)

    try {
      const res = await fetch(sourceUrl, {
        cache: 'no-store',
        headers: requestHeaders,
      })

      if (res.status === 304 && cachedData) {
        const refreshedMeta: CachedSetEnvelope = {
          data: cachedData,
          fetchedAt: new Date().toISOString(),
          sourceUpdate: indexUpdate.value,
          etag,
          lastModified,
        }
        await localforage.setItem(_metaKey(setKey), refreshedMeta)
        lastContentRefresh.value = refreshedMeta.fetchedAt
        return
      }

      if (!res.ok) throw new Error(`Failed to fetch ${sourceUrl}`)

      const data = await res.json() as ContentSet

      const freshEnvelope: CachedSetEnvelope = {
        data,
        fetchedAt: new Date().toISOString(),
        sourceUpdate: indexUpdate.value,
        etag: res.headers.get('etag'),
        lastModified: res.headers.get('last-modified'),
      }

      await localforage.setItem(setKey, freshEnvelope)
      await localforage.setItem(_metaKey(setKey), freshEnvelope)

      currentSetKey.value = setKey
      currentSetData.value = data
      lastContentRefresh.value = freshEnvelope.fetchedAt
      return
    } catch (err) {
      if (cachedData) {
        console.warn(`Falling back to cached content for ${setKey}`, err)
        lastContentRefresh.value = fetchedAt
        return
      }
      throw err
    }
  }

  async function removeContentSet(setKey: string): Promise<void> {
    await localforage.removeItem(setKey)
    await localforage.removeItem(_metaKey(setKey))
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

  function getCurrentContentType(): SlideContentType {
    if (!currentSetKey.value) return 'default'
    const material = indexList.value.find(item => _keyFromUrl(item.url) === currentSetKey.value)
    if (!material) return 'default'
    return _inferContentType(material, currentSetKey.value)
  }

  return {
    indexList,
    currentSetKey,
    currentSetData,
    indexUpdate,
    lastContentRefresh,
    loadIndex,
    loadContentSet,
    removeContentSet,
    getSetById,
    getKeyFromId,
    getCurrentContentType,
  }
})
