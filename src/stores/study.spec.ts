import { beforeEach, describe, expect, it, vi } from 'vitest'
import { createPinia, setActivePinia } from 'pinia'

const values = new Map<string, unknown>()

vi.mock('localforage', () => ({
  default: {
    createInstance: () => ({
      getItem: async (key: string) => values.get(key) ?? null,
      setItem: async (key: string, value: unknown) => {
        values.set(key, structuredClone(value))
        return value
      },
    }),
  },
}))

import { useStudyStore, type ContentLocation, type StudyBackupV1 } from './study'

const location: ContentLocation = {
  fileId: 1,
  bookId: 2,
  chapterId: 3,
  title: 'ບົດທົດສອບ',
}

describe('study store', () => {
  beforeEach(() => {
    values.clear()
    setActivePinia(createPinia())
  })

  it('persists bookmark toggles locally', async () => {
    const study = useStudyStore()
    expect(await study.toggleBookmark(location)).toBe(true)
    expect(study.isBookmarked(location)).toBe(true)
    expect(await study.toggleBookmark(location)).toBe(false)
    expect(study.bookmarks).toHaveLength(0)
  })

  it('round-trips a versioned backup', async () => {
    const study = useStudyStore()
    await study.toggleBookmark(location)
    await study.saveNote(location, 'Private note')
    const backup = study.createBackup()

    setActivePinia(createPinia())
    values.clear()
    const restored = useStudyStore()
    await restored.importBackup(backup, 'replace')

    expect(restored.bookmarks).toHaveLength(1)
    expect(restored.notes[0]?.body).toBe('Private note')
  })

  it('stores paragraph and precise text highlights independently', async () => {
    const study = useStudyStore()
    const paragraph = { ...location, blockIndex: 4, quote: 'A complete paragraph' }

    await study.toggleParagraphHighlight(paragraph)
    await study.addTextHighlight(paragraph, 'complete', 'A ', ' paragraph')

    expect(study.isParagraphHighlighted(paragraph)).toBe(true)
    expect(study.textHighlights(paragraph)).toMatchObject([
      { scope: 'text', exact: 'complete', prefix: 'A ', suffix: ' paragraph' },
    ])

    await study.toggleParagraphHighlight(paragraph)
    expect(study.isParagraphHighlighted(paragraph)).toBe(false)
    expect(study.textHighlights(paragraph)).toHaveLength(1)
  })

  it('reanchors precise highlights and marks missing ones for review', async () => {
    const study = useStudyStore()
    const paragraph = { ...location, blockIndex: 0, quote: 'Before original words after the passage.' }
    await study.addTextHighlight(paragraph, 'original words', 'Before ', ' after the passage.')

    await study.reconcileTextHighlights(location, ['Before revised words after the passage.'])
    expect(study.highlights[0]).toMatchObject({ exact: 'revised words', quote: 'revised words', unmatched: false })

    await study.reconcileTextHighlights(location, ['Unrelated replacement content'])
    expect(study.highlights[0]?.unmatched).toBe(true)
  })

  it('rejects files that are not study backups', async () => {
    const study = useStudyStore()
    await expect(study.importBackup({ schemaVersion: 1 } as StudyBackupV1)).rejects.toThrow(
      'not a valid LaoChristian study backup',
    )
  })
})
