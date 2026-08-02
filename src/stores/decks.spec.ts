import { beforeEach, describe, expect, it, vi } from 'vitest'
import { createPinia, setActivePinia } from 'pinia'

const values = new Map<string, unknown>()
vi.mock('localforage', () => ({
  default: {
    createInstance: () => ({
      getItem: async (key: string) => values.get(key) ?? null,
      setItem: async (key: string, value: unknown) => { values.set(key, JSON.parse(JSON.stringify(value))); return value },
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
    expect(deck.slides[0]?.source?.chapterId).toBe(3)
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
    expect(deck.slides.map(slide => slide.title)).toEqual(['Second', 'Second', 'First'])
  })
})
