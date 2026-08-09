import { computed, ref } from 'vue'
import { defineStore } from 'pinia'
import localforage from 'localforage'
import type { AspectRatioId } from '@/utils/aspectRatios'
import type { PresentationThemeId } from '@/utils/presentationThemes'
import type { LaoFontId } from '@/utils/laoFonts'
import type { PresentationTextAlign } from '@/stores/settings'
import type { Slide } from '@/utils/slideGenerators'
import { contentHtmlToText } from '@/utils/sanitize'

export interface DeckSlide {
  id: string
  title: string
  html: string
  layout?: 'title' | 'content'
  speakerNotes: string
  hidden: boolean
  source?: DeckSlideSource
}

export interface DeckSlideSource {
  fileId: number
  bookId: number
  chapterId: number
}

export interface Deck {
  id: string
  name: string
  createdAt: string
  updatedAt: string
  aspectRatio: AspectRatioId
  theme: PresentationThemeId
  fontScale: number
  fontFamily: LaoFontId
  textAlign: PresentationTextAlign
  slides: DeckSlide[]
}

export interface DeckDataV1 {
  schemaVersion: 1
  decks: Deck[]
}

const storage = localforage.createInstance({
  name: 'lao-christian-app',
  storeName: 'user-slide-decks',
  description: 'Local-only editable presentation decks',
})

const STORAGE_KEY = 'decks-v1'

function snapshot<T>(value: T): T {
  return JSON.parse(JSON.stringify(value)) as T
}

function createDeckSlides(slides: Slide[], source: DeckSlideSource): DeckSlide[] {
  return slides.map((slide) => ({
    id: crypto.randomUUID(),
    title: contentHtmlToText(slide.title),
    html: slide.html,
    layout: slide.id === 'title' ? 'title' : 'content',
    speakerNotes: '',
    hidden: false,
    source: snapshot(source),
  }))
}

export const useDeckStore = defineStore('decks', () => {
  const data = ref<DeckDataV1>({ schemaVersion: 1, decks: [] })
  const isLoaded = ref(false)

  async function load(): Promise<void> {
    if (isLoaded.value) return
    const stored = await storage.getItem<DeckDataV1>(STORAGE_KEY)
    if (stored?.schemaVersion === 1 && Array.isArray(stored.decks)) {
      data.value = stored
      data.value.decks.forEach((deck) => {
        deck.fontScale ??= 1
        deck.fontFamily ??= 'noto-sans-lao'
        deck.textAlign ??= 'left'
      })
    }
    isLoaded.value = true
  }

  async function persist(): Promise<void> {
    await storage.setItem(STORAGE_KEY, snapshot(data.value))
  }

  function getDeck(id: string): Deck | undefined {
    return data.value.decks.find((deck) => deck.id === id)
  }

  async function createDeck(name = 'New presentation'): Promise<Deck> {
    await load()
    const now = new Date().toISOString()
    const deck: Deck = {
      id: crypto.randomUUID(),
      name,
      createdAt: now,
      updatedAt: now,
      aspectRatio: '16:9',
      theme: 'forest',
      fontScale: 1,
      fontFamily: 'noto-sans-lao',
      textAlign: 'left',
      slides: [],
    }
    data.value.decks.unshift(deck)
    await persist()
    return deck
  }

  async function createFromSlides(
    name: string,
    slides: Slide[],
    source: DeckSlideSource,
    aspectRatio: AspectRatioId,
    theme: PresentationThemeId,
    fontScale = 1,
    fontFamily: LaoFontId = 'noto-sans-lao',
    textAlign: PresentationTextAlign = 'left',
  ): Promise<Deck> {
    const deck = await createDeck(name)
    deck.aspectRatio = aspectRatio
    deck.theme = theme
    deck.fontScale = fontScale
    deck.fontFamily = fontFamily
    deck.textAlign = textAlign
    deck.slides = createDeckSlides(slides, source)
    deck.updatedAt = new Date().toISOString()
    await persist()
    return deck
  }

  async function appendSlides(
    deck: Deck,
    slides: Slide[],
    source: DeckSlideSource,
  ): Promise<DeckSlide[]> {
    await load()
    if (!slides.length) return []
    const added = createDeckSlides(slides, source)
    deck.slides.push(...added)
    await saveDeck(deck)
    return added
  }

  async function saveDeck(deck: Deck): Promise<void> {
    deck.updatedAt = new Date().toISOString()
    await persist()
  }

  async function addSlide(deck: Deck, afterIndex = deck.slides.length - 1): Promise<DeckSlide> {
    const slide: DeckSlide = {
      id: crypto.randomUUID(),
      title: 'New slide',
      html: '<p></p>',
      layout: 'content',
      speakerNotes: '',
      hidden: false,
    }
    deck.slides.splice(afterIndex + 1, 0, slide)
    await saveDeck(deck)
    return slide
  }

  async function duplicateSlide(deck: Deck, index: number): Promise<void> {
    const source = deck.slides[index]
    if (!source) return
    deck.slides.splice(index + 1, 0, { ...snapshot(source), id: crypto.randomUUID() })
    await saveDeck(deck)
  }

  async function moveSlide(deck: Deck, index: number, direction: -1 | 1): Promise<void> {
    const target = index + direction
    if (target < 0 || target >= deck.slides.length) return
    const [slide] = deck.slides.splice(index, 1)
    deck.slides.splice(target, 0, slide)
    await saveDeck(deck)
  }

  async function removeSlide(deck: Deck, index: number): Promise<void> {
    deck.slides.splice(index, 1)
    await saveDeck(deck)
  }

  async function removeDeck(id: string): Promise<void> {
    data.value.decks = data.value.decks.filter((deck) => deck.id !== id)
    await persist()
  }

  function createBackupData(): DeckDataV1 {
    return snapshot(data.value)
  }

  async function importBackupData(value: DeckDataV1, mode: 'merge' | 'replace'): Promise<void> {
    await load()
    if (value?.schemaVersion !== 1 || !Array.isArray(value.decks))
      throw new Error('Invalid slide deck backup data.')
    if (mode === 'replace') data.value = snapshot(value)
    else {
      const merged = new Map(data.value.decks.map((deck) => [deck.id, deck]))
      for (const deck of value.decks) {
        const current = merged.get(deck.id)
        if (!current || deck.updatedAt > current.updatedAt) merged.set(deck.id, snapshot(deck))
      }
      data.value.decks = [...merged.values()].sort((a, b) => b.updatedAt.localeCompare(a.updatedAt))
    }
    await persist()
  }

  return {
    decks: computed(() => data.value.decks),
    isLoaded,
    load,
    getDeck,
    createDeck,
    createFromSlides,
    appendSlides,
    saveDeck,
    addSlide,
    duplicateSlide,
    moveSlide,
    removeSlide,
    removeDeck,
    createBackupData,
    importBackupData,
  }
})
