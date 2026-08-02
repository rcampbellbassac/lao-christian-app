export interface DeckPresentationState {
  type: 'state'
  deckId: string
  index: number
  blank: boolean
  nonce: string
}

export function deckChannelName(deckId: string): string {
  return `laochristian-deck-${deckId}`
}

export function deckStorageKey(deckId: string): string {
  return `laochristian-deck-state-${deckId}`
}

export function isDeckPresentationState(value: unknown, deckId: string): value is DeckPresentationState {
  if (!value || typeof value !== 'object') return false
  const state = value as Partial<DeckPresentationState>
  return state.type === 'state' && state.deckId === deckId && Number.isInteger(state.index) && typeof state.blank === 'boolean'
}
