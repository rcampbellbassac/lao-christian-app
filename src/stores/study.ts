import { computed, ref } from 'vue'
import { defineStore } from 'pinia'
import localforage from 'localforage'

export interface ContentLocation {
  fileId: number
  bookId: number
  chapterId: number
  blockIndex?: number
  title: string
  bookTitle?: string
  quote?: string
}

export interface StudyRecord extends ContentLocation {
  id: string
  createdAt: string
  updatedAt: string
}

export interface HighlightRecord extends StudyRecord {
  color: 'gold' | 'sage' | 'river' | 'clay'
  scope?: 'paragraph' | 'text'
  exact?: string
  prefix?: string
  suffix?: string
}

export interface NoteRecord extends StudyRecord {
  body: string
}

export interface HistoryRecord extends ContentLocation {
  visitedAt: string
}

export interface StudyDataV1 {
  schemaVersion: 1
  bookmarks: StudyRecord[]
  highlights: HighlightRecord[]
  notes: NoteRecord[]
  history: HistoryRecord[]
}

export interface StudyBackupV1 extends StudyDataV1 {
  kind: 'laochristian-study-backup'
  exportedAt: string
}

const studyStorage = localforage.createInstance({
  name: 'lao-christian-app',
  storeName: 'user-study-data',
  description: 'Local-only bookmarks, highlights, notes, and reading history',
})

const STORAGE_KEY = 'study-data-v1'
const MAX_HISTORY = 50

function emptyData(): StudyDataV1 {
  return { schemaVersion: 1, bookmarks: [], highlights: [], notes: [], history: [] }
}

function recordId(prefix: string): string {
  return `${prefix}-${crypto.randomUUID()}`
}

function locationKey(location: ContentLocation): string {
  return [location.fileId, location.bookId, location.chapterId, location.blockIndex ?? 'chapter'].join(':')
}

function isValidBackup(value: unknown): value is StudyBackupV1 {
  if (!value || typeof value !== 'object') return false
  const candidate = value as Partial<StudyBackupV1>
  return candidate.kind === 'laochristian-study-backup'
    && candidate.schemaVersion === 1
    && Array.isArray(candidate.bookmarks)
    && Array.isArray(candidate.highlights)
    && Array.isArray(candidate.notes)
    && Array.isArray(candidate.history)
}

