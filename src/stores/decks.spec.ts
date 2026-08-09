import { beforeEach, describe, expect, it, vi } from 'vitest'
import { createPinia, setActivePinia } from 'pinia'

const values = new Map<string, unknown>()
vi.mock('localforage', () => ({
  default: {
    createInstance: () => ({
      getItem: async (key: string) => values.get(key) ?? null,
      setItem: async (key: string, value: unknown) => {
        values.set(key, JSON.parse(JSON.stringify(value)))
        return value
      },
    }),
  },
}))

import { useDeckStore } from './decks'

describe('deck store', () => {
  beforeEach(() => {
    values.clear()
    setActivePinia(createPinia())
  })

  it('creates and edits a persistent structured deck', async () => {
    const store = useDeckStore()
    const deck = await store.createDeck('Sabbath service')
    const slide = await store.addSlide(deck)
    slide.title = 'Welcome'
    slide.speakerNotes = 'Pause before reading'
    await store.saveDeck(deck)

    expect(store.decks).toHaveLength(1)
    expect(store.getDeck(deck.id)?.slides[0]?.speakerNotes).toBe('Pause before reading')
  })

  it('copies generated slides with source attribution', async () => {
    const store = useDeckStore()
    const deck = await store.createFromSlides(
      'Genesis',
      [{ id: 'source-1', title: '<b>Genesis</b>', html: '<p>ພຣະເຈົ້າ</p>' }],
      { fileId: 1, bookId: 2, chapterId: 3 },
      '16:9',
      'forest',
    )
    expect(deck.slides[0]?.title).toBe('Genesis')
    expect(deck.slides[0]?.layout).toBe('content')
    expect(deck.slides[0]?.source?.chapterId).toBe(3)
  })

  it('preserves generated title-slide layout', async () => {
    const store = useDeckStore()
    const deck = await store.createFromSlides(
      'Genesis',
      [{ id: 'title', title: 'Genesis', html: 'The first book' }],
      { fileId: 1, bookId: 2, chapterId: 3 },
      '16:9',
      'forest',
    )

    expect(deck.slides[0]?.layout).toBe('title')
  })

  it('appends slides from different resources to one deck', async () => {
    const store = useDeckStore()
    const deck = await store.createFromSlides(
      'Sabbath service',
      [{ id: 'title', title: 'Genesis', html: 'Creation' }],
      { fileId: 1, bookId: 2, chapterId: 3 },
      '16:9',
      'forest',
    )

    const added = await store.appendSlides(
      deck,
      [{ id: 'content-1', title: 'Worship song', html: '<p>Sing together</p>' }],
      { fileId: 2, bookId: 8, chapterId: 13 },
    )

    expect(added).toHaveLength(1)
    expect(deck.slides.map((slide) => slide.title)).toEqual(['Genesis', 'Worship song'])
    expect(deck.slides.map((slide) => slide.source?.fileId)).toEqual([1, 2])
    expect(new Set(deck.slides.map((slide) => slide.id)).size).toBe(2)
    expect(deck.aspectRatio).toBe('16:9')
    expect(deck.theme).toBe('forest')
  })

  it('removes slides only from the selected deck', async () => {
    const store = useDeckStore()
    const firstDeck = await store.createDeck('First')
    const secondDeck = await store.createDeck('Second')
    await store.addSlide(firstDeck)
    await store.addSlide(secondDeck)

    await store.removeSlide(secondDeck, 0)

    expect(firstDeck.slides).toHaveLength(1)
    expect(secondDeck.slides).toHaveLength(0)
  })

  it('reorders and duplicates slides', async () => {
    const store = useDeckStore()
    const deck = await store.createDeck()
    const first = await store.addSlide(deck)
    first.title = 'First'
    const second = await store.addSlide(deck)
    second.title = 'Second'
    await store.moveSlide(deck, 1, -1)
    await store.duplicateSlide(deck, 0)
    expect(deck.slides.map((slide) => slide.title)).toEqual(['Second', 'Second', 'First'])
  })

  it('merges backups by deck id and newest update time', async () => {
    const store = useDeckStore()
    const deck = await store.createDeck('Original')
    const backup = store.createBackupData()
    backup.decks[0]!.name = 'Restored'
    backup.decks[0]!.updatedAt = '9999-01-01T00:00:00.000Z'

    await store.importBackupData(backup, 'merge')

    expect(store.decks).toHaveLength(1)
    expect(store.getDeck(deck.id)?.name).toBe('Restored')
  })
})
