export type PresentationThemeId = 'midnight' | 'slate' | 'forest' | 'plum' | 'plain-light'

export interface PresentationThemePreset {
  id: PresentationThemeId
  label: string
  background: string
  textColor: string
  mutedColor: string
}

export const presentationThemePresets: PresentationThemePreset[] = [
  {
    id: 'midnight',
    label: 'Midnight (default)',
    background:
      'radial-gradient(circle at top right, rgba(56, 189, 248, 0.18), rgba(15, 23, 42, 0.95))',
    textColor: '#f8fafc',
    mutedColor: '#cbd5e1',
  },
  {
    id: 'slate',
    label: 'Slate',
    background:
      'radial-gradient(circle at top right, rgba(148, 163, 184, 0.2), rgba(30, 41, 59, 0.97))',
    textColor: '#f1f5f9',
    mutedColor: '#cbd5e1',
  },
  {
    id: 'forest',
    label: 'Forest',
    background:
      'radial-gradient(circle at top right, rgba(45, 212, 191, 0.2), rgba(6, 46, 40, 0.96))',
    textColor: '#ecfdf5',
    mutedColor: '#a7f3d0',
  },
  {
    id: 'plum',
    label: 'Deep Purple',
    background:
      'radial-gradient(circle at top right, rgba(217, 70, 239, 0.16), rgba(49, 20, 71, 0.96))',
    textColor: '#faf5ff',
    mutedColor: '#e9d5ff',
  },
  {
    id: 'plain-light',
    label: 'Plain Light',
    background: '#ffffff',
    textColor: '#0f172a',
    mutedColor: '#475569',
  },
]

export const DEFAULT_PRESENTATION_THEME_ID: PresentationThemeId = 'midnight'

export function getPresentationThemePreset(id: PresentationThemeId): PresentationThemePreset {
  return presentationThemePresets.find((preset) => preset.id === id) ?? presentationThemePresets[0]
}