export const useStudyStore = defineStore('study', () => {
  const data = ref<StudyDataV1>(emptyData())
  const isLoaded = ref(false)

  async function persist(): Promise<void> {
    // IndexedDB cannot structured-clone Vue's reactive proxy. Persist a plain,
    // schema-shaped snapshot so browsers and backup tests behave identically.
    const snapshot = JSON.parse(JSON.stringify(data.value)) as StudyDataV1
    await studyStorage.setItem(STORAGE_KEY, snapshot)
  }

  async function load(): Promise<void> {
    if (isLoaded.value) return
    const stored = await studyStorage.getItem<StudyDataV1>(STORAGE_KEY)
    if (stored?.schemaVersion === 1) data.value = stored
    isLoaded.value = true
  }

  function isBookmarked(location: ContentLocation): boolean {
    const key = locationKey(location)
    return data.value.bookmarks.some(item => locationKey(item) === key)
  }

  async function toggleBookmark(location: ContentLocation): Promise<boolean> {
    await load()
    const key = locationKey(location)
    const existing = data.value.bookmarks.findIndex(item => locationKey(item) === key)
    if (existing >= 0) {
      data.value.bookmarks.splice(existing, 1)
      await persist()
      return false
    }
    const now = new Date().toISOString()
    data.value.bookmarks.unshift({ ...location, id: recordId('bookmark'), createdAt: now, updatedAt: now })
    await persist()
    return true
  }

  function isHighlighted(location: ContentLocation): boolean {
    const key = locationKey(location)
    return data.value.highlights.some(item => locationKey(item) === key)
  }

  function isParagraphHighlighted(location: ContentLocation): boolean {
    const key = locationKey(location)
    return data.value.highlights.some(item => locationKey(item) === key && item.scope !== 'text')
  }

  function textHighlights(location: ContentLocation): HighlightRecord[] {
    const key = locationKey(location)
    return data.value.highlights.filter(item => locationKey(item) === key && item.scope === 'text' && Boolean(item.exact))
  }

  async function toggleParagraphHighlight(location: ContentLocation): Promise<boolean> {
    await load()
    const key = locationKey(location)
    const existing = data.value.highlights.findIndex(item => locationKey(item) === key && item.scope !== 'text')
    if (existing >= 0) {
      data.value.highlights.splice(existing, 1)
      await persist()
      return false
    }
    const now = new Date().toISOString()
    data.value.highlights.unshift({
      ...location,
      id: recordId('highlight'),
      color: 'gold',
      scope: 'paragraph',
      exact: location.quote,
      createdAt: now,
      updatedAt: now,
    })
    await persist()
    return true
  }

  async function addTextHighlight(location: ContentLocation, exact: string, prefix = '', suffix = ''): Promise<void> {
    await load()
    const selected = exact.trim()
    if (selected.length < 2) return
    const key = locationKey(location)
    if (data.value.highlights.some(item => locationKey(item) === key && item.exact === selected)) return
    const now = new Date().toISOString()
    data.value.highlights.unshift({
      ...location,
      quote: selected,
      exact: selected,
      scope: 'text',
      prefix,
      suffix,
      id: recordId('highlight'),
      color: 'gold',
      createdAt: now,
      updatedAt: now,
    })
    await persist()
  }

  async function saveNote(location: ContentLocation, body: string): Promise<void> {
    await load()
    const trimmed = body.trim()
    if (!trimmed) return
    const now = new Date().toISOString()
    data.value.notes.unshift({ ...location, body: trimmed, id: recordId('note'), createdAt: now, updatedAt: now })
    await persist()
  }

  async function removeRecord(type: 'bookmarks' | 'highlights' | 'notes', id: string): Promise<void> {
    await load()
    if (type === 'bookmarks') data.value.bookmarks = data.value.bookmarks.filter(item => item.id !== id)
    if (type === 'highlights') data.value.highlights = data.value.highlights.filter(item => item.id !== id)
    if (type === 'notes') data.value.notes = data.value.notes.filter(item => item.id !== id)
    await persist()
  }

  async function recordVisit(location: ContentLocation): Promise<void> {
    await load()
    const key = locationKey(location)
    data.value.history = [
      { ...location, visitedAt: new Date().toISOString() },
      ...data.value.history.filter(item => locationKey(item) !== key),
    ].slice(0, MAX_HISTORY)
    await persist()
  }

  function createBackup(): StudyBackupV1 {
    return { kind: 'laochristian-study-backup', exportedAt: new Date().toISOString(), ...data.value }
  }

  async function importBackup(value: unknown, mode: 'merge' | 'replace' = 'merge'): Promise<void> {
    if (!isValidBackup(value)) throw new Error('This is not a valid LaoChristian study backup.')
    await load()
    if (mode === 'replace') {
      data.value = {
        schemaVersion: 1,
        bookmarks: value.bookmarks,
        highlights: value.highlights,
        notes: value.notes,
        history: value.history.slice(0, MAX_HISTORY),
      }
    } else {
      const mergeById = <T extends { id: string; updatedAt: string }>(current: T[], incoming: T[]): T[] => {
        const records = new Map(current.map(item => [item.id, item]))
        for (const item of incoming) {
          const previous = records.get(item.id)
          if (!previous || item.updatedAt > previous.updatedAt) records.set(item.id, item)
        }
        return [...records.values()]
      }
      data.value = {
        schemaVersion: 1,
        bookmarks: mergeById(data.value.bookmarks, value.bookmarks),
        highlights: mergeById(data.value.highlights, value.highlights),
        notes: mergeById(data.value.notes, value.notes),
        history: [...value.history, ...data.value.history].slice(0, MAX_HISTORY),
      }
    }
    await persist()
  }

  return {
    data,
    isLoaded,
    bookmarks: computed(() => data.value.bookmarks),
    highlights: computed(() => data.value.highlights),
    notes: computed(() => data.value.notes),
    history: computed(() => data.value.history),
    load,
    isBookmarked,
    toggleBookmark,
    isHighlighted,
    isParagraphHighlighted,
    textHighlights,
    toggleParagraphHighlight,
    addTextHighlight,
    saveNote,
    removeRecord,
    recordVisit,
    createBackup,
    importBackup,
  }
})
