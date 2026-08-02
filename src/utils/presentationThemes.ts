import type { AspectRatioId } from '@/utils/aspectRatios'

import forest16x9 from '@/assets/presentation-backgrounds/forest-16x9.webp'
import forest4x3 from '@/assets/presentation-backgrounds/forest-4x3.webp'
import forest1x1 from '@/assets/presentation-backgrounds/forest-1x1.webp'
import forestA4 from '@/assets/presentation-backgrounds/forest-a4.webp'
import midnight16x9 from '@/assets/presentation-backgrounds/midnight-16x9.webp'
import midnight4x3 from '@/assets/presentation-backgrounds/midnight-4x3.webp'
import midnight1x1 from '@/assets/presentation-backgrounds/midnight-1x1.webp'
import midnightA4 from '@/assets/presentation-backgrounds/midnight-a4.webp'
import plainLight16x9 from '@/assets/presentation-backgrounds/plain-light-16x9.webp'
import plainLight4x3 from '@/assets/presentation-backgrounds/plain-light-4x3.webp'
import plainLight1x1 from '@/assets/presentation-backgrounds/plain-light-1x1.webp'
import plainLightA4 from '@/assets/presentation-backgrounds/plain-light-a4.webp'
import plum16x9 from '@/assets/presentation-backgrounds/plum-16x9.webp'
import plum4x3 from '@/assets/presentation-backgrounds/plum-4x3.webp'
import plum1x1 from '@/assets/presentation-backgrounds/plum-1x1.webp'
import plumA4 from '@/assets/presentation-backgrounds/plum-a4.webp'
import slate16x9 from '@/assets/presentation-backgrounds/slate-16x9.webp'
import slate4x3 from '@/assets/presentation-backgrounds/slate-4x3.webp'
import slate1x1 from '@/assets/presentation-backgrounds/slate-1x1.webp'
import slateA4 from '@/assets/presentation-backgrounds/slate-a4.webp'

export type PresentationThemeId = 'midnight' | 'slate' | 'forest' | 'plum' | 'plain-light'
export type PresentationLogoTone = 'light' | 'dark'

export interface PresentationThemePreset {
  id: PresentationThemeId
  label: string
  background: string
  backgrounds: Record<AspectRatioId, string>
  textColor: string
  mutedColor: string
  logoTone: PresentationLogoTone
}

const backgrounds = (
  widescreen: string,
  standard: string,
  square: string,
  portrait: string,
): Record<AspectRatioId, string> => ({
  '16:9': widescreen,
  '4:3': standard,
  '1:1': square,
  a4: portrait,
})

export const presentationThemePresets: PresentationThemePreset[] = [
  {
    id: 'midnight',
    label: 'Midnight (default)',
    background: '#071b36',
    backgrounds: backgrounds(midnight16x9, midnight4x3, midnight1x1, midnightA4),
    textColor: '#f8fafc',
    mutedColor: '#d9e5f3',
    logoTone: 'light',
  },
  {
    id: 'slate',
    label: 'Slate',
    background: '#25313b',
    backgrounds: backgrounds(slate16x9, slate4x3, slate1x1, slateA4),
    textColor: '#f8fafc',
    mutedColor: '#dbe4ec',
    logoTone: 'light',
  },
  {
    id: 'forest',
    label: 'Forest',
    background: '#073c33',
    backgrounds: backgrounds(forest16x9, forest4x3, forest1x1, forestA4),
    textColor: '#f3fff9',
    mutedColor: '#cef3df',
    logoTone: 'light',
  },
  {
    id: 'plum',
    label: 'Deep Purple',
    background: '#38183f',
    backgrounds: backgrounds(plum16x9, plum4x3, plum1x1, plumA4),
    textColor: '#fff8ff',
    mutedColor: '#f0d9f3',
    logoTone: 'light',
  },
  {
    id: 'plain-light',
    label: 'Plain Light',
    background: '#fbf4e3',
    backgrounds: backgrounds(plainLight16x9, plainLight4x3, plainLight1x1, plainLightA4),
    textColor: '#17202a',
    mutedColor: '#46525d',
    logoTone: 'dark',
  },
]

export const DEFAULT_PRESENTATION_THEME_ID: PresentationThemeId = 'midnight'

export function getPresentationThemePreset(id: PresentationThemeId): PresentationThemePreset {
  return presentationThemePresets.find((preset) => preset.id === id) ?? presentationThemePresets[0]
}

export function getPresentationThemeBackground(
  theme: PresentationThemePreset,
  aspectRatio: AspectRatioId,
): string {
  return `url("${theme.backgrounds[aspectRatio]}") center / cover no-repeat, ${theme.background}`
}
