import { describe, expect, it } from 'vitest'
import { reanchorText } from './textAnchors'

describe('text anchors', () => {
  it('uses context to select the right repeated phrase', () => {
    const result = reanchorText('first grace here; later grace remains', {
      exact: 'grace', prefix: 'later ', suffix: ' remains',
    })
    expect(result?.prefix).toContain('later ')
  })

  it('recovers revised selected words between stable contexts', () => {
    const result = reanchorText('Before the newly revised words after the passage.', {
      exact: 'original words', prefix: 'Before the ', suffix: ' after the passage.',
    })
    expect(result?.exact).toBe('newly revised words')
  })

  it('returns null when context is no longer identifiable', () => {
    expect(reanchorText('Completely different content', {
      exact: 'missing', prefix: 'old prefix ', suffix: ' old suffix',
    })).toBeNull()
  })
})
