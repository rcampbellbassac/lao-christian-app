import { ref } from 'vue'
import { defineStore } from 'pinia'
import type { SelectionGroupingMode } from '@/utils/slideGenerators'

/**
 * Carries a user's paragraph selection from ChapterView's "Select
 * paragraphs" mode into Presentation mode. Deliberately session-only (not
 * persisted to localforage) -- it's tied to whatever chapter is currently
 * open, not a lasting preference.
 */
export const usePresentationSelectionStore = defineStore('presentationSelection', () => {
  const chapterId = ref<number | null>(null)
  const selectedBlockIndices = ref<Set<number>>(new Set())
  const groupingMode = ref<SelectionGroupingMode>('grouped')

  function setSelection(newChapterId: number, indices: Set<number>): void {
    chapterId.value = newChapterId
    selectedBlockIndices.value = indices
  }

  function setGroupingMode(mode: SelectionGroupingMode): void {
    groupingMode.value = mode
  }

  function hasSelectionFor(targetChapterId: number): boolean {
    return chapterId.value === targetChapterId && selectedBlockIndices.value.size > 0
  }

  function clear(): void {
    chapterId.value = null
    selectedBlockIndices.value = new Set()
  }

  return {
    chapterId,
    selectedBlockIndices,
    groupingMode,
    setSelection,
    setGroupingMode,
    hasSelectionFor,
    clear,
  }
})
