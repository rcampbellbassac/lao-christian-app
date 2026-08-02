import { describe, expect, it } from 'vitest'
import { aspectRatioPresets } from '@/utils/aspectRatios'
import {
  getPresentationThemeBackground,
  presentationThemePresets,
} from '@/utils/presentationThemes'

describe('presentation themes', () => {
  it('provides unique artwork for every theme and aspect ratio', () => {
    const imageUrls = presentationThemePresets.flatMap((theme) =>
      aspectRatioPresets.map(({ id }) => theme.backgrounds[id]),
    )

    expect(imageUrls).toHaveLength(presentationThemePresets.length * aspectRatioPresets.length)
    expect(new Set(imageUrls)).toHaveLength(imageUrls.length)
    expect(imageUrls.every((url) => url.endsWith('.webp'))).toBe(true)
  })

  it('builds a non-repeating, cover background with a color fallback', () => {
    for (const theme of presentationThemePresets) {
      for (const { id } of aspectRatioPresets) {
        const background = getPresentationThemeBackground(theme, id)
        expect(background).toContain(theme.backgrounds[id])
        expect(background).toContain('center / cover no-repeat')
        expect(background).toContain(theme.background)
      }
    }
  })
})
