import { beforeEach, describe, expect, it, vi } from 'vitest'
import { createPinia, setActivePinia } from 'pinia'

const stores = new Map<string, Map<string, unknown>>()
vi.mock('localforage', () => ({
  default: {
    createInstance: (options: { storeName: string }) => ({
      getItem: async (key: string) => stores.get(options.storeName)?.get(key) ?? null,
      setItem: async (key: string, value: unknown) => {
        if (!stores.has(options.storeName)) stores.set(options.storeName, new Map())
        stores.get(options.storeName)!.set(key, structuredClone(value))
        return value
      },
    }),
  },
}))

import { useStudyStore } from '@/stores/study'
import { useDeckStore } from '@/stores/decks'
import { createUserBackup, importUserBackup } from './userBackup'

describe('complete user backup', () => {
  beforeEach(() => {
    stores.clear()
    setActivePinia(createPinia())
  })

  it('moves study data and decks through the versioned format', async () => {
    await useStudyStore().toggleBookmark({ fileId: 1, bookId: 2, chapterId: 3, title: 'Chapter' })
    await useDeckStore().createDeck('Service')
    const backup = await createUserBackup()

    stores.clear()
    setActivePinia(createPinia())
    await importUserBackup(backup, 'replace')

    expect(useStudyStore().bookmarks[0]?.title).toBe('Chapter')
    expect(useDeckStore().decks[0]?.name).toBe('Service')
  })
})
