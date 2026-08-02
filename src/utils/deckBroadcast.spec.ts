import { describe, expect, it } from 'vitest'
import { deckChannelName, deckStorageKey, isDeckPresentationState } from './deckBroadcast'

describe('deck presentation messaging', () => {
  it('uses deck-scoped channel and fallback storage names', () => {
    expect(deckChannelName('abc')).toBe('laochristian-deck-abc')
    expect(deckStorageKey('abc')).toBe('laochristian-deck-state-abc')
  })

  it('accepts only state messages for the requested deck', () => {
    const state = { type: 'state', deckId: 'abc', index: 2, blank: false, nonce: 'n' }
    expect(isDeckPresentationState(state, 'abc')).toBe(true)
    expect(isDeckPresentationState(state, 'other')).toBe(false)
    expect(isDeckPresentationState({ ...state, index: 1.5 }, 'abc')).toBe(false)
  })
})
