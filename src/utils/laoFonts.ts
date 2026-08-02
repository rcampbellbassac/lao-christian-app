export type LaoFontId =
  | 'noto-sans-lao'
  | 'noto-sans-lao-looped'
  | 'noto-serif-lao'
  | 'phetsarath'
  | 'saysettha'
  | 'sengbuhan'
  | 'saysettha-mai'
  | 'sengpathom'

export interface LaoFontPreset {
  id: LaoFontId
  label: string
  /** Value used directly in the CSS font-family declaration. */
  cssFamily: string
  /** Where the font is loaded from -- affects how main.css pulls it in. */
  source: 'package' | 'local'
}

export const laoFontPresets: LaoFontPreset[] = [
  {
    id: 'noto-sans-lao',
    label: 'Noto Sans Lao (default)',
    cssFamily: '"Noto Sans Lao Variable"',
    source: 'package',
  },
  {
    id: 'noto-sans-lao-looped',
    label: 'Noto Sans Lao Looped',
    cssFamily: '"Noto Sans Lao Looped Variable"',
    source: 'package',
  },
  {
    id: 'noto-serif-lao',
    label: 'Noto Serif Lao',
    cssFamily: '"Noto Serif Lao Variable"',
    source: 'package',
  },
  {
    id: 'phetsarath',
    label: 'Phetsarath',
    cssFamily: '"Phetsarath"',
    source: 'package',
  },
  {
    id: 'saysettha',
    label: 'Saysettha (Version 2)',
    cssFamily: '"Saysettha"',
    source: 'local',
  },
  {
    id: 'sengbuhan',
    label: 'SengBuhan',
    cssFamily: '"SengBuhan"',
    source: 'local',
  },
  {
    id: 'saysettha-mai',
    label: 'Saysettha Mai',
    cssFamily: '"Saysettha Mai"',
    source: 'local',
  },
  {
    id: 'sengpathom',
    label: 'SengPathom',
    cssFamily: '"SengPathom"',
    source: 'local',
  },
]

export const DEFAULT_LAO_FONT_ID: LaoFontId = 'noto-sans-lao'

export function getLaoFontPreset(id: LaoFontId): LaoFontPreset {
  return laoFontPresets.find((preset) => preset.id === id) ?? laoFontPresets[0]
}
